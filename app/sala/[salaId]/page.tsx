"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Copy, Link2, RefreshCw, Share2, Users, Wifi, WifiOff } from "lucide-react";
import TableroJuego from "../../../componentes/juego/TableroJuego";
import { usarEstadoJuego } from "../../../ganchos/usarEstadoJuego";
import { usarSocket } from "../../../ganchos/usarSocket";
import { buildInviteUrl } from "../../../lib/invitaciones";
import { GAME_BRAND } from "../../../lib/lore";
import { obtenerSocket } from "../../../lib/socket";
import type { EquipoId } from "../../../motor/tipos";

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

function TarjetaInvitacion({ idSala }: { idSala: string }) {
  const [copiado, setCopiado] = useState<"codigo" | "link" | null>(null);
  const [tieneShare, setTieneShare] = useState(false);

  useEffect(() => {
    setTieneShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const codigoCorto = idSala.slice(0, 8).toUpperCase();
  const urlSala = typeof window !== "undefined" ? buildInviteUrl(idSala, window.location.origin) : "";

  async function copiar(tipo: "codigo" | "link") {
    const texto = tipo === "codigo" ? codigoCorto : urlSala;
    await navigator.clipboard.writeText(texto);
    setCopiado(tipo);
    setTimeout(() => setCopiado(null), 1800);
  }

  async function compartir() {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: GAME_BRAND,
        text: `Unite a mi sala con el codigo ${codigoCorto}`,
        url: urlSala,
      });
    } catch {}
  }

  return (
    <Panel>
      <Kicker>Invitacion</Kicker>
      <div className="mb-3">
        <div style={{ fontSize: 12, color: "#b89d74", marginBottom: 8 }}>Codigo del fortin</div>
        <button
          type="button"
          onClick={() => copiar("codigo")}
          className="w-full rounded-[20px] p-4 text-left"
          style={{ background: "rgba(216,155,69,0.08)", border: "1px solid rgba(216,155,69,0.18)" }}
        >
          <div className="flex items-center justify-between gap-3">
            <span style={{ fontFamily: "monospace", fontSize: 28, letterSpacing: "0.26em", color: "#f5d98a", fontWeight: 800 }}>{codigoCorto}</span>
            {copiado === "codigo" ? <Check size={18} color="#9ce39c" /> : <Copy size={16} color="#d89b45" />}
          </div>
        </button>
      </div>

      <div className="mb-4">
        <div style={{ fontSize: 12, color: "#b89d74", marginBottom: 8 }}>Enlace directo</div>
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-[16px] px-3 py-3" style={{ background: "rgba(255,245,228,0.04)", border: "1px solid rgba(198,139,71,0.1)" }}>
            <Link2 size={12} color="#b89d74" />
            <span className="truncate" style={{ fontSize: 11, color: "#c8b08a", fontFamily: "monospace" }}>
              {urlSala}
            </span>
          </div>
          <button type="button" onClick={() => copiar("link")} className="rounded-[16px] px-4" style={{ background: "rgba(255,245,228,0.04)", border: "1px solid rgba(198,139,71,0.1)" }}>
            {copiado === "link" ? <Check size={16} color="#9ce39c" /> : <Copy size={16} color="#d89b45" />}
          </button>
        </div>
      </div>

      {tieneShare ? (
        <button
          type="button"
          onClick={compartir}
          className="w-full rounded-full px-5 py-3"
          style={{ background: "linear-gradient(135deg, #efb85b, #c46d2b)", color: "#1b1208", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em" }}
        >
          <span className="flex items-center justify-center gap-2">
            <Share2 size={14} />
            Compartir enlace
          </span>
        </button>
      ) : null}
    </Panel>
  );
}

export default function PaginaSala() {
  usarSocket();
  const router = useRouter();
  const { room, gameView, playerId, error, setError, connection } = usarEstadoJuego();

  useEffect(() => {
    if (!room) {
      obtenerSocket().emit("room:list");
    }
  }, [room]);

  useEffect(() => {
    if (!room && !gameView) {
      const t = window.setTimeout(() => router.push("/vestibulo"), 150);
      return () => window.clearTimeout(t);
    }
  }, [gameView, room, router]);

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#080f0c" }}>
        <div className="text-center">
          <RefreshCw size={22} color="#d89b45" className="mx-auto mb-4 animate-spin" />
          <p style={{ color: "#b89d74", fontSize: 14 }}>Buscando la sala...</p>
        </div>
      </div>
    );
  }

  if (gameView?.battle) {
    return <TableroJuego />;
  }

  const yo = room.players.find((p) => p.playerId === playerId);
  const puedeIniciar = Boolean(yo?.isHost) && room.players.length >= 2 && room.players.every((p) => p.isReady);
  const listos = room.players.filter((p) => p.isReady).length;
  const conectado = connection === "connected";

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
          <button type="button" onClick={() => { obtenerSocket().emit("room:leave"); router.push("/vestibulo"); }} className="flex items-center gap-2" style={{ color: "#b89d74", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", background: "none", border: "none" }}>
            <ArrowLeft size={12} />
            Volver
          </button>

          <div className="flex items-center gap-3">
            <Image src="/logo-gaucho-puro.png" alt={GAME_BRAND} width={34} height={34} style={{ borderRadius: 999 }} />
            <div style={{ fontFamily: "'Cinzel Decorative', Georgia, serif", fontSize: 16, color: "#f5d98a" }}>{room.nombre}</div>
          </div>

          <div className="rounded-full px-3 py-1.5" style={{ background: conectado ? "rgba(67,129,94,0.16)" : "rgba(164,75,66,0.16)", border: `1px solid ${conectado ? "rgba(96,180,126,0.22)" : "rgba(200,101,90,0.22)"}` }}>
            <div className="flex items-center gap-2">
              {conectado ? <Wifi size={11} color="#7dcc72" /> : <WifiOff size={11} color="#f59a88" />}
              <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: conectado ? "#9ce39c" : "#f3b0a4", fontWeight: 700 }}>{conectado ? "En linea" : "Sin conexion"}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mb-8">
          <Kicker>Antesala de batalla</Kicker>
          <h1 style={{ fontFamily: "'Cinzel Decorative', Georgia, serif", fontSize: "clamp(2.3rem,5vw,4rem)", color: "#f7ddb0", lineHeight: 0.96 }}>{room.nombre}</h1>
          <p style={{ marginTop: 14, color: "#c8b08a", maxWidth: 540, fontSize: 16, lineHeight: 1.8 }}>
            Junta a la rueda, deja la sala lista y entra al duelo cuando todos los paisanos esten afirmados.
          </p>
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
          <Panel>
            <Kicker>Rueda presente</Kicker>
            <div className="mb-5 flex items-center justify-between">
              <div style={{ color: "#b89d74", fontSize: 14 }}>Listos para arrancar</div>
              <div style={{ color: "#f5d98a", fontFamily: "'Cinzel Decorative', Georgia, serif", fontSize: 28 }}>{listos}/{room.maxJugadores}</div>
            </div>

            <div className="grid gap-3">
              {room.players.map((jugador) => (
                <div key={jugador.playerId} className="rounded-[22px] p-4" style={{ background: jugador.playerId === playerId ? "rgba(216,155,69,0.08)" : "rgba(255,245,228,0.03)", border: `1px solid ${jugador.playerId === playerId ? "rgba(216,155,69,0.2)" : "rgba(198,139,71,0.1)"}` }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 20, color: "#efd2a0" }}>
                        {jugador.displayName} {jugador.playerId === playerId ? "· vos" : ""}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[12px]" style={{ color: jugador.connected ? "#9ce39c" : "#f3b0a4" }}>
                        <Users size={12} />
                        {jugador.connected ? "Conectado" : "Desconectado"}
                        {room.modo === "alianzas" && jugador.teamId ? <span style={{ color: "#d89b45" }}>· Equipo {jugador.teamId}</span> : null}
                      </div>
                    </div>
                    <div className="rounded-full px-3 py-1.5" style={{ background: jugador.isReady ? "rgba(67,129,94,0.16)" : "rgba(255,245,228,0.05)", border: `1px solid ${jugador.isReady ? "rgba(96,180,126,0.22)" : "rgba(198,139,71,0.12)"}` }}>
                      <span style={{ color: jugador.isReady ? "#9ce39c" : "#b89d74", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 700 }}>
                        {jugador.isReady ? "Listo" : "Esperando"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {Array.from({ length: room.maxJugadores - room.players.length }).map((_, index) => (
                <div key={index} className="rounded-[22px] p-4" style={{ border: "1px dashed rgba(198,139,71,0.12)" }}>
                  <span style={{ color: "#8f7b61", fontSize: 13 }}>Esperando otro paisano...</span>
                </div>
              ))}
            </div>
          </Panel>

          <div className="space-y-4">
            <TarjetaInvitacion idSala={room.id} />

            <Panel>
              <Kicker>Preparacion</Kicker>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => obtenerSocket().emit("room:setReady", { ready: !yo?.isReady })}
                  className="w-full rounded-full px-5 py-3"
                  style={{
                    background: yo?.isReady ? "rgba(67,129,94,0.16)" : "linear-gradient(135deg, #efb85b, #c46d2b)",
                    color: yo?.isReady ? "#9ce39c" : "#1b1208",
                    border: `1px solid ${yo?.isReady ? "rgba(96,180,126,0.22)" : "rgba(198,139,71,0.2)"}`,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  {yo?.isReady ? "Quitar listo" : "Marcar listo"}
                </button>

                {room.modo === "alianzas" ? (
                  <div className="grid grid-cols-2 gap-2">
                    {(["A", "B"] as EquipoId[]).map((eq) => (
                      <button key={eq} type="button" onClick={() => obtenerSocket().emit("room:setTeam", { teamId: eq })} className="rounded-full px-4 py-3" style={{ background: yo?.teamId === eq ? "rgba(216,155,69,0.12)" : "rgba(255,245,228,0.04)", border: `1px solid ${yo?.teamId === eq ? "rgba(216,155,69,0.24)" : "rgba(198,139,71,0.1)"}`, color: yo?.teamId === eq ? "#f5d98a" : "#b89d74", fontWeight: 700 }}>
                        Equipo {eq}
                      </button>
                    ))}
                  </div>
                ) : null}

                {yo?.isHost ? (
                  <button
                    type="button"
                    disabled={!puedeIniciar}
                    onClick={() => obtenerSocket().emit("match:start")}
                    className="w-full rounded-full px-5 py-3"
                    style={{
                      background: puedeIniciar ? "linear-gradient(135deg, #efb85b, #c46d2b)" : "rgba(255,245,228,0.04)",
                      border: `1px solid ${puedeIniciar ? "rgba(216,155,69,0.28)" : "rgba(198,139,71,0.1)"}`,
                      color: puedeIniciar ? "#1b1208" : "#8f7b61",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      opacity: puedeIniciar ? 1 : 0.6,
                    }}
                  >
                    Iniciar batalla
                  </button>
                ) : (
                  <p style={{ color: "#b89d74", fontSize: 13, lineHeight: 1.7 }}>Esperando al anfitrion para largar la rueda.</p>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}
