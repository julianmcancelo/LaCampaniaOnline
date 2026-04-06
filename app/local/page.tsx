"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Swords, Zap, Bot, Trophy, RotateCcw } from "lucide-react";
import TableroJuego from "../../componentes/juego/TableroJuego";
import { usarTiendaJuego } from "../../tienda/estadoJuego";
import { applyBattleAction } from "../../motor/acciones/indice";
import { crearBatalla } from "../../motor/mazo";
import { decidirAccionCPU, type DificultadCPU } from "../../motor/ia";
import { construirVistaLocal, type ContextoPartidaLocal } from "../../motor/vistas";
import { crearId } from "../../motor/id";
import type { BattleAction, BattleState, MatchPlayer } from "../../motor/tipos";

// ─── Configuración del modo práctica ─────────────────────────────────────────

const opcionesDificultad: Array<{
  id: DificultadCPU;
  titulo: string;
  descripcion: string;
  icono: React.ElementType;
  acento: string;
  fondo: string;
  borde: string;
}> = [
  {
    id: "facil",
    titulo: "Fácil",
    descripcion: "La CPU juega al azar. Ideal para aprender las reglas y probar estrategias sin presión.",
    icono: Shield,
    acento: "#34d399",
    fondo: "rgba(52,211,153,0.06)",
    borde: "rgba(52,211,153,0.18)",
  },
  {
    id: "normal",
    titulo: "Normal",
    descripcion: "La CPU usa estrategia básica: ataca con sus mejores armas y construye el castillo.",
    icono: Swords,
    acento: "#f5d98a",
    fondo: "rgba(245,217,138,0.06)",
    borde: "rgba(245,217,138,0.18)",
  },
  {
    id: "dificil",
    titulo: "Difícil",
    descripcion: "La CPU juega agresivamente, espía tu mano, optimiza cada ataque y prioriza el castillo.",
    icono: Zap,
    acento: "#f87171",
    fondo: "rgba(248,113,113,0.06)",
    borde: "rgba(248,113,113,0.18)",
  },
];

// ─── Pantalla de configuración ────────────────────────────────────────────────

function PantallaConfiguracion({
  onComenzar,
}: {
  onComenzar: (nombre: string, dificultad: DificultadCPU) => void;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [dificultad, setDificultad] = useState<DificultadCPU>("normal");
  const [error, setError] = useState<string | null>(null);

  function comenzar() {
    const n = nombre.trim();
    if (n.length < 2) {
      setError("Ingresá tu nombre de al menos 2 caracteres.");
      return;
    }
    onComenzar(n, dificultad);
  }

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 15,
    background: "rgba(4,10,7,0.8)",
    border: `1px solid ${nombre.trim().length >= 2 ? "rgba(212,160,23,0.5)" : "rgba(212,160,23,0.12)"}`,
    color: "#e8dcc4",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050e09",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "'Cinzel', Georgia, serif",
      }}
    >
      {/* Navbar mínimo */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", backdropFilter: "blur(20px)", background: "rgba(5,14,9,0.85)", borderBottom: "1px solid rgba(212,160,23,0.08)" }}>
        <button
          type="button"
          onClick={() => router.push("/vestibulo")}
          style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(212,160,23,0.6)", fontSize: 13, background: "none", border: "none", cursor: "pointer", fontFamily: "'Cinzel', Georgia, serif" }}
        >
          <ArrowLeft size={16} />
          Volver al vestíbulo
        </button>
        <div style={{ flex: 1 }} />
        <Bot size={18} style={{ color: "#d4a017" }} />
        <span style={{ fontSize: 13, color: "#d4a017", fontWeight: 700, letterSpacing: "0.06em" }}>Modo Práctica</span>
      </div>

      <div style={{ width: "100%", maxWidth: 560, paddingTop: 48 }}>
        {/* Título */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 32, height: 1, background: "rgba(212,160,23,0.4)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#d4a017" }}>Práctica local</span>
            <div style={{ width: 32, height: 1, background: "rgba(212,160,23,0.4)" }} />
          </div>
          <h1 style={{ fontFamily: "'Cinzel Decorative', Georgia, serif", fontSize: "clamp(1.6rem, 5vw, 2.4rem)", fontWeight: 900, color: "#f5d98a", letterSpacing: "0.04em", marginBottom: 12 }}>
            Jugar vs CPU
          </h1>
          <p style={{ color: "rgba(232,220,196,0.55)", fontSize: 14, lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
            Entrenate contra la computadora. Elegí tu dificultad y comenzá una partida de práctica.
          </p>
        </div>

        {/* Nombre del jugador */}
        <div
          style={{
            background: "rgba(13,35,24,0.6)",
            border: "1px solid rgba(212,160,23,0.12)",
            borderRadius: 20,
            padding: "24px 24px",
            backdropFilter: "blur(16px)",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 14, height: 1, background: "rgba(212,160,23,0.5)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase" as const, color: "#d4a017" }}>Tu nombre de batalla</span>
          </div>
          <input
            style={inputBase}
            type="text"
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); setError(null); }}
            placeholder="Cómo te llamás..."
            maxLength={24}
            onKeyDown={(e) => { if (e.key === "Enter") comenzar(); }}
          />
          {error ? (
            <p style={{ marginTop: 8, fontSize: 12, color: "#f87171" }}>{error}</p>
          ) : null}
        </div>

        {/* Selección de dificultad */}
        <div
          style={{
            background: "rgba(13,35,24,0.6)",
            border: "1px solid rgba(212,160,23,0.12)",
            borderRadius: 20,
            padding: "24px 24px",
            backdropFilter: "blur(16px)",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 14, height: 1, background: "rgba(212,160,23,0.5)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase" as const, color: "#d4a017" }}>Dificultad</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {opcionesDificultad.map((op) => {
              const Icono = op.icono;
              const seleccionada = dificultad === op.id;
              return (
                <motion.button
                  key={op.id}
                  type="button"
                  onClick={() => setDificultad(op.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 20px",
                    borderRadius: 14,
                    border: `1px solid ${seleccionada ? op.borde : "rgba(212,160,23,0.08)"}`,
                    background: seleccionada ? op.fondo : "rgba(4,10,7,0.5)",
                    cursor: "pointer",
                    textAlign: "left" as const,
                    transition: "all 0.2s",
                    outline: seleccionada ? `1.5px solid ${op.acento}` : "none",
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, background: `${op.fondo}`, border: `1px solid ${op.borde}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icono size={20} style={{ color: op.acento }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: seleccionada ? op.acento : "#e8dcc4", marginBottom: 3, fontFamily: "'Cinzel', Georgia, serif" }}>
                      {op.titulo}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(232,220,196,0.5)", lineHeight: 1.5 }}>
                      {op.descripcion}
                    </div>
                  </div>
                  {seleccionada ? (
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: op.acento, flexShrink: 0 }} />
                  ) : null}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Botón comenzar */}
        <motion.button
          type="button"
          onClick={comenzar}
          style={{
            width: "100%",
            padding: "16px 32px",
            borderRadius: 14,
            background: "linear-gradient(135deg, #d4a017 0%, #b8860b 100%)",
            border: "none",
            color: "#1a0f00",
            fontFamily: "'Cinzel Decorative', Georgia, serif",
            fontSize: 15,
            fontWeight: 900,
            letterSpacing: "0.06em",
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(212,160,23,0.25)",
          }}
          whileHover={{ scale: 1.02, boxShadow: "0 6px 32px rgba(212,160,23,0.4)" }}
          whileTap={{ scale: 0.97 }}
        >
          Comenzar práctica
        </motion.button>
      </div>
    </main>
  );
}

// ─── Pantalla de resultado ────────────────────────────────────────────────────

function PantallaResultado({
  nombreJugador,
  ganoJugador,
  dificultad,
  onRejugar,
  onSalir,
}: {
  nombreJugador: string;
  ganoJugador: boolean;
  dificultad: DificultadCPU;
  onRejugar: () => void;
  onSalir: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5,14,9,0.92)",
        backdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        fontFamily: "'Cinzel', Georgia, serif",
        padding: 24,
      }}
    >
      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{
          background: "rgba(13,35,24,0.95)",
          border: "1px solid rgba(212,160,23,0.25)",
          borderRadius: 24,
          padding: "48px 40px",
          maxWidth: 460,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          {ganoJugador ? (
            <Trophy size={52} style={{ color: "#f5d98a", filter: "drop-shadow(0 0 20px rgba(212,160,23,0.5))" }} />
          ) : (
            <Swords size={52} style={{ color: "#f87171", filter: "drop-shadow(0 0 20px rgba(248,113,113,0.4))" }} />
          )}
        </div>
        <h2 style={{ fontFamily: "'Cinzel Decorative', Georgia, serif", fontSize: "1.8rem", fontWeight: 900, color: ganoJugador ? "#f5d98a" : "#f87171", marginBottom: 12, letterSpacing: "0.04em" }}>
          {ganoJugador ? "¡Victoria!" : "Derrota"}
        </h2>
        <p style={{ color: "rgba(232,220,196,0.7)", fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
          {ganoJugador
            ? `¡Bien jugado, ${nombreJugador}! Superaste al CPU en modo ${dificultad}.`
            : `El CPU te venció en modo ${dificultad}. ¿Querés revancha?`}
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
          <motion.button
            type="button"
            onClick={onRejugar}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #d4a017 0%, #b8860b 100%)",
              border: "none",
              color: "#1a0f00",
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <RotateCcw size={15} />
            Rejugar
          </motion.button>
          <motion.button
            type="button"
            onClick={onSalir}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: 12,
              background: "rgba(212,160,23,0.08)",
              border: "1px solid rgba(212,160,23,0.2)",
              color: "#d4a017",
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
            whileHover={{ background: "rgba(212,160,23,0.14)" }}
            whileTap={{ scale: 0.97 }}
          >
            Salir
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Página principal del modo local ─────────────────────────────────────────

type EstadoPantalla = "configuracion" | "jugando" | "resultado";

const ID_JUGADOR_HUMANO = "jugador-local";
const ID_CPU = "cpu-local";

export default function PaginaLocal() {
  const router = useRouter();
  const { setGameView, setPlayerId } = usarTiendaJuego();

  const [pantalla, setPantalla] = useState<EstadoPantalla>("configuracion");
  const [nombreJugador, setNombreJugador] = useState("");
  const [dificultad, setDificultad] = useState<DificultadCPU>("normal");
  const [ganoJugador, setGanoJugador] = useState<boolean | null>(null);

  // Estado de la batalla en un ref para evitar renders extras durante el loop de CPU
  const batallaRef = useRef<BattleState | null>(null);
  const contextoRef = useRef<ContextoPartidaLocal | null>(null);
  const procesandoCpuRef = useRef(false);

  function crearContexto(nombre: string): ContextoPartidaLocal {
    return {
      idJugador: ID_JUGADOR_HUMANO,
      idSala: crearId("sala-local"),
      idMatch: crearId("match-local"),
      jugadores: [
        {
          playerId: ID_JUGADOR_HUMANO,
          displayName: nombre,
          socketId: null,
          isReady: true,
          isHost: true,
          teamId: null,
          connected: true,
        },
        {
          playerId: ID_CPU,
          displayName: "CPU",
          socketId: null,
          isReady: true,
          isHost: false,
          teamId: null,
          connected: true,
        },
      ] as MatchPlayer[],
      marcador: { [ID_JUGADOR_HUMANO]: 0, [ID_CPU]: 0 },
    };
  }

  function actualizarVista(batalla: BattleState, contexto: ContextoPartidaLocal) {
    const vista = construirVistaLocal(batalla, contexto);
    setGameView(vista);
    batallaRef.current = batalla;
  }

  function verificarFinPartida(batalla: BattleState) {
    if (batalla.phase === "BATTLE_OVER" && batalla.result) {
      const gano = batalla.result.winnerPlayerId === ID_JUGADOR_HUMANO;
      setGanoJugador(gano);
      setPantalla("resultado");
    }
  }

  // Loop del CPU: siempre lee el estado más reciente desde batallaRef.current.
  // NUNCA mantiene una copia local propia — eso causaría desincronización cuando
  // el humano actualiza el estado (en especial durante INITIAL_DEPLOY).
  const ejecutarTurnoCPU = useCallback(() => {
    function paso() {
      if (!procesandoCpuRef.current) return;

      // Lee siempre el estado más reciente
      const batallaActual = batallaRef.current;
      const contexto = contextoRef.current;
      if (!batallaActual || !contexto) {
        procesandoCpuRef.current = false;
        return;
      }

      if (batallaActual.phase === "BATTLE_OVER" || batallaActual.phase === "MATCH_OVER") {
        verificarFinPartida(batallaActual);
        procesandoCpuRef.current = false;
        return;
      }

      const cpuPlayer = batallaActual.players[ID_CPU];

      // Determina si es turno del CPU en este momento exacto.
      // INITIAL_DEPLOY: el CPU actúa si NO confirmó todavía (aunque sea activePlayer).
      // BATTLE_INITIATIVE: actúa si no tiró el dado.
      // Resto de fases: actúa si es el jugador activo.
      const esTurnoCpu =
        (batallaActual.phase === "BATTLE_INITIATIVE" &&
          batallaActual.initiative.contenders.includes(ID_CPU) &&
          batallaActual.initiative.rolls[ID_CPU] === null) ||
        (batallaActual.phase === "INITIAL_DEPLOY" && !cpuPlayer?.initialDeployConfirmed) ||
        (batallaActual.activePlayerId === ID_CPU &&
          batallaActual.phase !== "INITIAL_DEPLOY" &&
          batallaActual.phase !== "BATTLE_INITIATIVE");

      if (!esTurnoCpu) {
        procesandoCpuRef.current = false;
        return;
      }

      try {
        const accion = decidirAccionCPU(batallaActual, ID_CPU, dificultad);
        const nuevaBatalla = applyBattleAction(batallaActual, ID_CPU, accion);
        actualizarVista(nuevaBatalla, contexto);
        verificarFinPartida(nuevaBatalla);

        if (nuevaBatalla.phase === "BATTLE_OVER") {
          procesandoCpuRef.current = false;
          return;
        }
      } catch {
        // Si la acción de la IA falla, intenta avanzar de fase como fallback
        try {
          const fallback = applyBattleAction(batallaActual, ID_CPU, { type: "ADVANCE_PHASE", payload: {} });
          actualizarVista(fallback, contexto);
        } catch {
          // No puede hacer nada — suelta el control para evitar un loop infinito
          procesandoCpuRef.current = false;
          return;
        }
      }

      setTimeout(paso, 600);
    }

    setTimeout(paso, 900);
  }, [dificultad]); // eslint-disable-line react-hooks/exhaustive-deps

  function iniciarPartida(nombre: string, dificultadElegida: DificultadCPU) {
    setNombreJugador(nombre);
    setDificultad(dificultadElegida);
    setPlayerId(ID_JUGADOR_HUMANO);

    const contexto = crearContexto(nombre);
    contextoRef.current = contexto;

    const jugadoresMatch: MatchPlayer[] = contexto.jugadores;
    const nuevaBatalla = crearBatalla(jugadoresMatch, "individual", 1, 0);
    batallaRef.current = nuevaBatalla;

    actualizarVista(nuevaBatalla, contexto);
    setPantalla("jugando");

    procesandoCpuRef.current = true;
    ejecutarTurnoCPU();
  }

  function manejarAccionHumano(accion: BattleAction) {
    const batalla = batallaRef.current;
    const contexto = contextoRef.current;
    if (!batalla || !contexto) return;

    let nuevaBatalla: BattleState;
    try {
      nuevaBatalla = applyBattleAction(batalla, ID_JUGADOR_HUMANO, accion);
    } catch {
      return; // Acción inválida — el motor la rechazó, ignorar silenciosamente
    }

    actualizarVista(nuevaBatalla, contexto);

    if (nuevaBatalla.phase === "BATTLE_OVER") {
      verificarFinPartida(nuevaBatalla);
      return;
    }

    // Después de la acción del humano, disparar el loop del CPU si no está ya corriendo
    if (!procesandoCpuRef.current) {
      procesandoCpuRef.current = true;
      ejecutarTurnoCPU();
    }
  }

  function rejugar() {
    procesandoCpuRef.current = false;
    setGanoJugador(null);

    const contexto = crearContexto(nombreJugador);
    contextoRef.current = contexto;

    const nuevaBatalla = crearBatalla(contexto.jugadores, "individual", 1, 0);
    batallaRef.current = nuevaBatalla;
    actualizarVista(nuevaBatalla, contexto);
    setPantalla("jugando");

    procesandoCpuRef.current = true;
    ejecutarTurnoCPU();
  }

  function salir() {
    procesandoCpuRef.current = false;
    batallaRef.current = null;
    contextoRef.current = null;
    setPantalla("configuracion");
    setGanoJugador(null);
  }

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      procesandoCpuRef.current = false;
    };
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {pantalla === "configuracion" ? (
          <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PantallaConfiguracion onComenzar={iniciarPartida} />
          </motion.div>
        ) : (
          <motion.div key="juego" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TableroJuego onAccion={manejarAccionHumano} onSalir={salir} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay de resultado */}
      <AnimatePresence>
        {pantalla === "resultado" && ganoJugador !== null ? (
          <PantallaResultado
            key="resultado"
            nombreJugador={nombreJugador}
            ganoJugador={ganoJugador}
            dificultad={dificultad}
            onRejugar={rejugar}
            onSalir={() => router.push("/vestibulo")}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
