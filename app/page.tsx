/**
 * page.tsx — Landing page profesional de La Campaña Online.
 */

"use client";

import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useRef, useEffect } from "react";
import {
  Sword,
  Shield,
  Zap,
  Crown,
  ChevronDown,
  ArrowRight,
  Users,
  Layers,
  Target,
  TrendingUp,
  Bot,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// DATOS
// ─────────────────────────────────────────────────────────────────────────────

const estadisticas = [
  { valor: "77", etiqueta: "Cartas en juego", icono: Layers },
  { valor: "2–5", etiqueta: "Jugadores por partida", icono: Users },
  { valor: "5", etiqueta: "Acciones por turno", icono: Zap },
  { valor: "3+", etiqueta: "Tipos de guerrero", icono: Target },
];

const guerreros = [
  {
    nombre: "Mago",
    descripcion:
      "Maestro de las artes arcanas. Sus pociones restauran vida y sus ataques diezman rivales.",
    poder: "Cura",
    descripcionPoder: "Recupera 3 puntos de vida propios al activarlo.",
    arma: "Poción",
    ventaja: "Vence a Caballeros",
    acento: "#818cf8",
    fondo: "rgba(99,102,241,0.07)",
    borde: "rgba(129,140,248,0.2)",
    icono: Zap,
  },
  {
    nombre: "Caballero",
    descripcion:
      "Élite blindada de la campaña. Potente en defensa, implacable en el cuerpo a cuerpo.",
    poder: "Escudo",
    descripcionPoder: "Absorbe el próximo ataque enemigo. Suma +5 puntos de vida.",
    arma: "Espada",
    ventaja: "Vence a Arqueros",
    acento: "#fb923c",
    fondo: "rgba(251,146,60,0.07)",
    borde: "rgba(251,146,60,0.2)",
    icono: Shield,
  },
  {
    nombre: "Arquero",
    descripcion:
      "Precisión letal desde la distancia. Su Tiro Certero no da segunda oportunidad.",
    poder: "Tiro Certero",
    descripcionPoder:
      "Elimina directamente un guerrero rival del campo de batalla.",
    arma: "Flecha",
    ventaja: "Vence a Magos",
    acento: "#34d399",
    fondo: "rgba(52,211,153,0.07)",
    borde: "rgba(52,211,153,0.2)",
    icono: Target,
  },
  {
    nombre: "Dragón",
    descripcion:
      "Sin aliados ni rivales predeterminados. Equipa cualquier arma. Su poder es neutro pero devastador.",
    poder: "Neutro",
    descripcionPoder:
      "Sin ventaja ni desventaja. Siempre recibe daño impuro. Inmune a Tiro Certero.",
    arma: "Cualquiera",
    ventaja: "Sin debilidad",
    acento: "#fbbf24",
    fondo: "rgba(251,191,36,0.07)",
    borde: "rgba(251,191,36,0.2)",
    icono: Crown,
  },
];

const mecanicas = [
  {
    titulo: "Triángulo de ventajas",
    descripcion:
      "Arqueros vencen a Magos, Magos a Caballeros, Caballeros a Arqueros. El conocimiento del triángulo decide la partida.",
    icono: TrendingUp,
    acento: "#818cf8",
  },
  {
    titulo: "Ataque Puro vs Impuro",
    descripcion:
      "Puro aplica el valor completo del arma. Impuro aplica la mitad. La decisión táctica es tuya cada turno.",
    icono: Sword,
    acento: "#fb923c",
  },
  {
    titulo: "Botín de Guerra",
    descripcion:
      "Al eliminar un guerrero rival, su dueño te entrega 7 cartas. Un solo movimiento puede girar la partida.",
    icono: Crown,
    acento: "#fbbf24",
  },
  {
    titulo: "Construir el Castillo",
    descripcion:
      "Acumulá Oro durante el juego y edificá tu Castillo. Con 25 de Oro ganás la partida. En alianzas, 30.",
    icono: Shield,
    acento: "#34d399",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES AUXILIARES
// ─────────────────────────────────────────────────────────────────────────────

function CursorLuz() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 80, damping: 20 });
  const springY = useSpring(y, { stiffness: 80, damping: 20 });

  useEffect(() => {
    function mover(e: MouseEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
    }
    window.addEventListener("mousemove", mover);
    return () => window.removeEventListener("mousemove", mover);
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-10"
      style={{
        background: `radial-gradient(600px circle at ${springX}px ${springY}px, rgba(212,160,23,0.04) 0%, transparent 60%)`,
      }}
    />
  );
}

function LineaDorada({ className = "" }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        height: 1,
        background:
          "linear-gradient(90deg, transparent, rgba(212,160,23,0.4), transparent)",
      }}
    />
  );
}

function EtiquetaSeccion({ texto }: { texto: string }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-4">
      <div
        style={{ width: 20, height: 1, background: "rgba(212,160,23,0.5)" }}
      />
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#d4a017",
        }}
      >
        {texto}
      </span>
      <div
        style={{ width: 20, height: 1, background: "rgba(212,160,23,0.5)" }}
      />
    </div>
  );
}

function EntradaAlVer({
  children,
  delay = 0,
  y = 24,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
}) {
  const ref = useRef(null);
  const enVista = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={enVista ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA
// ─────────────────────────────────────────────────────────────────────────────

export default function PaginaInicio() {
  const refHero = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: refHero,
    offset: ["start start", "end start"],
  });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opHero = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const yHero = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <div style={{ background: "#050e09", color: "#e8dcc4" }}>
      <CursorLuz />

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
        style={{
          background: "rgba(5,14,9,0.7)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(212,160,23,0.08)",
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <span
          style={{
            fontFamily: "'Cinzel Decorative', Georgia, serif",
            fontSize: 14,
            color: "#f5d98a",
            letterSpacing: "0.08em",
          }}
        >
          La Campaña
        </span>
        <Link href="/vestibulo">
          <motion.span
            className="flex items-center gap-2 cursor-pointer"
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#d4a017",
              fontFamily: "'Cinzel', Georgia, serif",
            }}
            whileHover={{ gap: "14px" }}
            transition={{ duration: 0.2 }}
          >
            Jugar ahora <ArrowRight size={14} />
          </motion.span>
        </Link>
      </motion.nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section
        ref={refHero}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
      >
        {/* Fondo con parallax */}
        <motion.div className="absolute inset-0" style={{ y: yBg }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 90% 70% at 50% 30%, #0d2318 0%, #071510 55%, #050e09 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(212,160,23,0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(212,160,23,0.04) 1px, transparent 1px)
              `,
              backgroundSize: "80px 80px",
              maskImage:
                "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 80%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 80%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "30%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 800,
              height: 400,
              background:
                "radial-gradient(ellipse, rgba(212,160,23,0.06) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
        </motion.div>

        {/* Contenido hero */}
        <motion.div
          className="relative z-10 text-center"
          style={{ opacity: opHero, y: yHero, maxWidth: 980, width: "100%" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <EtiquetaSeccion texto="Juego de cartas estratégico" />
          </motion.div>

          <motion.h1
            style={{
              fontFamily: "'Cinzel Decorative', Georgia, serif",
              fontSize: "clamp(3rem, 7.2vw, 6.1rem)",
              fontWeight: 900,
              color: "#f5d98a",
              lineHeight: 0.96,
              textShadow:
                "0 0 80px rgba(212,160,23,0.15), 0 4px 30px rgba(0,0,0,0.9)",
              letterSpacing: "-0.025em",
              maxWidth: "10.5ch",
              margin: "0 auto",
            }}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            La Campaña
          </motion.h1>

          <motion.p
            style={{
              fontFamily: "'Cinzel Decorative', Georgia, serif",
              fontSize: "clamp(1rem, 2.4vw, 1.45rem)",
              color: "rgba(212,160,23,0.7)",
              marginTop: "0.55em",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            Online
          </motion.p>

          <motion.div
            style={{ margin: "2rem auto", width: 120 }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.85, ease: "easeOut" }}
          >
            <LineaDorada />
          </motion.div>

          <motion.p
            style={{
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: "clamp(0.95rem, 1.7vw, 1.05rem)",
              color: "#8a9e92",
              lineHeight: 1.75,
              maxWidth: 640,
              margin: "0 auto 2.5rem",
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0 }}
          >
            Reclutá guerreros, equipalos con armas y dominá el campo de batalla
            en tiempo real contra jugadores de todo el país.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.15 }}
          >
            <Link href="/vestibulo">
              <motion.span
                className="flex items-center gap-3 cursor-pointer"
                style={{
                  padding: "15px 32px",
                  borderRadius: 12,
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#f5d98a",
                  background:
                    "linear-gradient(160deg, rgba(36,94,74,0.95) 0%, rgba(18,54,38,0.98) 100%)",
                  border: "1px solid rgba(212,160,23,0.45)",
                  boxShadow:
                    "0 0 40px rgba(212,160,23,0.08), 0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,160,23,0.15)",
                }}
                whileHover={{
                  scale: 1.02,
                  boxShadow:
                    "0 0 50px rgba(212,160,23,0.18), 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,160,23,0.2)",
                  borderColor: "rgba(212,160,23,0.7)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                Entrar al vestíbulo
                <ArrowRight size={16} strokeWidth={2.5} />
              </motion.span>
            </Link>

            <Link href="/local">
              <motion.span
                className="flex items-center gap-2 cursor-pointer"
                style={{
                  padding: "15px 28px",
                  borderRadius: 12,
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#34d399",
                  background: "rgba(52,211,153,0.06)",
                  border: "1px solid rgba(52,211,153,0.22)",
                }}
                whileHover={{
                  color: "#6ee7b7",
                  borderColor: "rgba(52,211,153,0.45)",
                  background: "rgba(52,211,153,0.1)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <Bot size={15} strokeWidth={2} />
                Jugar vs CPU
              </motion.span>
            </Link>

            <a href="#guerreros">
              <motion.span
                className="flex items-center gap-2 cursor-pointer"
                style={{
                  padding: "15px 28px",
                  borderRadius: 12,
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#7a9080",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                whileHover={{
                  color: "#e8dcc4",
                  borderColor: "rgba(255,255,255,0.16)",
                  background: "rgba(255,255,255,0.06)",
                }}
                transition={{ duration: 0.15 }}
              >
                Ver guerreros
              </motion.span>
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown size={18} color="rgba(212,160,23,0.4)" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── ESTADÍSTICAS ───────────────────────────────────────────────────── */}
      <section
        style={{
          borderTop: "1px solid rgba(212,160,23,0.1)",
          borderBottom: "1px solid rgba(212,160,23,0.1)",
        }}
      >
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-px"
            style={{ background: "rgba(212,160,23,0.08)" }}
          >
            {estadisticas.map((stat, i) => {
              const Icono = stat.icono;
              return (
                <EntradaAlVer key={i} delay={i * 0.08}>
                  <div
                    className="flex flex-col items-center justify-center text-center py-10 px-6"
                    style={{ background: "#050e09" }}
                  >
                    <Icono
                      size={18}
                      color="rgba(212,160,23,0.5)"
                      strokeWidth={1.5}
                      style={{ marginBottom: 12 }}
                    />
                    <div
                      style={{
                        fontFamily: "'Cinzel Decorative', Georgia, serif",
                        fontSize: "clamp(2rem, 4vw, 2.8rem)",
                        fontWeight: 900,
                        color: "#f5d98a",
                        lineHeight: 1,
                        textShadow: "0 0 30px rgba(212,160,23,0.2)",
                      }}
                    >
                      {stat.valor}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "#4a6050",
                      }}
                    >
                      {stat.etiqueta}
                    </div>
                  </div>
                </EntradaAlVer>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── GUERREROS ──────────────────────────────────────────────────────── */}
      <section id="guerreros" className="px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <EntradaAlVer>
            <div className="text-center mb-16">
              <EtiquetaSeccion texto="Los combatientes" />
              <h2
                style={{
                  fontFamily: "'Cinzel Decorative', Georgia, serif",
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  color: "#f5d98a",
                  textShadow: "0 0 40px rgba(212,160,23,0.15)",
                  marginBottom: 16,
                }}
              >
                Guerreros
              </h2>
              <p
                style={{
                  color: "#5a6b62",
                  fontSize: 15,
                  maxWidth: 480,
                  margin: "0 auto",
                }}
              >
                Cada tipo tiene su ventaja, su arma y un poder único. La
                combinación que llegues en la mano define tu estrategia.
              </p>
            </div>
          </EntradaAlVer>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {guerreros.map((g, i) => {
              const Icono = g.icono;
              return (
                <EntradaAlVer key={g.nombre} delay={i * 0.08}>
                  <motion.div
                    className="h-full flex flex-col p-6 rounded-2xl relative overflow-hidden"
                    style={{
                      background: g.fondo,
                      border: `1px solid ${g.borde}`,
                      backdropFilter: "blur(10px)",
                    }}
                    whileHover={{ y: -6, borderColor: g.acento + "55" }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "15%",
                        right: "15%",
                        height: 1,
                        background: `linear-gradient(90deg, transparent, ${g.acento}60, transparent)`,
                      }}
                    />

                    <div className="flex items-center gap-3 mb-4">
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: `${g.acento}15`,
                          border: `1px solid ${g.acento}30`,
                          flexShrink: 0,
                        }}
                      >
                        <Icono size={18} color={g.acento} strokeWidth={1.5} />
                      </div>
                      <div>
                        <div
                          style={{
                            fontFamily: "'Cinzel Decorative', Georgia, serif",
                            fontSize: 15,
                            fontWeight: 700,
                            color: g.acento,
                          }}
                        >
                          {g.nombre}
                        </div>
                        <div
                          style={{ fontSize: 11, color: "#3a5040", marginTop: 1 }}
                        >
                          Arma: {g.arma}
                        </div>
                      </div>
                    </div>

                    <p
                      className="flex-1"
                      style={{ fontSize: 13, lineHeight: 1.7, color: "#7a9080" }}
                    >
                      {g.descripcion}
                    </p>

                    <LineaDorada className="my-4" />

                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.25em",
                          textTransform: "uppercase",
                          color: g.acento,
                          marginBottom: 4,
                          opacity: 0.8,
                        }}
                      >
                        Poder · {g.poder}
                      </div>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#5a6b62",
                          lineHeight: 1.6,
                        }}
                      >
                        {g.descripcionPoder}
                      </p>
                    </div>

                    <div
                      className="mt-4 px-3 py-1.5 rounded-lg text-center"
                      style={{
                        background: `${g.acento}0d`,
                        border: `1px solid ${g.acento}20`,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: g.acento,
                        opacity: 0.75,
                      }}
                    >
                      {g.ventaja}
                    </div>
                  </motion.div>
                </EntradaAlVer>
              );
            })}
          </div>

          {/* Triángulo de ventajas */}
          <EntradaAlVer delay={0.2}>
            <div
              className="mt-10 p-8 rounded-2xl text-center"
              style={{
                background: "rgba(13,35,24,0.6)",
                border: "1px solid rgba(212,160,23,0.12)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "rgba(212,160,23,0.6)",
                  marginBottom: 16,
                }}
              >
                Triángulo de ventajas
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                {[
                  { label: "Arquero", color: "#34d399" },
                  { sep: "vence a" },
                  { label: "Mago", color: "#818cf8" },
                  { sep: "vence a" },
                  { label: "Caballero", color: "#fb923c" },
                  { sep: "vence a" },
                  { label: "Arquero", color: "#34d399" },
                ].map((item, i) =>
                  "sep" in item ? (
                    <span
                      key={i}
                      style={{
                        fontSize: 12,
                        color: "#2a3a30",
                        fontWeight: 600,
                      }}
                    >
                      {item.sep}
                    </span>
                  ) : (
                    <span
                      key={i}
                      style={{
                        fontFamily: "'Cinzel', Georgia, serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: item.color,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {item.label}
                    </span>
                  )
                )}
              </div>
            </div>
          </EntradaAlVer>
        </div>
      </section>

      {/* ── MECÁNICAS ──────────────────────────────────────────────────────── */}
      <section
        className="px-6 py-28"
        style={{
          background: "rgba(13,35,24,0.25)",
          borderTop: "1px solid rgba(212,160,23,0.08)",
        }}
      >
        <div className="mx-auto max-w-5xl">
          <EntradaAlVer>
            <div className="text-center mb-16">
              <EtiquetaSeccion texto="Mecánicas" />
              <h2
                style={{
                  fontFamily: "'Cinzel Decorative', Georgia, serif",
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  color: "#f5d98a",
                  textShadow: "0 0 40px rgba(212,160,23,0.15)",
                }}
              >
                El sistema de juego
              </h2>
            </div>
          </EntradaAlVer>

          <div className="grid sm:grid-cols-2 gap-5">
            {mecanicas.map((m, i) => {
              const Icono = m.icono;
              return (
                <EntradaAlVer key={i} delay={i * 0.08}>
                  <motion.div
                    className="p-6 rounded-2xl flex gap-5"
                    style={{
                      background: "rgba(10,26,19,0.7)",
                      border: "1px solid rgba(212,160,23,0.1)",
                    }}
                    whileHover={{ borderColor: "rgba(212,160,23,0.28)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `${m.acento}12`,
                        border: `1px solid ${m.acento}25`,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      <Icono size={20} color={m.acento} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3
                        style={{
                          fontFamily: "'Cinzel', Georgia, serif",
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#f5d98a",
                          marginBottom: 8,
                        }}
                      >
                        {m.titulo}
                      </h3>
                      <p
                        style={{
                          fontSize: 13,
                          lineHeight: 1.75,
                          color: "#5a6b62",
                        }}
                      >
                        {m.descripcion}
                      </p>
                    </div>
                  </motion.div>
                </EntradaAlVer>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ESTRUCTURA DEL TURNO ───────────────────────────────────────────── */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-4xl">
          <EntradaAlVer>
            <div className="text-center mb-16">
              <EtiquetaSeccion texto="Estructura del turno" />
              <h2
                style={{
                  fontFamily: "'Cinzel Decorative', Georgia, serif",
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  color: "#f5d98a",
                  textShadow: "0 0 40px rgba(212,160,23,0.15)",
                }}
              >
                5 acciones, infinitas decisiones
              </h2>
            </div>
          </EntradaAlVer>

          <div className="relative">
            <div
              className="absolute hidden md:block"
              style={{
                left: 19,
                top: 24,
                bottom: 24,
                width: 1,
                background:
                  "linear-gradient(180deg, transparent, rgba(212,160,23,0.2), transparent)",
              }}
            />
            <div className="grid gap-4">
              {[
                { num: "01", titulo: "Tomar", desc: "Robá una carta del mazo de reserva central.", color: "#818cf8" },
                { num: "02", titulo: "Atacar / Usar poder", desc: "Declarás Ataque Puro o Impuro, o activás el poder de un guerrero.", color: "#fb923c" },
                { num: "03", titulo: "Jugar carta", desc: "Bajás un guerrero o arma al campo, o descartás.", color: "#34d399" },
                { num: "04", titulo: "Comerciar", desc: "Usás Oro para obtener cartas o hacés un trueque.", color: "#fbbf24" },
                { num: "05", titulo: "Construir", desc: "Colocás Oro en tu Castillo. Llegás a 25 y ganás.", color: "#f472b6" },
              ].map((paso, i) => (
                <EntradaAlVer key={i} delay={i * 0.07}>
                  <motion.div
                    className="flex gap-5 p-5 rounded-2xl md:ml-10"
                    style={{
                      background: "rgba(10,26,19,0.6)",
                      border: "1px solid rgba(212,160,23,0.08)",
                    }}
                    whileHover={{
                      borderColor: "rgba(212,160,23,0.22)",
                      x: 4,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `${paso.color}12`,
                        border: `1px solid ${paso.color}25`,
                        flexShrink: 0,
                        fontFamily: "'Cinzel', Georgia, serif",
                        fontSize: 11,
                        fontWeight: 700,
                        color: paso.color,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {paso.num}
                    </div>
                    <div className="flex items-center gap-4 min-w-0 flex-wrap">
                      <span
                        style={{
                          fontFamily: "'Cinzel', Georgia, serif",
                          fontWeight: 700,
                          fontSize: 14,
                          color: "#e8dcc4",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {paso.titulo}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: "#4a6050",
                          lineHeight: 1.5,
                        }}
                      >
                        {paso.desc}
                      </span>
                    </div>
                  </motion.div>
                </EntradaAlVer>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────────────── */}
      <section
        className="px-6 py-32 text-center relative overflow-hidden"
        style={{ borderTop: "1px solid rgba(212,160,23,0.08)" }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 700,
            height: 400,
            background:
              "radial-gradient(ellipse, rgba(212,160,23,0.05) 0%, transparent 65%)",
            filter: "blur(30px)",
            pointerEvents: "none",
          }}
        />
        <div className="relative max-w-2xl mx-auto">
          <EntradaAlVer>
            <EtiquetaSeccion texto="Comenzá ahora" />
            <h2
              style={{
                fontFamily: "'Cinzel Decorative', Georgia, serif",
                fontSize: "clamp(2rem, 5vw, 4rem)",
                fontWeight: 900,
                color: "#f5d98a",
                textShadow: "0 0 60px rgba(212,160,23,0.15)",
                lineHeight: 1.15,
                marginBottom: 20,
              }}
            >
              Listo para la batalla
            </h2>
            <p
              style={{
                color: "#5a6b62",
                fontSize: 16,
                lineHeight: 1.8,
                marginBottom: 36,
                fontFamily: "'Cinzel', Georgia, serif",
              }}
            >
              Creá una sala, invitá a tus rivales y comenzá una partida en segundos.
            </p>

            <Link href="/vestibulo">
              <motion.span
                className="inline-flex items-center gap-3 cursor-pointer"
                style={{
                  padding: "18px 40px",
                  borderRadius: 14,
                  fontFamily: "'Cinzel Decorative', Georgia, serif",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#f5d98a",
                  background:
                    "linear-gradient(160deg, rgba(36,94,74,0.95) 0%, rgba(18,54,38,0.98) 100%)",
                  border: "1px solid rgba(212,160,23,0.45)",
                  boxShadow:
                    "0 0 60px rgba(212,160,23,0.1), 0 8px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,160,23,0.2)",
                }}
                whileHover={{
                  scale: 1.03,
                  boxShadow:
                    "0 0 80px rgba(212,160,23,0.2), 0 8px 34px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,160,23,0.25)",
                  borderColor: "rgba(212,160,23,0.7)",
                }}
                whileTap={{ scale: 0.98 }}
              >
                Entrar al vestíbulo
                <ArrowRight size={18} strokeWidth={2} />
              </motion.span>
            </Link>

            <Link href="/local" style={{ marginTop: 16, display: "inline-block" }}>
              <motion.span
                className="inline-flex items-center gap-2 cursor-pointer"
                style={{
                  padding: "13px 28px",
                  borderRadius: 12,
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#34d399",
                  background: "rgba(52,211,153,0.06)",
                  border: "1px solid rgba(52,211,153,0.2)",
                }}
                whileHover={{ borderColor: "rgba(52,211,153,0.4)", background: "rgba(52,211,153,0.1)" }}
                whileTap={{ scale: 0.97 }}
              >
                <Bot size={14} />
                Practicar vs CPU
              </motion.span>
            </Link>
          </EntradaAlVer>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer
        className="px-8 py-8 flex items-center justify-between flex-wrap gap-4"
        style={{ borderTop: "1px solid rgba(212,160,23,0.07)" }}
      >
        <span
          style={{
            fontFamily: "'Cinzel Decorative', Georgia, serif",
            fontSize: 12,
            color: "#2a3a30",
            letterSpacing: "0.06em",
          }}
        >
          La Campaña
        </span>
        <span
          style={{
            fontSize: 11,
            color: "#2a3a30",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Juego de mesa argentino — versión online
        </span>
      </footer>
    </div>
  );
}
