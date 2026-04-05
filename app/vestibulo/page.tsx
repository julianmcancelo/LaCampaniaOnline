"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Users, Swords, Shield, RefreshCw, CheckCircle, Circle, Wifi, WifiOff, Hash, Crown, Handshake } from "lucide-react";
import { usarSocket } from "../../ganchos/usarSocket";
import { obtenerSocket } from "../../lib/socket";
import { usarEstadoJuego } from "../../ganchos/usarEstadoJuego";
import type { EquipoId, ModoJuego } from "../../motor/tipos";

const modosSala = [
  { id: "duelo", titulo: "Duelo", subtitulo: "1 vs 1", descripcion: "El enfrentamiento más directo. Un mano a mano donde cada decisión pesa el doble.", icono: Swords, mode: "individual" as ModoJuego, maxJugadores: 2, teamId: null, acento: "#fb923c", fondo: "rgba(251,146,60,0.06)", borde: "rgba(251,146,60,0.18)" },
  { id: "escuadra", titulo: "Escuadra", subtitulo: "3 jugadores", descripcion: "Tres comandantes, un solo trono. Las alianzas son tan peligrosas como los enemigos.", icono: Users, mode: "individual" as ModoJuego, maxJugadores: 3, teamId: null, acento: "#818cf8", fondo: "rgba(129,140,248,0.06)", borde: "rgba(129,140,248,0.18)" },
  { id: "consejo", titulo: "Consejo", subtitulo: "4 jugadores", descripcion: "Cuatro frentes abiertos. El caos es tu aliado si sabés manejarlo.", icono: Crown, mode: "individual" as ModoJuego, maxJugadores: 4, teamId: null, acento: "#fbbf24", fondo: "rgba(251,191,36,0.06)", borde: "rgba(251,191,36,0.18)" },
  { id: "alianzas", titulo: "Alianzas", subtitulo: "2 vs 2", descripcion: "La coordinación lo es todo. Ganás con tu compañero o caen juntos.", icono: Handshake, mode: "alianzas" as ModoJuego, maxJugadores: 4, teamId: "A" as EquipoId, acento: "#34d399", fondo: "rgba(52,211,153,0.06)", borde: "rgba(52,211,153,0.18)" },
];

function Etiqueta({ texto }: { texto: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div style={{ width: 14, height: 1, background: "rgba(212,160,23,0.5)" }} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase" as const, color: "#d4a017" }}>{texto}</span>
    </div>
  );
}

function Divisor() {
  return <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.2), transparent)" }} />;
}

export default function PaginaVestibulo() {
  usarSocket();
  const router = useRouter();
  const { roomList, currentRoom, error, setError, connection, playerId } = usarEstadoJuego();
  const [nombre, setNombre] = useState("");
  const [nombreSala, setNombreSala] = useState("");
  const [modo, setModo] = useState<ModoJuego>("individual");
  const [maxJugadores, setMaxJugadores] = useState(2);
  const [equipo, setEquipo] = useState<EquipoId>("A");
  const [tab, setTab] = useState<"crear" | "unirse">("crear");
  const [cargando, setCargando] = useState<string | null>(null);

  useEffect(() => {
    obtenerSocket().emit("room:list");
    const iv = setInterval(() => obtenerSocket().emit("room:list"), 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (currentRoom) router.push(`/sala/${currentRoom.id}`);
  }, [currentRoom, router]);

  const salasDisponibles = useMemo(() => roomList.filter((r) => r.estado === "waiting"), [roomList]);

  function nombrePorDefecto(m: ModoJuego, j: number) {
    if (m === "alianzas") return "Mesa de alianzas";
    if (j === 2) return "Duelo de campaña";
    if (j === 3) return "Consejo de guerra";
    return "Mesa de batalla";
  }

  function crearSala() {
    const n = nombre.trim();
    if (n.length < 2) { setError("Ingresá un nombre de al menos 2 caracteres."); return; }
    setCargando("manual");
    obtenerSocket().emit("room:create", { roomName: nombreSala.trim() || nombrePorDefecto(modo, modo === "alianzas" ? 4 : maxJugadores), displayName: n, mode: modo, maxPlayers: modo === "alianzas" ? 4 : maxJugadores, teamId: modo === "alianzas" ? equipo : null });
  }

  function crearPreset(preset: (typeof modosSala)[0]) {
    const n = nombre.trim();
    if (n.length < 2) { setError("Ingresá tu nombre antes de crear una sala."); return; }
    setCargando(preset.id);
    obtenerSocket().emit("room:create", { roomName: preset.titulo, displayName: n, mode: preset.mode, maxPlayers: preset.maxJugadores, teamId: preset.mode === "alianzas" ? preset.teamId : null });
  }

  function unirseASala(idSala: string, modoSala: ModoJuego) {
    const n = nombre.trim();
    if (n.length < 2) { setError("Ingresá tu nombre antes de unirte."); return; }
    setCargando(idSala);
    obtenerSocket().emit("room:join", { roomId: idSala, displayName: n, teamId: modoSala === "alianzas" ? equipo : null });
  }

  const conectado = connection === "connected";
  const nombreValido = nombre.trim().length >= 2;
  const iBase: React.CSSProperties = { width: "100%", padding: "11px 14px", borderRadius: 10, fontFamily: "'Cinzel', Georgia, serif", fontSize: 13, color: "#e8dcc4", background: "rgba(4,10,7,0.8)", border: "1px solid rgba(212,160,23,0.12)", outline: "none" };
  const panelBase: React.CSSProperties = { background: "rgba(13,35,24,0.45)", border: "1px solid rgba(212,160,23,0.1)", backdropFilter: "blur(16px)" };

  return (
    <div style={{ background: "#050e09", color: "#e8dcc4", minHeight: "100vh" }}>
      {/* Fondo */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div style={{ position: "absolute", top: "-10%", right: "5%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(13,35,24,0.6) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: 0, left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,160,23,0.04) 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(212,160,23,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(212,160,23,0.025) 1px, transparent 1px)", backgroundSize: "80px 80px", maskImage: "radial-gradient(ellipse 60% 60% at 10% 20%, black 0%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 10% 20%, black 0%, transparent 80%)" }} />
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-5" style={{ background: "rgba(5,14,9,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(212,160,23,0.08)" }}>
        <Link href="/"><motion.span className="cursor-pointer" style={{ fontFamily: "'Cinzel Decorative', Georgia, serif", fontSize: 14, color: "#f5d98a", letterSpacing: "0.08em" }} whileHover={{ opacity: 0.7 }}>La Campaña</motion.span></Link>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: conectado ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${conectado ? "rgba(52,211,153,0.2)" : "rgba(239,68,68,0.2)"}` }}>
            {conectado ? <Wifi size={11} color="#34d399" /> : <WifiOff size={11} color="#f87171" />}
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: conectado ? "#6ee7b7" : "#fca5a5" }}>{conectado ? "En línea" : "Sin conexión"}</span>
          </div>
          <Link href="/"><motion.span className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3a5040", fontFamily: "'Cinzel', Georgia, serif" }} whileHover={{ color: "#8a9e92" }}><ArrowLeft size={12} /> Inicio</motion.span></Link>
        </div>
      </nav>

      <main className="relative px-6 py-16 max-w-6xl mx-auto">
        {/* HEADER */}
        <motion.div className="mb-14" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 16, height: 1, background: "rgba(212,160,23,0.5)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#d4a017" }}>Sala de comandantes</span>
          </div>
          <h1 style={{ fontFamily: "'Cinzel Decorative', Georgia, serif", fontSize: "clamp(2.4rem, 6vw, 4.5rem)", fontWeight: 900, color: "#f5d98a", lineHeight: 1.0, textShadow: "0 0 60px rgba(212,160,23,0.12), 0 4px 20px rgba(0,0,0,0.9)", marginBottom: 14 }}>Vestíbulo</h1>
          <p style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 14, color: "#3a5040", lineHeight: 1.8, maxWidth: 380 }}>Elegí el modo de batalla, ingresá tu nombre y comenzá en segundos.</p>
        </motion.div>

        {/* ERROR */}
        <AnimatePresence>
          {error && (
            <motion.div className="flex items-center justify-between gap-4 mb-6 px-5 py-4 rounded-xl" style={{ background: "rgba(90,14,14,0.5)", border: "1px solid rgba(180,50,50,0.3)" }} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <span style={{ fontSize: 13, color: "#fca5a5" }}>{error}</span>
              <button type="button" onClick={() => setError(null)} style={{ color: "#fca5a5", opacity: 0.6, fontSize: 20, lineHeight: 1, cursor: "pointer", background: "none", border: "none" }}>×</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* COLUMNA PRINCIPAL */}
          <div className="space-y-5">
            {/* Nombre */}
            <motion.div className="p-6 rounded-2xl" style={panelBase} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}>
              <Etiqueta texto="Tu identidad" />
              <h2 style={{ fontFamily: "'Cinzel Decorative', Georgia, serif", fontSize: 18, color: "#e8dcc4", marginBottom: 12, fontWeight: 700 }}>Nombre de batalla</h2>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre en la campaña..." maxLength={24} style={{ ...iBase, fontSize: 15, padding: "13px 16px", border: `1px solid ${nombreValido ? "rgba(212,160,23,0.35)" : "rgba(212,160,23,0.12)"}`, transition: "border-color 0.2s" }} />
              {nombre.length > 0 && !nombreValido && <p style={{ marginTop: 6, fontSize: 12, color: "#f87171" }}>Mínimo 2 caracteres.</p>}
            </motion.div>

            {/* Tabs */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16 }}>
              <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                {(["crear", "unirse"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setTab(t)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-200" style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", background: tab === t ? "rgba(212,160,23,0.1)" : "transparent", color: tab === t ? "#f5d98a" : "#2a3a30", border: tab === t ? "1px solid rgba(212,160,23,0.25)" : "1px solid transparent" }}>
                    {t === "crear" ? <><Swords size={11} strokeWidth={1.5} /> Crear sala</> : <><Users size={11} strokeWidth={1.5} /> Unirse {salasDisponibles.length > 0 && <span style={{ marginLeft: 4, padding: "1px 6px", borderRadius: 5, background: "rgba(212,160,23,0.15)", color: "#d4a017", fontSize: 9 }}>{salasDisponibles.length}</span>}</>}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {tab === "crear" && (
                  <motion.div key="crear" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                    <div className="grid sm:grid-cols-2 gap-3 mb-5">
                      {modosSala.map((preset, i) => {
                        const Icono = preset.icono;
                        const activo = cargando === preset.id;
                        return (
                          <motion.button key={preset.id} type="button" onClick={() => crearPreset(preset)} disabled={!!cargando} className="p-5 rounded-2xl text-left relative overflow-hidden" style={{ background: preset.fondo, border: `1px solid ${preset.borde}`, cursor: cargando ? "not-allowed" : "pointer", opacity: cargando && !activo ? 0.35 : 1 }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: cargando && !activo ? 0.35 : 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={!cargando ? { y: -3, borderColor: preset.acento + "55" } : {}} whileTap={!cargando ? { scale: 0.98 } : {}}>
                            <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: `linear-gradient(90deg, transparent, ${preset.acento}50, transparent)` }} />
                            <div className="flex items-center justify-between mb-3">
                              <div style={{ width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: `${preset.acento}15`, border: `1px solid ${preset.acento}30` }}>
                                {activo ? <RefreshCw size={14} color={preset.acento} className="animate-spin" /> : <Icono size={14} color={preset.acento} strokeWidth={1.5} />}
                              </div>
                              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: preset.acento, opacity: 0.65 }}>{preset.subtitulo}</span>
                            </div>
                            <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 14, fontWeight: 700, color: "#e8dcc4", marginBottom: 5 }}>{preset.titulo}</div>
                            <p style={{ fontSize: 12, color: "#3a5040", lineHeight: 1.6 }}>{preset.descripcion}</p>
                          </motion.button>
                        );
                      })}
                    </div>
                    <div className="p-5 rounded-2xl" style={{ background: "rgba(10,26,19,0.55)", border: "1px solid rgba(212,160,23,0.08)" }}>
                      <Etiqueta texto="Configuración manual" />
                      <div className="grid sm:grid-cols-2 gap-3 mb-4">
                        <label className="block"><span style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#3a5040", marginBottom: 7 }}>Nombre de sala</span><input value={nombreSala} onChange={(e) => setNombreSala(e.target.value)} placeholder="Opcional..." style={iBase} /></label>
                        <label className="block"><span style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#3a5040", marginBottom: 7 }}>Modo</span>
                          <select value={modo} onChange={(e) => setModo(e.target.value as ModoJuego)} style={{ ...iBase, cursor: "pointer" }}><option value="individual">Individual</option><option value="alianzas">Alianzas (2 vs 2)</option></select>
                        </label>
                        {modo === "individual" && <label className="block"><span style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#3a5040", marginBottom: 7 }}>Jugadores</span><select value={maxJugadores} onChange={(e) => setMaxJugadores(Number(e.target.value))} style={{ ...iBase, cursor: "pointer" }}>{[2,3,4,5].map((n) => <option key={n} value={n}>{n} jugadores</option>)}</select></label>}
                        {modo === "alianzas" && <label className="block"><span style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#3a5040", marginBottom: 7 }}>Equipo</span><select value={equipo} onChange={(e) => setEquipo(e.target.value as EquipoId)} style={{ ...iBase, cursor: "pointer" }}><option value="A">Equipo A</option><option value="B">Equipo B</option></select></label>}
                      </div>
                      <motion.button type="button" disabled={!nombreValido || !!cargando} onClick={crearSala} className="w-full flex items-center justify-center gap-2" style={{ padding: "12px 20px", borderRadius: 11, fontFamily: "'Cinzel', Georgia, serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#f5d98a", background: "linear-gradient(160deg, rgba(36,94,74,0.9), rgba(18,54,38,0.95))", border: "1px solid rgba(212,160,23,0.3)", cursor: !nombreValido || !!cargando ? "not-allowed" : "pointer", opacity: !nombreValido ? 0.4 : 1 }} whileHover={nombreValido && !cargando ? { borderColor: "rgba(212,160,23,0.6)" } : {}} whileTap={nombreValido && !cargando ? { scale: 0.98 } : {}}>
                        {cargando === "manual" ? <RefreshCw size={13} className="animate-spin" /> : <Swords size={13} strokeWidth={1.5} />} Crear sala personalizada
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {tab === "unirse" && (
                  <motion.div key="unirse" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                    <div className="p-5 rounded-2xl" style={{ background: "rgba(10,26,19,0.55)", border: "1px solid rgba(212,160,23,0.08)" }}>
                      <div className="flex items-center justify-between mb-5">
                        <Etiqueta texto="Partidas disponibles" />
                        <motion.button type="button" onClick={() => obtenerSocket().emit("room:list")} className="flex items-center gap-1.5" style={{ fontSize: 11, color: "#3a5040", cursor: "pointer", background: "none", border: "none" }} whileHover={{ color: "#d4a017" }} whileTap={{ rotate: 180 }} transition={{ duration: 0.3 }}><RefreshCw size={11} /> Actualizar</motion.button>
                      </div>
                      {salasDisponibles.length === 0 ? (
                        <div className="py-14 text-center">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.1)" }}><Users size={20} color="rgba(212,160,23,0.25)" strokeWidth={1.5} /></div>
                          <p style={{ fontSize: 13, color: "#2a3a30", marginBottom: 14 }}>No hay partidas disponibles ahora mismo.</p>
                          <motion.button type="button" onClick={() => setTab("crear")} className="inline-flex items-center gap-2" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#d4a017", cursor: "pointer", background: "none", border: "none", fontFamily: "'Cinzel', Georgia, serif" }} whileHover={{ gap: "10px" }}>Crear una sala <ArrowRight size={11} /></motion.button>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {salasDisponibles.map((sala, i) => (
                            <motion.button key={sala.id} type="button" onClick={() => unirseASala(sala.id, sala.modo)} disabled={!!cargando} className="w-full p-5 rounded-2xl text-left" style={{ background: "rgba(13,35,24,0.5)", border: "1px solid rgba(212,160,23,0.1)", cursor: cargando ? "not-allowed" : "pointer", opacity: cargando && cargando !== sala.id ? 0.35 : 1 }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} whileHover={!cargando ? { borderColor: "rgba(212,160,23,0.3)", x: 3 } : {}}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 14, fontWeight: 700, color: "#e8dcc4", marginBottom: 8 }}>{sala.nombre}</div>
                                  <div className="flex flex-wrap gap-2">
                                    <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", background: "rgba(212,160,23,0.08)", color: "#d4a017", border: "1px solid rgba(212,160,23,0.15)" }}>{sala.modo}</span>
                                    <span className="flex items-center gap-1" style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: "rgba(52,211,153,0.07)", color: "#34d399", border: "1px solid rgba(52,211,153,0.15)" }}><Users size={9} /> {sala.players.length}/{sala.maxJugadores}</span>
                                  </div>
                                </div>
                                {cargando === sala.id ? <RefreshCw size={15} color="#d4a017" className="animate-spin shrink-0 mt-1" /> : <ArrowRight size={15} color="rgba(212,160,23,0.25)" className="shrink-0 mt-1" />}
                              </div>
                              <div className="flex items-center gap-1.5 mt-3"><Hash size={9} color="#1a2a20" /><span style={{ fontSize: 10, fontFamily: "monospace", color: "#1a2a20" }}>{sala.id.slice(0, 8).toUpperCase()}</span></div>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* SIDEBAR */}
          <motion.aside className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.22 }}>
            <div className="p-5 rounded-2xl" style={{ ...panelBase }}>
              <Etiqueta texto="Tu sesión" />
              <div className="space-y-3">
                <div className="flex items-center justify-between"><span style={{ fontSize: 12, color: "#2a3a30" }}>Estado</span><div className="flex items-center gap-2"><div style={{ width: 6, height: 6, borderRadius: "50%", background: conectado ? "#34d399" : "#f87171", boxShadow: conectado ? "0 0 8px #34d399" : "none" }} /><span style={{ fontSize: 12, fontWeight: 700, color: conectado ? "#6ee7b7" : "#fca5a5" }}>{conectado ? "En línea" : "Desconectado"}</span></div></div>
                <Divisor />
                <div className="flex items-center justify-between"><span style={{ fontSize: 12, color: "#2a3a30" }}>Salas abiertas</span><span style={{ fontFamily: "'Cinzel Decorative', Georgia, serif", fontSize: 22, fontWeight: 900, color: "#f5d98a", textShadow: "0 0 20px rgba(212,160,23,0.2)" }}>{salasDisponibles.length}</span></div>
              </div>
            </div>

            <div className="p-5 rounded-2xl" style={{ ...panelBase }}>
              <Etiqueta texto="Recordatorio" />
              <ul className="space-y-3">
                {[{ icono: CheckCircle, texto: "7 cartas aleatorias al inicio.", color: "#34d399" }, { icono: Shield, texto: "Bajá 1 guerrero antes del primer turno.", color: "#818cf8" }, { icono: Swords, texto: "5 acciones por turno.", color: "#fb923c" }, { icono: Crown, texto: "25 de Oro o eliminá a todos.", color: "#fbbf24" }].map(({ icono: Icono, texto, color }, i) => (
                  <li key={i} className="flex items-start gap-3"><Icono size={13} color={color} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} /><span style={{ fontSize: 12, color: "#2a3a30", lineHeight: 1.6 }}>{texto}</span></li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl" style={{ ...panelBase }}>
              <Etiqueta texto="Modalidades" />
              <div className="space-y-2">
                {[{ label: "Individual", desc: "Todos contra todos. 2–5 jugadores.", acento: "#fb923c" }, { label: "Alianzas", desc: "2 vs 2. Ganás con tu equipo.", acento: "#34d399" }].map((m, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: `${m.acento}08`, border: `1px solid ${m.acento}18` }}>
                    <Circle size={5} color={m.acento} fill={m.acento} style={{ flexShrink: 0, marginTop: 5 }} />
                    <div><div style={{ fontSize: 12, fontWeight: 700, color: m.acento }}>{m.label}</div><div style={{ fontSize: 11, color: "#2a3a30", marginTop: 2 }}>{m.desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        </div>
      </main>
    </div>
  );
}
