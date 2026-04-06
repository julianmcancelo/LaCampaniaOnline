"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Bot, RotateCcw, Shield, Swords, Trophy, Zap } from "lucide-react";
import TableroJuego from "../../componentes/juego/TableroJuego";
import { applyBattleAction } from "../../motor/acciones/indice";
import { crearId } from "../../motor/id";
import { decidirAccionCPU, type DificultadCPU } from "../../motor/ia";
import { crearBatalla } from "../../motor/mazo";
import type { BattleAction, BattleState, MatchPlayer } from "../../motor/tipos";
import { construirVistaLocal, type ContextoPartidaLocal } from "../../motor/vistas";
import { usarTiendaJuego } from "../../tienda/estadoJuego";
import { GAME_BRAND, GAME_TAGLINE } from "../../lib/lore";

const opcionesDificultad: Array<{
  id: DificultadCPU;
  titulo: string;
  descripcion: string;
  icono: React.ElementType;
  acento: string;
}> = [
  {
    id: "facil",
    titulo: "Manso",
    descripcion: "Ideal para aprender la rueda y probar manos sin presion.",
    icono: Shield,
    acento: "#82c882",
  },
  {
    id: "normal",
    titulo: "Firme",
    descripcion: "Lee la mesa, ataca mejor y no te regala el campo.",
    icono: Swords,
    acento: "#d9a14a",
  },
  {
    id: "dificil",
    titulo: "Brava",
    descripcion: "Presiona fuerte, arma jugadas y castiga cada hueco.",
    icono: Zap,
    acento: "#d06b52",
  },
];

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <div style={{ width: 18, height: 1, background: "rgba(216,155,69,0.5)" }} />
      <span style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "#d89b45", fontWeight: 700 }}>{children}</span>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[28px] p-5 sm:p-6"
      style={{
        background: "linear-gradient(180deg, rgba(29,20,15,0.86), rgba(13,17,14,0.94))",
        border: "1px solid rgba(198,139,71,0.14)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
      }}
    >
      {children}
    </div>
  );
}

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
      setError("Ingresa tu nombre con al menos 2 letras.");
      return;
    }
    onComenzar(n, dificultad);
  }

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "13px 16px",
    borderRadius: 14,
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 15,
    background: "rgba(21,14,10,0.88)",
    border: `1px solid ${nombre.trim().length >= 2 ? "rgba(216,155,69,0.34)" : "rgba(198,139,71,0.16)"}`,
    color: "#f0dec1",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080f0c",
        padding: "32px 16px",
        fontFamily: "'Cinzel', Georgia, serif",
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 78% 14%, rgba(199,123,47,0.18), transparent 26%), radial-gradient(circle at 12% 72%, rgba(216,155,69,0.1), transparent 28%), linear-gradient(180deg, #15110d 0%, #101713 34%, #080f0c 100%)",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 24px",
          backdropFilter: "blur(20px)",
          background: "rgba(8,15,12,0.88)",
          borderBottom: "1px solid rgba(198,139,71,0.12)",
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/vestibulo")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#b89d74",
            fontSize: 13,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "'Cinzel', Georgia, serif",
          }}
        >
          <ArrowLeft size={16} />
          Volver al vestibulo
        </button>
        <div style={{ flex: 1 }} />
        <Image src="/logo-gaucho-puro.png" alt={GAME_BRAND} width={34} height={34} style={{ borderRadius: 999 }} />
        <Bot size={18} style={{ color: "#d4a017" }} />
        <span style={{ fontSize: 13, color: "#d4a017", fontWeight: 700, letterSpacing: "0.06em" }}>{GAME_BRAND}</span>
      </div>

      <div className="relative mx-auto flex min-h-[100vh] max-w-6xl items-center justify-center pt-20">
        <div className="grid w-full items-start gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <Kicker>Duelo de practica</Kicker>
            <Image src="/logo-gaucho-puro.png" alt={GAME_BRAND} width={112} height={112} style={{ borderRadius: 999, marginBottom: 18 }} />
            <h1
              style={{
                fontFamily: "'Cinzel Decorative', Georgia, serif",
                fontSize: "clamp(2.6rem,6vw,5rem)",
                lineHeight: 0.95,
                color: "#f7ddb0",
                maxWidth: "8.5ch",
              }}
            >
              Entra al campo y afina la mano.
            </h1>
            <p style={{ marginTop: 18, maxWidth: 540, color: "#c8b08a", fontSize: 16, lineHeight: 1.85 }}>
              {GAME_TAGLINE} Juega contra la CPU, prueba ritmos de ataque y llega al online con la rueda bien medida.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08 }} className="space-y-5">
            <Panel>
              <Kicker>Tu nombre</Kicker>
              <h2 style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 22, color: "#efd2a0", marginBottom: 12 }}>Nombre de rueda</h2>
              <input
                style={inputBase}
                type="text"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setError(null);
                }}
                placeholder="Como te conocen en el pago..."
                maxLength={24}
                onKeyDown={(e) => {
                  if (e.key === "Enter") comenzar();
                }}
              />
              {error ? <p style={{ marginTop: 8, fontSize: 12, color: "#f3b0a4" }}>{error}</p> : null}
            </Panel>

            <Panel>
              <Kicker>Dificultad</Kicker>
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
                        borderRadius: 16,
                        border: `1px solid ${seleccionada ? `${op.acento}55` : "rgba(198,139,71,0.12)"}`,
                        background: seleccionada ? `${op.acento}12` : "rgba(255,245,228,0.03)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        style={{
                          flexShrink: 0,
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: `${op.acento}15`,
                          border: `1px solid ${op.acento}33`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icono size={18} style={{ color: op.acento }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: seleccionada ? op.acento : "#efd2a0", marginBottom: 4, fontFamily: "'Cinzel', Georgia, serif" }}>
                          {op.titulo}
                        </div>
                        <div style={{ fontSize: 13, color: "#bca684", lineHeight: 1.6 }}>{op.descripcion}</div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </Panel>

            <motion.button
              type="button"
              onClick={comenzar}
              style={{
                width: "100%",
                padding: "16px 32px",
                borderRadius: 999,
                background: "linear-gradient(135deg, #efb85b, #c46d2b)",
                border: "none",
                color: "#1a0f00",
                fontFamily: "'Cinzel Decorative', Georgia, serif",
                fontSize: 15,
                fontWeight: 900,
                letterSpacing: "0.06em",
                cursor: "pointer",
                boxShadow: "0 10px 34px rgba(196,109,43,0.25)",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Comenzar practica
            </motion.button>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

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
        background: "rgba(8,15,12,0.94)",
        backdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 24,
      }}
    >
      <motion.div
        initial={{ scale: 0.88, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        style={{
          maxWidth: 480,
          width: "100%",
          borderRadius: 28,
          padding: "44px 38px",
          textAlign: "center",
          background: "linear-gradient(180deg, rgba(29,20,15,0.9), rgba(13,17,14,0.96))",
          border: "1px solid rgba(198,139,71,0.16)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.48)",
        }}
      >
        <Image src="/logo-gaucho-puro.png" alt={GAME_BRAND} width={86} height={86} style={{ borderRadius: 999, margin: "0 auto 20px" }} />
        <div style={{ marginBottom: 20 }}>
          {ganoJugador ? <Trophy size={48} style={{ color: "#f5d98a", margin: "0 auto" }} /> : <Swords size={48} style={{ color: "#f3b0a4", margin: "0 auto" }} />}
        </div>
        <h2 style={{ fontFamily: "'Cinzel Decorative', Georgia, serif", fontSize: "1.9rem", color: ganoJugador ? "#f5d98a" : "#f3b0a4", marginBottom: 12 }}>
          {ganoJugador ? "Victoria" : "Caida en el campo"}
        </h2>
        <p style={{ color: "#c8b08a", fontSize: 15, lineHeight: 1.75 }}>
          {ganoJugador ? `${nombreJugador} salio mejor parado en una rueda ${dificultad}.` : `La CPU te gano en una rueda ${dificultad}. Puedes entrar de nuevo y ajustar la mano.`}
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
          <motion.button
            type="button"
            onClick={onRejugar}
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #efb85b, #c46d2b)",
              border: "none",
              color: "#1b1208",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              cursor: "pointer",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="flex items-center justify-center gap-2">
              <RotateCcw size={14} />
              Rejugar
            </span>
          </motion.button>
          <motion.button
            type="button"
            onClick={onSalir}
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: 999,
              background: "rgba(255,245,228,0.04)",
              border: "1px solid rgba(198,139,71,0.12)",
              color: "#d89b45",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              cursor: "pointer",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Salir
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

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

  const ejecutarTurnoCPU = useCallback(() => {
    function paso() {
      if (!procesandoCpuRef.current) return;

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
        try {
          const fallback = applyBattleAction(batallaActual, ID_CPU, { type: "ADVANCE_PHASE", payload: {} });
          actualizarVista(fallback, contexto);
        } catch {
          procesandoCpuRef.current = false;
          return;
        }
      }

      setTimeout(paso, 600);
    }

    setTimeout(paso, 900);
  }, [dificultad, setGameView]);

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
      return;
    }

    actualizarVista(nuevaBatalla, contexto);

    if (nuevaBatalla.phase === "BATTLE_OVER") {
      verificarFinPartida(nuevaBatalla);
      return;
    }

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
