"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Bot, Crown, Handshake, RefreshCw, Shield, Swords, Users, Wifi, WifiOff } from "lucide-react";
import { usarEstadoJuego } from "../../ganchos/usarEstadoJuego";
import { usarSocket } from "../../ganchos/usarSocket";
import { obtenerSocket } from "../../lib/socket";
import { GAME_BRAND, GAME_TAGLINE } from "../../lib/lore";
import type { EquipoId, ModoJuego } from "../../motor/tipos";

const modosSala = [
  { id: "duelo", titulo: "Duelo", detalle: "1 paisano contra 1", texto: "La forma mas seca y directa de medir mano, lectura y coraje.", mode: "individual" as ModoJuego, maxJugadores: 2, teamId: null, acento: "#d89b45", icono: Swords },
  { id: "escuadra", titulo: "Rueda de 3", detalle: "Todos contra todos", texto: "Tres frentes abiertos en una sola mesa. Pesa mucho la oportunidad.", mode: "individual" as ModoJuego, maxJugadores: 3, teamId: null, acento: "#c77735", icono: Users },
  { id: "consejo", titulo: "Rueda de 4", detalle: "Choque grande", texto: "Cuatro manos en danza. El que mide mejor el campo manda.", mode: "individual" as ModoJuego, maxJugadores: 4, teamId: null, acento: "#f0c77e", icono: Crown },
  { id: "alianzas", titulo: "Alianzas", detalle: "2 contra 2", texto: "Se gana en yunta. Cada jugada tiene que hablar con la de tu companero.", mode: "alianzas" as ModoJuego, maxJugadores: 4, teamId: "A" as EquipoId, acento: "#b36b38", icono: Handshake },
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

export default function PaginaVestibulo() {
  usarSocket();
  const router = useRouter();
  const { roomList, currentRoom, error, setError, connection } = usarEstadoJuego();
  const [nombre, setNombre] = useState("");
  const [nombreSala, setNombreSala] = useState("");
  const [modo, setModo] = useState<ModoJuego>("individual");
  const [maxJugadores, setMaxJugadores] = useState(2);
  const [equipo, setEquipo] = useState<EquipoId>("A");
  const [tab, setTab] = useState<"crear" | "unirse" | "practica">("crear");
  const [cargando, setCargando] = useState<string | null>(null);

  useEffect(() => {
    obtenerSocket().emit("room:list");
    const iv = setInterval(() => obtenerSocket().emit("room:list"), 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (currentRoom) {
      router.push(`/sala/${currentRoom.id}`);
    }
  }, [currentRoom, router]);

  const salasDisponibles = useMemo(() => roomList.filter((r) => r.estado === "waiting"), [roomList]);
  const conectado = connection === "connected";
  const nombreValido = nombre.trim().length >= 2;

  function nombrePorDefecto(m: ModoJuego, j: number) {
    if (m === "alianzas") return "Ronda de fogon";
    if (j === 2) return "Duelo del fortin";
    if (j === 3) return "Rueda brava";
    return "Mesa del pago";
  }

  function crearSala() {
    const n = nombre.trim();
    if (n.length < 2) {
      setError("Ingresa un nombre de al menos 2 letras.");
      return;
    }
    setCargando("manual");
    obtenerSocket().emit("room:create", {
      roomName: nombreSala.trim() || nombrePorDefecto(modo, modo === "alianzas" ? 4 : maxJugadores),
      displayName: n,
      mode: modo,
      maxPlayers: modo === "alianzas" ? 4 : maxJugadores,
      teamId: modo === "alianzas" ? equipo : null,
    });
  }

  function crearPreset(preset: (typeof modosSala)[0]) {
    const n = nombre.trim();
    if (n.length < 2) {
      setError("Ingresa tu nombre antes de crear una sala.");
      return;
    }
    setCargando(preset.id);
    obtenerSocket().emit("room:create", {
      roomName: preset.titulo,
      displayName: n,
      mode: preset.mode,
      maxPlayers: preset.maxJugadores,
      teamId: preset.mode === "alianzas" ? preset.teamId : null,
    });
  }

  function unirseASala(idSala: string, modoSala: ModoJuego) {
    const n = nombre.trim();
    if (n.length < 2) {
      setError("Ingresa tu nombre antes de unirte.");
      return;
    }
    setCargando(idSala);
    obtenerSocket().emit("room:join", { roomId: idSala, displayName: n, teamId: modoSala === "alianzas" ? equipo : null });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 14,
    color: "#f1dec0",
    background: "rgba(21,14,10,0.88)",
    border: "1px solid rgba(198,139,71,0.16)",
    outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080f0c", color: "#f2dfbb" }}>
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 78% 14%, rgba(199,123,47,0.18), transparent 26%), radial-gradient(circle at 12% 72%, rgba(216,155,69,0.1), transparent 28%), linear-gradient(180deg, #15110d 0%, #101713 34%, #080f0c 100%)",
        }}
      />

      <nav
        className="sticky top-0 z-50 border-b px-5 py-4 sm:px-8"
        style={{
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          background: "linear-gradient(180deg, rgba(8,15,12,0.9), rgba(8,15,12,0.56))",
          borderColor: "rgba(198,139,71,0.12)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo-gaucho-puro.png" alt={GAME_BRAND} width={38} height={38} style={{ borderRadius: 999 }} />
            <div>
              <div style={{ fontSize: 10, color: "#d89b45", letterSpacing: "0.24em", textTransform: "uppercase" }}>Frontera abierta</div>
              <div style={{ fontFamily: "'Cinzel Decorative', Georgia, serif", fontSize: 16, color: "#f5d98a" }}>{GAME_BRAND}</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="rounded-full px-3 py-1.5"
              style={{
                background: conectado ? "rgba(67,129,94,0.16)" : "rgba(164,75,66,0.16)",
                border: `1px solid ${conectado ? "rgba(96,180,126,0.22)" : "rgba(200,101,90,0.22)"}`,
              }}
            >
              <div className="flex items-center gap-2">
                {conectado ? <Wifi size={11} color="#7dcc72" /> : <WifiOff size={11} color="#f59a88" />}
                <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: conectado ? "#9ce39c" : "#f3b0a4", fontWeight: 700 }}>
                  {conectado ? "En linea" : "Sin conexion"}
                </span>
              </div>
            </div>
            <Link href="/" className="flex items-center gap-2" style={{ color: "#b89d74", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>
              <ArrowLeft size={12} />
              Inicio
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mb-10">
          <Kicker>Vestibulo del pago</Kicker>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 style={{ fontFamily: "'Cinzel Decorative', Georgia, serif", fontSize: "clamp(2.6rem,6vw,5rem)", lineHeight: 0.95, color: "#f7ddb0", maxWidth: "9ch" }}>
                Arma tu rueda y entra al fortin.
              </h1>
              <p style={{ marginTop: 18, maxWidth: 560, color: "#c8b08a", fontSize: 16, lineHeight: 1.85 }}>
                {GAME_TAGLINE} Crea una sala, invita paisanos y deja lista la mesa para un duelo, una rueda grande o una yunta de alianzas.
              </p>
            </div>

            <Panel>
              <Kicker>Tu nombre</Kicker>
              <h2 style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 22, color: "#efd2a0", marginBottom: 10 }}>Presencia de mesa</h2>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Como te dicen en el pago..."
                maxLength={24}
                style={{
                  ...inputStyle,
                  borderColor: nombreValido ? "rgba(216,155,69,0.34)" : "rgba(198,139,71,0.16)",
                }}
              />
              {!nombreValido && nombre.length > 0 ? <p style={{ marginTop: 8, color: "#f3b0a4", fontSize: 12 }}>Minimo 2 letras.</p> : null}
            </Panel>
          </div>
        </motion.div>

        <AnimatePresence>
          {error ? (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 flex items-center justify-between rounded-2xl px-5 py-4" style={{ background: "rgba(112,39,34,0.38)", border: "1px solid rgba(181,92,83,0.26)" }}>
              <span style={{ color: "#f2b0a8", fontSize: 13 }}>{error}</span>
              <button type="button" onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#f2b0a8", fontSize: 22, cursor: "pointer" }}>
                ×
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-5 flex gap-2 rounded-full p-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(198,139,71,0.1)" }}>
              {[
                { id: "crear", label: "Crear sala", icon: Swords },
                { id: "unirse", label: `Unirse ${salasDisponibles.length ? `(${salasDisponibles.length})` : ""}`, icon: Users },
                { id: "practica", label: "Practica", icon: Bot },
              ].map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id as typeof tab)}
                    className="flex-1 rounded-full px-4 py-3"
                    style={{
                      background: active ? "linear-gradient(135deg, rgba(216,155,69,0.18), rgba(199,123,47,0.12))" : "transparent",
                      border: active ? "1px solid rgba(216,155,69,0.24)" : "1px solid transparent",
                      color: active ? "#f5d98a" : "#8f7b61",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      fontWeight: 700,
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Icon size={12} />
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {tab === "crear" ? (
                <motion.div key="crear" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {modosSala.map((preset) => {
                      const Icon = preset.icono;
                      const active = cargando === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => crearPreset(preset)}
                          disabled={!!cargando}
                          className="rounded-[26px] p-5 text-left"
                          style={{
                            background: "linear-gradient(180deg, rgba(30,20,15,0.85), rgba(14,18,15,0.92))",
                            border: `1px solid ${active ? `${preset.acento}66` : "rgba(198,139,71,0.12)"}`,
                            opacity: cargando && !active ? 0.45 : 1,
                          }}
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: `${preset.acento}18`, border: `1px solid ${preset.acento}33` }}>
                              {active ? <RefreshCw size={15} color={preset.acento} className="animate-spin" /> : <Icon size={15} color={preset.acento} />}
                            </div>
                            <span style={{ color: preset.acento, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700 }}>{preset.detalle}</span>
                          </div>
                          <h3 style={{ fontFamily: "'Cinzel', Georgia, serif", color: "#efd2a0", fontSize: 22 }}>{preset.titulo}</h3>
                          <p style={{ marginTop: 8, color: "#bca684", fontSize: 14, lineHeight: 1.7 }}>{preset.texto}</p>
                        </button>
                      );
                    })}
                  </div>

                  <Panel>
                    <Kicker>Configuracion fina</Kicker>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label>
                        <span style={{ display: "block", marginBottom: 8, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "#b89d74" }}>Nombre de la sala</span>
                        <input value={nombreSala} onChange={(e) => setNombreSala(e.target.value)} placeholder="Opcional..." style={inputStyle} />
                      </label>

                      <label>
                        <span style={{ display: "block", marginBottom: 8, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "#b89d74" }}>Modo</span>
                        <select value={modo} onChange={(e) => setModo(e.target.value as ModoJuego)} style={inputStyle}>
                          <option value="individual">Individual</option>
                          <option value="alianzas">Alianzas</option>
                        </select>
                      </label>

                      {modo === "individual" ? (
                        <label>
                          <span style={{ display: "block", marginBottom: 8, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "#b89d74" }}>Jugadores</span>
                          <select value={maxJugadores} onChange={(e) => setMaxJugadores(Number(e.target.value))} style={inputStyle}>
                            {[2, 3, 4].map((n) => (
                              <option key={n} value={n}>
                                {n} jugadores
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <label>
                          <span style={{ display: "block", marginBottom: 8, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "#b89d74" }}>Equipo</span>
                          <select value={equipo} onChange={(e) => setEquipo(e.target.value as EquipoId)} style={inputStyle}>
                            <option value="A">Equipo A</option>
                            <option value="B">Equipo B</option>
                          </select>
                        </label>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={crearSala}
                      disabled={!nombreValido || !!cargando}
                      className="mt-5 w-full rounded-full px-5 py-3"
                      style={{
                        background: "linear-gradient(135deg, #efb85b, #c46d2b)",
                        color: "#1b1208",
                        fontWeight: 800,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        opacity: !nombreValido || !!cargando ? 0.45 : 1,
                      }}
                    >
                      {cargando === "manual" ? "Armando sala..." : "Crear sala personalizada"}
                    </button>
                  </Panel>
                </motion.div>
              ) : null}

              {tab === "unirse" ? (
                <motion.div key="unirse" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Panel>
                    <div className="mb-5 flex items-center justify-between">
                      <Kicker>Salas abiertas</Kicker>
                      <button type="button" onClick={() => obtenerSocket().emit("room:list")} style={{ background: "none", border: "none", color: "#d89b45", cursor: "pointer" }} className="flex items-center gap-2">
                        <RefreshCw size={12} />
                        Actualizar
                      </button>
                    </div>

                    {salasDisponibles.length === 0 ? (
                      <div className="py-14 text-center">
                        <Users size={24} color="#7c694f" style={{ margin: "0 auto 14px" }} />
                        <p style={{ color: "#b89d74", fontSize: 14 }}>No hay mesas abiertas por ahora.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {salasDisponibles.map((sala) => (
                          <button
                            key={sala.id}
                            type="button"
                            onClick={() => unirseASala(sala.id, sala.modo)}
                            disabled={!!cargando}
                            className="rounded-[22px] p-4 text-left"
                            style={{
                              background: "rgba(255,245,228,0.03)",
                              border: "1px solid rgba(198,139,71,0.1)",
                              opacity: cargando && cargando !== sala.id ? 0.45 : 1,
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 20, color: "#efd2a0" }}>{sala.nombre}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span style={{ padding: "4px 10px", borderRadius: 999, background: "rgba(216,155,69,0.12)", color: "#d89b45", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em" }}>{sala.modo}</span>
                                  <span style={{ padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,0.05)", color: "#c8b08a", fontSize: 10 }}>
                                    {sala.players.length}/{sala.maxJugadores}
                                  </span>
                                </div>
                              </div>
                              <ArrowRight size={16} color="#d89b45" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </Panel>
                </motion.div>
              ) : null}

              {tab === "practica" ? (
                <motion.div key="practica" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Panel>
                    <Kicker>Duelo de entrenamiento</Kicker>
                    <h3 style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 24, color: "#efd2a0" }}>Prueba la mesa en local</h3>
                    <p style={{ marginTop: 10, color: "#bca684", fontSize: 15, lineHeight: 1.8 }}>
                      Afina lectura, ritmo y orden de jugadas contra la CPU antes de pasar a la rueda online.
                    </p>
                    <Link href="/local" className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3" style={{ background: "linear-gradient(135deg, #efb85b, #c46d2b)", color: "#1b1208", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                      Ir a practica
                      <ArrowRight size={14} />
                    </Link>
                  </Panel>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="space-y-4">
            <Panel>
              <Kicker>Estado de rueda</Kicker>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span style={{ color: "#b89d74", fontSize: 13 }}>Conexion</span>
                  <span style={{ color: conectado ? "#9ce39c" : "#f3b0a4", fontWeight: 700 }}>{conectado ? "Activa" : "Caida"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "#b89d74", fontSize: 13 }}>Mesas esperando</span>
                  <span style={{ color: "#f5d98a", fontFamily: "'Cinzel Decorative', Georgia, serif", fontSize: 26 }}>{salasDisponibles.length}</span>
                </div>
              </div>
            </Panel>

            <Panel>
              <Kicker>Regla rapida</Kicker>
              <ul className="space-y-3" style={{ color: "#bca684", fontSize: 14, lineHeight: 1.7 }}>
                <li className="flex gap-3"><Shield size={14} color="#d89b45" style={{ marginTop: 4 }} />Alza 25 de plata en tu fortin o barre la mesa rival.</li>
                <li className="flex gap-3"><Swords size={14} color="#d89b45" style={{ marginTop: 4 }} />Cada fase pesa: leva, cruce, sabotaje, trueque y fortin.</li>
                <li className="flex gap-3"><Users size={14} color="#d89b45" style={{ marginTop: 4 }} />En alianzas la lectura del companero vale tanto como la propia.</li>
              </ul>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}
