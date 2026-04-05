"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Copy, Check, Share2, Link2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import TableroJuego from "../../../componentes/juego/TableroJuego";
import { usarEstadoJuego } from "../../../ganchos/usarEstadoJuego";
import { usarSocket } from "../../../ganchos/usarSocket";
import { obtenerSocket } from "../../../lib/socket";
import type { EquipoId } from "../../../motor/tipos";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: Tarjeta de invitación con todas las opciones
// ─────────────────────────────────────────────────────────────────────────────

function TarjetaInvitacion({ idSala }: { idSala: string }) {
  const [copiado, setCopiado] = useState<"codigo" | "link" | null>(null);
  const [tieneShare, setTieneShare] = useState(false);

  useEffect(() => {
    setTieneShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const codigoCort = idSala.slice(0, 8).toUpperCase();
  const urlSala = typeof window !== "undefined" ? `${window.location.origin}/sala/${idSala}` : "";

  async function copiar(tipo: "codigo" | "link") {
    const texto = tipo === "codigo" ? codigoCort : urlSala;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(tipo);
      setTimeout(() => setCopiado(null), 2200);
    } catch {
      // fallback para navegadores sin clipboard API
      const el = document.createElement("textarea");
      el.value = texto;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiado(tipo);
      setTimeout(() => setCopiado(null), 2200);
    }
  }

  async function compartirNativo() {
    try {
      await navigator.share({
        title: "La Campaña Online",
        text: `Unite a mi sala con el código ${codigoCort}`,
        url: urlSala,
      });
    } catch {
      // el usuario canceló o no soportado
    }
  }

  return (
    <div className="p-5 rounded-2xl" style={{ background: "rgba(13,35,24,0.5)", border: "1px solid rgba(212,160,23,0.12)", backdropFilter: "blur(16px)" }}>
      {/* Etiqueta */}
      <div className="flex items-center gap-3 mb-4">
        <div style={{ width: 14, height: 1, background: "rgba(212,160,23,0.5)" }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase" as const, color: "#d4a017" }}>Invitar jugadores</span>
      </div>

      {/* Código grande — el protagonista */}
      <div className="mb-4">
        <p style={{ fontSize: 11, color: "#3a5040", marginBottom: 8 }}>Código de sala</p>
        <motion.button
          type="button"
          onClick={() => copiar("codigo")}
          className="w-full relative overflow-hidden group"
          style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 14, padding: "16px 20px", cursor: "pointer" }}
          whileHover={{ borderColor: "rgba(212,160,23,0.5)", background: "rgba(212,160,23,0.1)" }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Brillo al hover */}
          <div style={{ position: "absolute", top: 0, left: "5%", right: "5%", height: 1, background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.4), transparent)" }} />

          <div className="flex items-center justify-between gap-3">
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "clamp(1.4rem, 4vw, 2rem)",
                fontWeight: 900,
                color: "#f5d98a",
                letterSpacing: "0.25em",
                textShadow: "0 0 30px rgba(212,160,23,0.3)",
              }}
            >
              {codigoCort}
            </span>
            <AnimatePresence mode="wait">
              {copiado === "codigo" ? (
                <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ color: "#34d399" }}>
                  <Check size={20} />
                </motion.span>
              ) : (
                <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ color: "rgba(212,160,23,0.4)" }}>
                  <Copy size={18} />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <p style={{ fontSize: 11, color: "#3a5040", marginTop: 4, textAlign: "left" as const }}>
            {copiado === "codigo" ? "Copiado al portapapeles" : "Tocá para copiar"}
          </p>
        </motion.button>
      </div>

      {/* Link completo */}
      <div className="mb-4">
        <p style={{ fontSize: 11, color: "#3a5040", marginBottom: 8 }}>Link directo</p>
        <div className="flex gap-2">
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl overflow-hidden"
            style={{ background: "rgba(4,10,7,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Link2 size={12} color="#2a3a30" style={{ flexShrink: 0 }} />
            <span
              className="truncate"
              style={{ fontSize: 11, fontFamily: "monospace", color: "#2a3a30", letterSpacing: "0.02em" }}
            >
              {urlSala}
            </span>
          </div>
          <motion.button
            type="button"
            onClick={() => copiar("link")}
            className="flex items-center justify-center px-3 rounded-xl"
            style={{ background: copiado === "link" ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${copiado === "link" ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.08)"}`, cursor: "pointer", flexShrink: 0 }}
            whileHover={{ background: "rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.95 }}
          >
            {copiado === "link" ? <Check size={14} color="#34d399" /> : <Copy size={14} color="#4a6050" />}
          </motion.button>
        </div>
      </div>

      {/* Compartir nativo (mobile) */}
      {tieneShare && (
        <motion.button
          type="button"
          onClick={compartirNativo}
          className="w-full flex items-center justify-center gap-2"
          style={{ padding: "11px 16px", borderRadius: 12, fontFamily: "'Cinzel', Georgia, serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#f5d98a", background: "linear-gradient(160deg, rgba(36,94,74,0.8), rgba(18,54,38,0.9))", border: "1px solid rgba(212,160,23,0.25)", cursor: "pointer" }}
          whileHover={{ borderColor: "rgba(212,160,23,0.5)" }}
          whileTap={{ scale: 0.97 }}
        >
          <Share2 size={13} strokeWidth={2} />
          Compartir invitación
        </motion.button>
      )}

      {/* Instrucciones */}
      <p style={{ marginTop: 12, fontSize: 11, color: "#1a2a20", lineHeight: 1.7, textAlign: "center" as const }}>
        Compartí el código o el link y tus rivales entran directo a esta sala.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA SALA
// ─────────────────────────────────────────────────────────────────────────────

export default function PaginaSala() {
  usarSocket();
  const router = useRouter();
  const { room, gameView, playerId, error, setError, connection } = usarEstadoJuego();

  useEffect(() => {
    if (!room) obtenerSocket().emit("room:list");
  }, [room]);

  useEffect(() => {
    if (!room && !gameView) {
      const t = window.setTimeout(() => router.push("/vestibulo"), 150);
      return () => window.clearTimeout(t);
    }
  }, [gameView, room, router]);

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#040e09" }}>
        <div className="text-center">
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <RefreshCw size={18} color="rgba(212,160,23,0.4)" className="animate-spin" />
          </motion.div>
          <p style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 13, color: "#2a3a30", letterSpacing: "0.1em" }}>Cargando sala...</p>
        </div>
      </div>
    );
  }

  if (gameView?.battle) return <TableroJuego />;

  const yo = room.players.find((p) => p.playerId === playerId);
  const puedeIniciar = Boolean(yo?.isHost) && room.players.length >= 2 && room.players.every((p) => p.isReady);
  const listos = room.players.filter((p) => p.isReady).length;
  const porcentaje = Math.round((listos / room.maxJugadores) * 100);
  const conectado = connection === "connected";

  return (
    <div style={{ background: "#050e09", color: "#e8dcc4", minHeight: "100vh" }}>
      {/* Fondo */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div style={{ position: "absolute", top: "10%", right: "0%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(13,35,24,0.5) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,160,23,0.04) 0%, transparent 70%)", filter: "blur(50px)" }} />
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-5" style={{ background: "rgba(5,14,9,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(212,160,23,0.08)" }}>
        <div className="flex items-center gap-4">
          <motion.button
            type="button"
            onClick={() => { obtenerSocket().emit("room:leave"); router.push("/vestibulo"); }}
            className="flex items-center gap-2 cursor-pointer"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3a5040", fontFamily: "'Cinzel', Georgia, serif", background: "none", border: "none" }}
            whileHover={{ color: "#8a9e92" }}
          >
            <ArrowLeft size={12} /> Salir
          </motion.button>
          <div style={{ width: 1, height: 16, background: "rgba(212,160,23,0.15)" }} />
          <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 13, color: "#e8dcc4", fontWeight: 700 }}>{room.nombre}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: conectado ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${conectado ? "rgba(52,211,153,0.2)" : "rgba(239,68,68,0.2)"}` }}>
            {conectado ? <Wifi size={11} color="#34d399" /> : <WifiOff size={11} color="#f87171" />}
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: conectado ? "#6ee7b7" : "#fca5a5" }}>{conectado ? "En línea" : "Sin conexión"}</span>
          </div>
        </div>
      </nav>

      <main className="relative px-6 py-12 max-w-6xl mx-auto">
        {/* HEADER */}
        <motion.div className="mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 16, height: 1, background: "rgba(212,160,23,0.5)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#d4a017" }}>Antesala de batalla</span>
          </div>
          <h1 style={{ fontFamily: "'Cinzel Decorative', Georgia, serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, color: "#f5d98a", lineHeight: 1.0, textShadow: "0 0 60px rgba(212,160,23,0.12), 0 4px 20px rgba(0,0,0,0.9)", marginBottom: 14 }}>{room.nombre}</h1>

          {/* Barra de progreso */}
          <div style={{ maxWidth: 320 }}>
            <div className="flex justify-between mb-2">
              <span style={{ fontSize: 12, color: "#3a5040" }}>Jugadores listos</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#d4a017" }}>{listos}/{room.maxJugadores}</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
              <motion.div style={{ height: "100%", background: "linear-gradient(90deg, #1a4a3a, #d4a017)", borderRadius: 2 }} initial={{ width: 0 }} animate={{ width: `${porcentaje}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
            </div>
          </div>
        </motion.div>

        {/* ERROR */}
        <AnimatePresence>
          {error && (
            <motion.div className="flex items-center justify-between gap-4 mb-6 px-5 py-4 rounded-xl" style={{ background: "rgba(90,14,14,0.5)", border: "1px solid rgba(180,50,50,0.3)" }} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <span style={{ fontSize: 13, color: "#fca5a5" }}>{error}</span>
              <button type="button" onClick={() => setError(null)} style={{ color: "#fca5a5", opacity: 0.6, fontSize: 20, lineHeight: 1, cursor: "pointer", background: "none", border: "none" }}>×</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* JUGADORES */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="p-6 rounded-2xl" style={{ background: "rgba(13,35,24,0.45)", border: "1px solid rgba(212,160,23,0.1)", backdropFilter: "blur(16px)" }}>
              <div className="flex items-center gap-3 mb-5">
                <div style={{ width: 14, height: 1, background: "rgba(212,160,23,0.5)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#d4a017" }}>Escuadra</span>
                <span style={{ marginLeft: "auto", padding: "2px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: "rgba(212,160,23,0.08)", color: "#d4a017", border: "1px solid rgba(212,160,23,0.15)" }}>
                  {room.players.length}/{room.maxJugadores}
                </span>
              </div>

              <div className="grid gap-3">
                {room.players.map((jugador, i) => (
                  <motion.div key={jugador.playerId} className="flex items-center justify-between gap-4 p-4 rounded-2xl" style={{ background: jugador.playerId === playerId ? "rgba(212,160,23,0.05)" : "rgba(26,74,58,0.1)", border: `1px solid ${jugador.playerId === playerId ? "rgba(212,160,23,0.18)" : "rgba(255,255,255,0.04)"}` }} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: jugador.isReady ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${jugador.isReady ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.06)"}`, flexShrink: 0 }}>
                        <Users size={16} color={jugador.isReady ? "#34d399" : "#2a3a30"} strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 14, fontWeight: 700, color: "#e8dcc4", display: "flex", alignItems: "center", gap: 8 }}>
                          {jugador.displayName}
                          {jugador.isHost && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 5, background: "rgba(212,160,23,0.12)", color: "#d4a017", border: "1px solid rgba(212,160,23,0.2)" }}>Anfitrión</span>}
                          {jugador.playerId === playerId && <span style={{ fontSize: 10, color: "#3a5040" }}>· vos</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          {room.modo === "alianzas" && jugador.teamId && <span style={{ fontSize: 10, fontWeight: 700, color: "#d4a017" }}>Eq. {jugador.teamId}</span>}
                          <span style={{ fontSize: 11, color: jugador.connected ? "#2a5a40" : "#5a2a2a" }}>
                            {jugador.connected ? "● conectado" : "○ desconectado"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 px-3 py-1.5 rounded-lg" style={{ background: jugador.isReady ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${jugador.isReady ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.06)"}`, fontSize: 11, fontWeight: 700, color: jugador.isReady ? "#6ee7b7" : "#2a3a30" }}>
                      {jugador.isReady ? "Listo" : "Esperando"}
                    </div>
                  </motion.div>
                ))}

                {/* Slots vacíos */}
                {Array.from({ length: room.maxJugadores - room.players.length }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-2xl" style={{ border: "1.5px dashed rgba(255,255,255,0.04)" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.02)" }} />
                    <span style={{ fontSize: 13, color: "#1a2a20" }}>Esperando jugador...</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* SIDEBAR DERECHO */}
          <motion.div className="space-y-4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.18 }}>

            {/* TARJETA DE INVITACIÓN */}
            <TarjetaInvitacion idSala={room.id} />

            {/* CONTROLES */}
            <div className="p-5 rounded-2xl" style={{ background: "rgba(13,35,24,0.5)", border: "1px solid rgba(212,160,23,0.1)", backdropFilter: "blur(16px)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div style={{ width: 14, height: 1, background: "rgba(212,160,23,0.5)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#d4a017" }}>Preparación</span>
              </div>
              <div className="grid gap-3">
                <motion.button
                  type="button"
                  onClick={() => obtenerSocket().emit("room:setReady", { ready: !yo?.isReady })}
                  className="w-full flex items-center justify-center gap-2"
                  style={{ padding: "12px 16px", borderRadius: 11, fontFamily: "'Cinzel', Georgia, serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", background: yo?.isReady ? "rgba(52,211,153,0.08)" : "linear-gradient(160deg, rgba(36,94,74,0.9), rgba(18,54,38,0.95))", color: yo?.isReady ? "#6ee7b7" : "#f5d98a", border: `1px solid ${yo?.isReady ? "rgba(52,211,153,0.25)" : "rgba(212,160,23,0.3)"}` }}
                  whileHover={{ borderColor: yo?.isReady ? "rgba(52,211,153,0.4)" : "rgba(212,160,23,0.6)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  {yo?.isReady ? <><Check size={13} /> Cancelar listo</> : <><Check size={13} /> Marcar listo</>}
                </motion.button>

                {room.modo === "alianzas" && (
                  <div className="grid grid-cols-2 gap-2">
                    {(["A", "B"] as EquipoId[]).map((eq) => (
                      <motion.button key={eq} type="button" onClick={() => obtenerSocket().emit("room:setTeam", { teamId: eq })} className="py-2.5 rounded-xl" style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", background: yo?.teamId === eq ? "rgba(212,160,23,0.12)" : "rgba(255,255,255,0.03)", color: yo?.teamId === eq ? "#f5d98a" : "#3a5040", border: `1px solid ${yo?.teamId === eq ? "rgba(212,160,23,0.35)" : "rgba(255,255,255,0.06)"}` }} whileHover={{ borderColor: "rgba(212,160,23,0.4)" }} whileTap={{ scale: 0.97 }}>
                        Equipo {eq}
                      </motion.button>
                    ))}
                  </div>
                )}

                {yo?.isHost && (
                  <motion.button
                    type="button"
                    disabled={!puedeIniciar}
                    onClick={() => obtenerSocket().emit("match:start")}
                    className="w-full flex items-center justify-center gap-2"
                    style={{ padding: "13px 16px", borderRadius: 11, fontFamily: "'Cinzel', Georgia, serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: puedeIniciar ? "pointer" : "not-allowed", background: puedeIniciar ? "linear-gradient(160deg, rgba(46,114,90,0.95), rgba(26,74,58,0.98))" : "rgba(255,255,255,0.03)", color: puedeIniciar ? "#f5d98a" : "#2a3a30", border: `1px solid ${puedeIniciar ? "rgba(212,160,23,0.45)" : "rgba(255,255,255,0.06)"}`, boxShadow: puedeIniciar ? "0 0 30px rgba(212,160,23,0.1)" : "none", transition: "all 0.3s" }}
                    whileHover={puedeIniciar ? { borderColor: "rgba(212,160,23,0.7)", boxShadow: "0 0 40px rgba(212,160,23,0.2)" } : {}}
                    whileTap={puedeIniciar ? { scale: 0.98 } : {}}
                  >
                    Iniciar batalla
                  </motion.button>
                )}

                {!yo?.isHost && (
                  <p style={{ fontSize: 11, color: "#1a2a20", textAlign: "center", padding: "8px 0" }}>
                    Esperando al anfitrión para iniciar...
                  </p>
                )}
              </div>

              {yo?.isHost && !puedeIniciar && (
                <p style={{ marginTop: 12, fontSize: 11, color: "#1a2a20", textAlign: "center", lineHeight: 1.6 }}>
                  {room.players.length < 2 ? "Se necesitan al menos 2 jugadores." : `Faltan ${room.maxJugadores - listos} jugador${room.maxJugadores - listos > 1 ? "es" : ""} por confirmar.`}
                </p>
              )}
            </div>

            {/* Modo de juego */}
            <div className="px-5 py-4 rounded-2xl" style={{ background: "rgba(10,26,19,0.4)", border: "1px solid rgba(212,160,23,0.08)" }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 12, color: "#2a3a30" }}>Modo</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#d4a017", textTransform: "uppercase", letterSpacing: "0.1em" }}>{room.modo}</span>
              </div>
            </div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}
