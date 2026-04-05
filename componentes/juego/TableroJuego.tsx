"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CartaComponente from "../cartas/Carta";
import { usarEstadoJuego } from "../../ganchos/usarEstadoJuego";
import { usarSocket } from "../../ganchos/usarSocket";
import { obtenerSocket } from "../../lib/socket";
import type { BattleAction, Carta, UnitInPlay } from "../../motor/tipos";

function enviarAccion(action: BattleAction) {
  obtenerSocket().emit("battle:action", action);
}

function tituloFase(fase: string): string {
  switch (fase) {
    case "TURN_DRAW":
      return "1. Tomar carta";
    case "TURN_ATTACK":
      return "2. Atacar / Asedio / Poder";
    case "TURN_SABOTAGE":
      return "3. Robar / Espiar";
    case "TURN_TRADE":
      return "4. Comerciar";
    case "TURN_BUILD":
      return "5. Construir";
    case "TURN_END_CHECKS":
      return "Cierre";
    case "INITIAL_DEPLOY":
      return "Despliegue inicial";
    default:
      return fase;
  }
}

function ayudaFase(fase: string): string {
  switch (fase) {
    case "INITIAL_DEPLOY":
      return "Elegí uno o más guerreros de tu mano y desplegalos en el campo.";
    case "TURN_DRAW":
      return "Tomá una carta. Si ya tenés 7, descartá una antes de robar.";
    case "TURN_ATTACK":
      return "Elegí un guerrero propio, luego un arma o Poder de tu mano, y por último el objetivo.";
    case "TURN_SABOTAGE":
      return "Jugá Ladrón o Espía desde tu mano.";
    case "TURN_TRADE":
      return "Usá una carta de Oro o hacé trueque con 3 o 6 cartas.";
    case "TURN_BUILD":
      return "Construí tu castillo con una Reliquia de valor 1 o agregando Oro.";
    case "TURN_END_CHECKS":
      return "Cerrá el turno o dejá que pase automáticamente a la siguiente ronda.";
    default:
      return "Seguí el orden del turno.";
  }
}

function cartaEsGuerreroJugable(carta: Carta): boolean {
  return carta.tipo === "guerrero" || (carta.tipo === "especial" && carta.especial === "Dragon");
}

function cartaEsReliquia(carta: Carta): boolean {
  return (carta.tipo === "arma" || carta.tipo === "oro") && carta.valor === 1;
}

function pistaCartaEnMano(fase: string, carta: Carta, puedeInteractuar: boolean): string | null {
  if (!puedeInteractuar) {
    return null;
  }

  if (fase === "INITIAL_DEPLOY") {
    return cartaEsGuerreroJugable(carta) ? "Desplegar" : null;
  }
  if (fase === "TURN_ATTACK") {
    if (carta.tipo === "arma") {
      return "Ataque";
    }
    if (carta.tipo === "especial" && (carta.especial === "Poder" || carta.especial === "Asedio")) {
      return "Usar";
    }
    return cartaEsGuerreroJugable(carta) ? "Reclutar" : null;
  }
  if (fase === "TURN_SABOTAGE") {
    return carta.tipo === "especial" && (carta.especial === "Ladron" || carta.especial === "Espia") ? "Usar" : null;
  }
  if (fase === "TURN_TRADE") {
    return carta.tipo === "oro" ? "Comprar" : "Trueque";
  }
  if (fase === "TURN_BUILD") {
    if (cartaEsReliquia(carta)) {
      return "Reliquia";
    }
    return carta.tipo === "oro" ? "Castillo" : null;
  }
  if (fase === "TURN_DRAW" && carta) {
    return "Descartar";
  }
  return cartaEsGuerreroJugable(carta) ? "Reclutar" : null;
}

function SlotVacio({
  active,
  label,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  active: boolean;
  label: string;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className={`mesa-dropzone flex h-[170px] w-36 items-center justify-center rounded-[22px] px-3 text-center text-sm text-[#b8a890] ${
        active ? "mesa-dropzone-activa" : ""
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {label}
    </div>
  );
}

export default function TableroJuego() {
  usarSocket();
  const {
    room,
    battle,
    match,
    me,
    opponents,
    isMyTurn,
    playerId,
    selectedHandCardIds,
    selectedUnitId,
    selectedTargetId,
    toggleHandCard,
    clearHandSelection,
    setSelectedUnit,
    setSelectedTarget,
    error,
    setError,
    pendingSpy,
    handLimitExceeded,
    discardCountRequired,
  } = usarEstadoJuego();
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [activeDropzone, setActiveDropzone] = useState<string | null>(null);
  const [panelAbierto, setPanelAbierto] = useState(true);

  if (!battle || !me || !match) {
    return <main className="min-h-screen px-6 py-10 text-[#e8dcc4]">Cargando batalla...</main>;
  }

  const battleState = battle;
  const meState = me;
  const soyHost = room?.hostPlayerId === playerId;
  const puedeInteractuar = isMyTurn || battleState.phase === "INITIAL_DEPLOY";
  const selectedHand = meState.hand.filter((card) => selectedHandCardIds.includes(card.id));
  const selectedCard = selectedHand[0] ?? null;
  const selectedUnit = meState.field.find((unit) => unit.instanceId === selectedUnitId) ?? null;
  const draggedCard = meState.hand.find((card) => card.id === draggedCardId) ?? null;
  const oponentePrincipal = opponents[0] ?? null;
  const targetUnit = opponents.flatMap((opponent) => opponent.field).find((unit) => unit.instanceId === selectedTargetId) ?? null;
  const goldCards = selectedHand.filter((card) => card.tipo === "oro");
  const goldCard = goldCards[0] ?? null;
  const tradeAmount = selectedHandCardIds.length === 6 ? 2 : 1;
  const canTradeBarter = selectedHandCardIds.length === 3 || selectedHandCardIds.length === 6;
  const canInitialDeploy = selectedHand.length > 0 && selectedHand.every(cartaEsGuerreroJugable);

  const fases = useMemo(
    () => ["TURN_DRAW", "TURN_ATTACK", "TURN_SABOTAGE", "TURN_TRADE", "TURN_BUILD", "TURN_END_CHECKS"],
    []
  );

  function limpiarSeleccion() {
    clearHandSelection();
    setSelectedUnit(null);
    setSelectedTarget(null);
    setDraggedCardId(null);
    setActiveDropzone(null);
  }

  function reclutarCarta(carta: Carta) {
    enviarAccion({
      type: "RECRUIT",
      payload: { cardId: carta.id },
    });
    limpiarSeleccion();
  }

  function desplegarSeleccionInicial() {
    if (!canInitialDeploy) {
      return;
    }
    enviarAccion({
      type: "INITIAL_DEPLOY",
      payload: { cardIds: selectedHand.map((card) => card.id) },
    });
    limpiarSeleccion();
  }

  function confirmarDespliegue() {
    enviarAccion({
      type: "CONFIRM_INITIAL_DEPLOY",
      payload: {},
    });
  }

  function tomarCarta() {
    if (meState.hand.length >= 7) {
      if (!selectedCard) {
        return;
      }
      enviarAccion({
        type: "DISCARD_ONE_FOR_DRAW",
        payload: { cardId: selectedCard.id },
      });
    } else {
      enviarAccion({ type: "DRAW_CARD", payload: {} });
    }
    limpiarSeleccion();
  }

  function atacarConArma(targetId: string) {
    if (!selectedUnitId || !selectedCard || selectedCard.tipo !== "arma") {
      return;
    }
    enviarAccion({
      type: "ATTACK_WITH_WEAPON",
      payload: {
        attackerId: selectedUnitId,
        defenderId: targetId,
        weaponCardId: selectedCard.id,
      },
    });
    limpiarSeleccion();
  }

  function usarPoder() {
    if (!selectedCard || selectedCard.tipo !== "especial" || selectedCard.especial !== "Poder" || !selectedUnitId) {
      return;
    }
    enviarAccion({
      type: "USE_POWER_CARD",
      payload: {
        cardId: selectedCard.id,
        sourceUnitId: selectedUnitId,
        targetUnitId: selectedTargetId ?? undefined,
      },
    });
    limpiarSeleccion();
  }

  function usarAsedio() {
    if (!selectedCard || selectedCard.tipo !== "especial" || selectedCard.especial !== "Asedio" || !oponentePrincipal) {
      return;
    }
    enviarAccion({
      type: "ATTACK_WITH_SIEGE",
      payload: {
        cardId: selectedCard.id,
        targetPlayerId: oponentePrincipal.playerId,
      },
    });
    limpiarSeleccion();
  }

  function usarLadronOEspia() {
    if (!selectedCard || selectedCard.tipo !== "especial") {
      return;
    }
    if (selectedCard.especial === "Ladron" && oponentePrincipal) {
      enviarAccion({
        type: "USE_THIEF",
        payload: { cardId: selectedCard.id, targetPlayerId: oponentePrincipal.playerId },
      });
    } else if (selectedCard.especial === "Espia") {
      enviarAccion({
        type: "USE_SPY",
        payload: { cardId: selectedCard.id, targetPlayerId: oponentePrincipal?.playerId },
      });
    }
    limpiarSeleccion();
  }

  function comerciarConOro() {
    if (!goldCard) {
      return;
    }
    enviarAccion({
      type: "TRADE_WITH_GOLD",
      payload: {
        goldCardId: goldCard.id,
        amountToDraw: Math.floor(goldCard.valor / 2),
      },
    });
    limpiarSeleccion();
  }

  function hacerTrueque() {
    if (!canTradeBarter) {
      return;
    }
    enviarAccion({
      type: "TRADE_BARTER",
      payload: {
        paymentCardIds: selectedHandCardIds,
        amountToDraw: tradeAmount,
      },
    });
    limpiarSeleccion();
  }

  function construirCastillo() {
    if (!selectedCard) {
      return;
    }
    if (!meState.castle.reliquia && cartaEsReliquia(selectedCard)) {
      enviarAccion({
        type: "BUILD_RELIC",
        payload: { cardId: selectedCard.id },
      });
    } else if (selectedCard.tipo === "oro") {
      enviarAccion({
        type: "BUILD_CASTLE_CARD",
        payload: { cardId: selectedCard.id },
      });
    }
    limpiarSeleccion();
  }

  const accionSugerida = (() => {
    if (battleState.phase === "INITIAL_DEPLOY") {
      return {
        title: "Preparar el ejército",
        text: "Seleccioná uno o más guerreros para bajar al campo. Después confirmá el despliegue.",
        label: "Desplegar seleccionados",
        action: desplegarSeleccionInicial,
        disabled: !canInitialDeploy,
      };
    }
    if (battleState.phase === "TURN_DRAW") {
      return {
        title: "Tomar carta",
        text: meState.hand.length >= 7 ? "Seleccioná una carta para descartar y luego tomar otra." : "Tomá la primera carta del mazo central.",
        label: meState.hand.length >= 7 ? "Descartar y tomar" : "Tomar carta",
        action: tomarCarta,
        disabled: !isMyTurn || (meState.hand.length >= 7 && !selectedCard),
      };
    }
    if (battleState.phase === "TURN_ATTACK" && selectedUnit && selectedCard?.tipo === "arma") {
      return {
        title: "Ataque preparado",
        text: "Ahora elegí un guerrero rival para lanzar el ataque con el arma seleccionada.",
        label: "Esperando objetivo",
        action: () => undefined,
        disabled: true,
      };
    }
    if (battleState.phase === "TURN_ATTACK" && selectedCard?.tipo === "especial" && selectedCard.especial === "Poder") {
      return {
        title: "Poder listo",
        text: "Elegí el guerrero que activa el Poder y, si hace falta, el objetivo.",
        label: "Usar Poder",
        action: usarPoder,
        disabled: !isMyTurn || !selectedUnitId,
      };
    }
    if (battleState.phase === "TURN_ATTACK" && selectedCard?.tipo === "especial" && selectedCard.especial === "Asedio") {
      return {
        title: "Asedio listo",
        text: "Asedio destruye una carta de oro del castillo rival, nunca la Reliquia.",
        label: "Usar Asedio",
        action: usarAsedio,
        disabled: !isMyTurn || !oponentePrincipal,
      };
    }
    if (battleState.phase === "TURN_SABOTAGE" && selectedCard?.tipo === "especial") {
      return {
        title: "Sabotaje listo",
        text: "Ladrón roba al azar y Espía mira la mano rival o el mazo central.",
        label: "Jugar sabotaje",
        action: usarLadronOEspia,
        disabled: !isMyTurn || (selectedCard.especial !== "Ladron" && selectedCard.especial !== "Espia"),
      };
    }
    if (battleState.phase === "TURN_TRADE") {
      return {
        title: "Comerciar",
        text: "Usá una carta de Oro o hacé trueque con 3 o 6 cartas.",
        label: goldCard ? "Comprar con Oro" : "Hacer trueque",
        action: goldCard ? comerciarConOro : hacerTrueque,
        disabled: !isMyTurn || (!goldCard && !canTradeBarter),
      };
    }
    if (battleState.phase === "TURN_BUILD" && selectedCard) {
      return {
        title: "Construir castillo",
        text: "Primero bajá una Reliquia de valor 1. Después solo agregás Oro, una carta por turno.",
        label: "Construir",
        action: construirCastillo,
        disabled: !isMyTurn || (!cartaEsReliquia(selectedCard) && selectedCard.tipo !== "oro"),
      };
    }
    return null;
  })();

  const accionesPanel = (() => {
    const acciones: Array<{ id: string; label: string; kind: "primary" | "secondary" | "ghost"; disabled: boolean; onClick: () => void }> = [];
    if (battleState.phase === "INITIAL_DEPLOY") {
      acciones.push({ id: "deploy", label: "Desplegar seleccionados", kind: "primary", disabled: !canInitialDeploy, onClick: desplegarSeleccionInicial });
      acciones.push({ id: "confirm", label: "Confirmar despliegue", kind: "secondary", disabled: meState.field.length === 0 || meState.initialDeployConfirmed, onClick: confirmarDespliegue });
    }
    if (battleState.phase === "TURN_DRAW") {
      acciones.push({ id: "draw", label: meState.hand.length >= 7 ? "Descartar y tomar" : "Tomar carta", kind: "primary", disabled: !isMyTurn || (meState.hand.length >= 7 && !selectedCard), onClick: tomarCarta });
    }
    if (isMyTurn && battleState.phase !== "INITIAL_DEPLOY" && !meState.recruitedThisTurn && selectedCard && cartaEsGuerreroJugable(selectedCard)) {
      acciones.push({ id: "recruit", label: "Reclutar", kind: "secondary", disabled: false, onClick: () => reclutarCarta(selectedCard) });
    }
    if (battleState.phase === "TURN_ATTACK" && selectedCard?.tipo === "especial" && selectedCard.especial === "Poder") {
      acciones.push({ id: "power", label: "Usar Poder", kind: "primary", disabled: !selectedUnitId, onClick: usarPoder });
    }
    if (battleState.phase === "TURN_ATTACK" && selectedCard?.tipo === "especial" && selectedCard.especial === "Asedio") {
      acciones.push({ id: "siege", label: "Usar Asedio", kind: "primary", disabled: !oponentePrincipal, onClick: usarAsedio });
    }
    if (battleState.phase === "TURN_SABOTAGE") {
      acciones.push({ id: "sabotage", label: "Jugar sabotaje", kind: "primary", disabled: !selectedCard || selectedCard.tipo !== "especial", onClick: usarLadronOEspia });
    }
    if (battleState.phase === "TURN_TRADE") {
      acciones.push({ id: "trade-gold", label: "Comprar con Oro", kind: "primary", disabled: !goldCard, onClick: comerciarConOro });
      acciones.push({ id: "trade-barter", label: `Trueque ${tradeAmount} carta${tradeAmount > 1 ? "s" : ""}`, kind: "secondary", disabled: !canTradeBarter, onClick: hacerTrueque });
    }
    if (battleState.phase === "TURN_BUILD") {
      acciones.push({ id: "build", label: "Construir", kind: "primary", disabled: !selectedCard, onClick: construirCastillo });
    }
    acciones.push({ id: "advance", label: "Pasar fase", kind: "ghost", disabled: !isMyTurn, onClick: () => enviarAccion({ type: "ADVANCE_PHASE", payload: {} }) });
    return acciones;
  })();

  function renderSlots(units: UnitInPlay[], own: boolean) {
    return Array.from({ length: 5 }, (_, index) => {
      const unit = units[index];
      const slotId = unit?.instanceId ?? `${own ? "own" : "enemy"}-slot-${index}`;

      if (unit) {
        return (
          <div
            key={slotId}
            className={`rounded-[22px] transition-all duration-200 ${
              !own && battleState.phase === "TURN_ATTACK" && selectedUnitId && selectedCard?.tipo === "arma"
                ? "ring-1 ring-[rgba(240,210,138,0.45)] shadow-[0_0_18px_rgba(212,160,23,0.12)]"
                : ""
            }`}
          >
            <CartaComponente
              carta={unit}
              selected={(own && selectedUnitId === unit.instanceId) || (!own && selectedTargetId === unit.instanceId)}
              disabled={!own ? false : !puedeInteractuar}
              onClick={() => {
                if (!own) {
                  if (battleState.phase === "TURN_ATTACK" && selectedCard?.tipo === "arma") {
                    atacarConArma(unit.instanceId);
                    return;
                  }
                  setSelectedTarget(selectedTargetId === unit.instanceId ? null : unit.instanceId);
                  return;
                }
                setSelectedUnit(selectedUnitId === unit.instanceId ? null : unit.instanceId);
              }}
            />
          </div>
        );
      }

      if (!own) {
        return <SlotVacio key={slotId} active={false} label="Espacio rival" onDragOver={() => {}} onDragLeave={() => {}} onDrop={() => {}} />;
      }

      return (
        <SlotVacio
          key={slotId}
          active={activeDropzone === slotId}
          label="Soltá aquí un guerrero"
          onDragOver={(event) => {
            if (draggedCard && cartaEsGuerreroJugable(draggedCard) && puedeInteractuar) {
              event.preventDefault();
              setActiveDropzone(slotId);
            }
          }}
          onDragLeave={() => setActiveDropzone((value) => (value === slotId ? null : value))}
          onDrop={(event) => {
            event.preventDefault();
            if (draggedCard && cartaEsGuerreroJugable(draggedCard)) {
              if (battleState.phase === "INITIAL_DEPLOY") {
                enviarAccion({ type: "INITIAL_DEPLOY", payload: { cardIds: [draggedCard.id] } });
              } else {
                reclutarCarta(draggedCard);
              }
              limpiarSeleccion();
            }
          }}
        />
      );
    });
  }

  return (
    <main className="min-h-screen bg-[#efe2c9] px-3 py-3 text-[#5d4630] md:px-5">
      <div className="mesa-tablero mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1640px] flex-col gap-4 rounded-[32px] p-4 md:p-5">
        <header className="mesa-superficie rounded-[28px] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mesa-etiqueta mb-2">Mesa táctica</div>
              <h1 className="titulo-medieval titulo-mesa text-3xl md:text-4xl">La Campaña</h1>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
              <div className="mesa-chip rounded-full px-4 py-2">Fase: {tituloFase(battleState.phase)}</div>
              <div className="mesa-chip rounded-full px-4 py-2">Turno {battleState.currentTurn}</div>
              <div className="mesa-chip rounded-full px-4 py-2">
                Castillo {meState.castle.oroConstruido}/{meState.castle.objetivo}
              </div>
              <button
                type="button"
                className="boton-panel boton-panel-secundario"
                onClick={() => obtenerSocket().emit("room:leave")}
              >
                Salir
              </button>
              {soyHost ? (
                <button
                  type="button"
                  className="boton-panel"
                  onClick={() => obtenerSocket().emit("room:close")}
                >
                  Finalizar y cerrar
                </button>
              ) : null}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={battleState.phase + (selectedUnitId ?? "") + (selectedCard?.id ?? "")}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mesa-chip mt-4 rounded-2xl px-4 py-3 text-sm"
            >
              {accionSugerida?.text ?? ayudaFase(battleState.phase)}
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            {fases.map((fase) => (
              <div
                key={fase}
                className="rounded-xl border px-3 py-2 text-center text-xs"
                style={{
                  borderColor: battleState.phase === fase ? "rgba(240,210,138,0.9)" : "rgba(212,160,23,0.12)",
                  background: battleState.phase === fase ? "rgba(212,160,23,0.12)" : "rgba(26,74,58,0.08)",
                  color: battleState.phase === fase ? "#f5d98a" : "#b8a890",
                }}
              >
                {tituloFase(fase)}
              </div>
            ))}
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-[#7a2b2b] bg-[#3a1414] px-4 py-3 text-sm text-[#f0c6c6]">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)}>
                Cerrar
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid flex-1 gap-4 xl:grid-cols-[1.55fr_0.45fr]">
          <section className="mesa-superficie flex min-h-0 flex-col rounded-[28px] px-5 py-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="mesa-etiqueta">Campo rival</div>
              <div className="text-sm text-[#b8a890]">{oponentePrincipal ? `${oponentePrincipal.displayName} · mano ${oponentePrincipal.cardCount}` : "Sin rival"}</div>
            </div>
            <div className="mb-5 flex flex-wrap gap-3">{renderSlots(oponentePrincipal?.field ?? [], false)}</div>

            <div className="mb-3 flex items-center justify-between">
              <div className="mesa-etiqueta">Tu campo</div>
              <div className="text-sm text-[#b8a890]">{puedeInteractuar ? "Podés jugar cartas aquí" : "Esperando tu turno"}</div>
            </div>
            <div className="mb-5 flex flex-wrap gap-3">{renderSlots(meState.field, true)}</div>

            <div className="mb-3 flex items-center justify-between">
              <div className="mesa-etiqueta">Tu mano</div>
              <div className="texto-mesa max-w-[420px] text-right text-sm leading-6">{ayudaFase(battleState.phase)}</div>
            </div>
            <div className="rounded-[24px] border border-[rgba(120,85,43,0.12)] bg-[rgba(255,250,242,0.58)] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-[0.18em] text-[#d4a017]">
                  {selectedHandCardIds.length > 0 ? `${selectedHandCardIds.length} carta${selectedHandCardIds.length > 1 ? "s" : ""} seleccionada${selectedHandCardIds.length > 1 ? "s" : ""}` : "Sin selección"}
                </div>
                <div className="text-sm text-[#b8a890]">
                  {battleState.phase === "TURN_TRADE" ? "Click para elegir cartas de compra o trueque." : "Click para preparar una acción o arrastrar guerreros."}
                </div>
              </div>
              {battleState.phase === "TURN_TRADE" ? (
                <div className="mb-4 rounded-2xl border border-[rgba(212,160,23,0.12)] bg-[rgba(26,74,58,0.12)] px-4 py-3 text-sm text-[#cfc2a9]">
                  <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[#d4a017]">Compra actual</div>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 leading-6">
                    <div>Oro elegido: <span className="font-semibold text-[#6e4d27]">{goldCard?.valor ?? 0}</span></div>
                    <div>Compra estimada: <span className="font-semibold text-[#6e4d27]">{goldCard ? Math.floor(goldCard.valor / 2) : 0}</span></div>
                    <div>Trueque: <span className="font-semibold text-[#6e4d27]">{selectedHandCardIds.length}</span> / 3 o 6</div>
                  </div>
                </div>
              ) : null}
              {battleState.phase === "TURN_END_CHECKS" && handLimitExceeded ? (
                <div className="mb-4 rounded-2xl border border-[rgba(212,160,23,0.12)] bg-[rgba(58,42,18,0.18)] px-4 py-3 text-sm text-[#e8dcc4]">
                  <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[#d4a017]">Límite de mano</div>
                  Tenés más de 7 cartas. El servidor aplicará la penalización al azar.
                </div>
              ) : null}
              {battleState.phase === "TURN_DRAW" && meState.hand.length >= 7 ? (
                <div className="mb-4 rounded-2xl border border-[rgba(212,160,23,0.12)] bg-[rgba(58,42,18,0.18)] px-4 py-3 text-sm text-[#e8dcc4]">
                  <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[#d4a017]">Tomar carta</div>
                  Seleccioná una carta para descartar antes de robar.
                </div>
              ) : null}
              <div className="flex flex-wrap gap-4">
                {meState.hand.map((card) => (
                  <CartaComponente
                    key={card.id}
                    carta={card}
                    selected={selectedHandCardIds.includes(card.id)}
                    disabled={!puedeInteractuar}
                    interactionHint={pistaCartaEnMano(battleState.phase, card, puedeInteractuar)}
                    draggable={puedeInteractuar && cartaEsGuerreroJugable(card)}
                    onDragStart={() => setDraggedCardId(card.id)}
                    onDragEnd={() => {
                      setDraggedCardId(null);
                      setActiveDropzone(null);
                    }}
                    onClick={() => toggleHandCard(card.id)}
                  />
                ))}
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 flex-col gap-4">
            <AnimatePresence>
              {accionSugerida ? (
                <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="mesa-lateral rounded-[24px] px-4 py-4">
                  <div className="mesa-etiqueta mb-2">Acción sugerida</div>
                  <h3 className="text-lg text-[#6a4317]" style={{ fontFamily: "'Cinzel Decorative', Georgia, serif" }}>
                    {accionSugerida.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5d4630]">{accionSugerida.text}</p>
                  <button type="button" className="boton-campana mt-4 w-full justify-center disabled:opacity-50" disabled={accionSugerida.disabled} onClick={accionSugerida.action}>
                    {accionSugerida.label}
                  </button>
                </motion.section>
              ) : null}
            </AnimatePresence>

            <section className="mesa-lateral rounded-[24px] px-4 py-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="mesa-etiqueta mb-1">Acciones</div>
                  <h2 className="text-xl text-[#6a4317]" style={{ fontFamily: "'Cinzel Decorative', Georgia, serif" }}>
                    {panelAbierto ? "Orden de acciones" : "Acciones"}
                  </h2>
                </div>
                <button type="button" className="text-sm text-[#8c6327]" onClick={() => setPanelAbierto((value) => !value)}>
                  {panelAbierto ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {panelAbierto ? (
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-[rgba(212,160,23,0.12)] bg-[rgba(232,220,196,0.03)] px-3 py-3 text-sm leading-6 text-[#cfc2a9]">
                    <div className="mb-1 text-[11px] uppercase tracking-[0.16em] text-[#d4a017]">Ahora</div>
                    {accionSugerida?.text ?? ayudaFase(battleState.phase)}
                  </div>
                  <div className="grid gap-3">
                    {accionesPanel.filter((accion) => accion.kind === "primary").map((accion) => (
                      <button key={accion.id} type="button" className="boton-panel boton-panel-principal" disabled={accion.disabled} onClick={accion.onClick}>
                        {accion.label}
                      </button>
                    ))}
                  </div>
                  {accionesPanel.some((accion) => accion.kind === "secondary") ? (
                    <div>
                      <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[#d4a017]">Opciones</div>
                      <div className="grid gap-2">
                        {accionesPanel.filter((accion) => accion.kind === "secondary").map((accion) => (
                          <button key={accion.id} type="button" className="boton-panel" disabled={accion.disabled} onClick={accion.onClick}>
                            {accion.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="pt-1">
                    {accionesPanel.filter((accion) => accion.kind === "ghost").map((accion) => (
                      <button key={accion.id} type="button" className="boton-panel boton-panel-secundario w-full" disabled={accion.disabled} onClick={accion.onClick}>
                        {accion.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="mesa-lateral flex-1 overflow-hidden rounded-[24px] px-4 py-4">
              <div className="mesa-etiqueta mb-3">Bitácora</div>
              <div className="max-h-[260px] space-y-2 overflow-auto pr-1 text-sm text-[#5d4630]">
                {battleState.log.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-[rgba(120,85,43,0.1)] bg-[rgba(255,248,239,0.78)] px-3 py-3">
                    {entry.text}
                  </div>
                ))}
              </div>
            </section>

            {pendingSpy ? (
              <section className="mesa-lateral rounded-[24px] px-4 py-4">
                <div className="mesa-etiqueta mb-3">Espionaje</div>
                <div className="flex flex-wrap gap-3">
                  {pendingSpy.map((card) => (
                    <CartaComponente key={card.id} carta={card} />
                  ))}
                </div>
              </section>
            ) : null}

            {targetUnit ? (
              <section className="mesa-lateral rounded-[24px] px-4 py-4">
                <div className="mesa-etiqueta mb-2">Objetivo</div>
                <div className="text-sm text-[#cfc2a9]">{targetUnit.guerrero} seleccionado para una acción.</div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}


