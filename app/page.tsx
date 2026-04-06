"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  Crown,
  Flame,
  Shield,
  Swords,
  Users,
} from "lucide-react";
import { GAME_BRAND, GAME_TAGLINE, loreGameDescription } from "../lib/lore";

const cifras = [
  { valor: "1v1", etiqueta: "Duelo vivo" },
  { valor: "77", etiqueta: "Cartas de frontera" },
  { valor: "25", etiqueta: "Plata para alzar el fortin" },
];

const principios = [
  {
    titulo: "Rueda de combate",
    texto:
      "Gauchos, Rastreros y Curanderos se cruzan en una rueda de ventajas que define cada ronda.",
    icono: Swords,
  },
  {
    titulo: "Fortin o barrida",
    texto:
      "Ganás por superioridad en la mesa o levantando tu fortin antes que el rival.",
    icono: Shield,
  },
  {
    titulo: "Duelo con leyenda",
    texto:
      "Entre malones, baqueanos, cuatreros y lobizones, cada mano puede doblar el destino del campo.",
    icono: Flame,
  },
];

const modos = [
  {
    titulo: "Partida local",
    texto:
      "Probá la rueda táctica contra CPU y dominá las fases antes de entrar al duelo online.",
  },
  {
    titulo: "Sala privada",
    texto:
      "Creá una mesa, invitá por enlace o QR y hacé entrar a otro paisano directo a la sala.",
  },
  {
    titulo: "Progresion viva",
    texto:
      "Google, perfil, foto, puntaje y ranking para que cada victoria deje huella.",
  },
];

function SectionReveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function PaginaInicio() {
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const logoY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <main style={{ background: "#080f0c", color: "#f3dfbb" }}>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          background: "linear-gradient(180deg, rgba(8,15,12,0.86), rgba(8,15,12,0.44))",
          borderBottom: "1px solid rgba(198,139,71,0.16)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-gaucho-puro.png"
              alt={GAME_BRAND}
              width={44}
              height={44}
              priority
              style={{
                borderRadius: 999,
                boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              }}
            />
            <div>
              <p
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.28em",
                  color: "#d8a14a",
                  marginBottom: 2,
                }}
              >
                Frontera argentina
              </p>
              <p
                style={{
                  fontFamily: "'Cinzel Decorative', Georgia, serif",
                  fontSize: 18,
                  color: "#f4d8a2",
                }}
              >
                {GAME_BRAND}
              </p>
            </div>
          </div>

          <Link
            href="/vestibulo"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em]"
            style={{
              color: "#1d1408",
              background: "linear-gradient(135deg, #f2be63, #c77b2f)",
              boxShadow: "0 12px 40px rgba(199,123,47,0.28)",
            }}
          >
            Entrar
            <ArrowRight size={15} />
          </Link>
        </div>
      </motion.header>

      <section
        ref={heroRef}
        className="relative flex min-h-screen items-center overflow-hidden px-5 pb-16 pt-28 sm:px-8"
        style={{
          background:
            "radial-gradient(circle at 50% 32%, rgba(199,123,47,0.28), transparent 28%), linear-gradient(180deg, #16110d 0%, #101915 28%, #08100c 100%)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,8,6,0.28), rgba(8,15,12,0.12) 40%, rgba(8,15,12,0.88) 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(230,179,94,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(230,179,94,0.08) 1px, transparent 1px)",
            backgroundSize: "88px 88px",
            maskImage:
              "radial-gradient(circle at 50% 40%, rgba(0,0,0,1), rgba(0,0,0,0.15) 72%, transparent 100%)",
          }}
        />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
          <motion.div style={{ opacity: heroOpacity, y: textY }}>
            <p
              style={{
                marginBottom: 14,
                color: "#d8a14a",
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.34em",
                fontWeight: 700,
              }}
            >
              Juego táctico de frontera
            </p>

            <h1
              style={{
                fontFamily: "'Cinzel Decorative', Georgia, serif",
                fontSize: "clamp(3.5rem, 9vw, 7rem)",
                lineHeight: 0.92,
                color: "#f8ddb0",
                maxWidth: "8.4ch",
                textShadow: "0 12px 40px rgba(0,0,0,0.45)",
              }}
            >
              {GAME_BRAND}
            </h1>

            <p
              style={{
                maxWidth: 620,
                marginTop: 24,
                fontSize: "clamp(1rem, 1.8vw, 1.16rem)",
                lineHeight: 1.8,
                color: "#ccb690",
              }}
            >
              {GAME_TAGLINE} Armá tu rueda, defendé el fortín y metete en duelos
              online donde la Plata, el barro y la astucia pesan más que la suerte.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/vestibulo"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em]"
                style={{
                  background: "linear-gradient(135deg, #efb85b, #c46d2b)",
                  color: "#1b1208",
                  boxShadow: "0 16px 44px rgba(196,109,43,0.3)",
                }}
              >
                Jugar ahora
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/local"
                className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em]"
                style={{
                  color: "#f0d4a3",
                  border: "1px solid rgba(217,161,74,0.28)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                Probar mesa local
              </Link>
            </div>

            <div className="mt-10 grid gap-5 border-t border-[#7a5630]/40 pt-7 sm:grid-cols-3">
              {cifras.map((item) => (
                <div key={item.etiqueta}>
                  <p
                    style={{
                      fontSize: 32,
                      lineHeight: 1,
                      color: "#f7d18f",
                      fontFamily: "'Cinzel', Georgia, serif",
                    }}
                  >
                    {item.valor}
                  </p>
                  <p
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "#947651",
                    }}
                  >
                    {item.etiqueta}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative mx-auto w-full max-w-[560px]"
            style={{ y: logoY, opacity: heroOpacity }}
          >
            <div
              className="absolute inset-0 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(228,145,54,0.36), rgba(0,0,0,0) 64%)",
                transform: "scale(0.92)",
              }}
            />

            <div
              className="relative overflow-hidden rounded-[36px] p-5 sm:p-8"
              style={{
                background:
                  "linear-gradient(180deg, rgba(32,22,17,0.9), rgba(13,18,15,0.94))",
                border: "1px solid rgba(198,139,71,0.18)",
                boxShadow:
                  "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background:
                    "radial-gradient(circle at 50% 20%, rgba(255,197,102,0.36), transparent 35%), linear-gradient(180deg, transparent, rgba(0,0,0,0.4))",
                }}
              />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <span
                    style={{
                      color: "#d9a14a",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.28em",
                      fontWeight: 700,
                    }}
                  >
                    Sello del juego
                  </span>
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1"
                    style={{
                      border: "1px solid rgba(217,161,74,0.18)",
                      color: "#e8cf9d",
                      background: "rgba(255,255,255,0.03)",
                      fontSize: 12,
                    }}
                  >
                    <Crown size={14} />
                    Frontera abierta
                  </span>
                </div>

                <Image
                  src="/logo-gaucho-puro.png"
                  alt={GAME_BRAND}
                  width={700}
                  height={700}
                  priority
                  className="mx-auto w-full max-w-[460px]"
                  style={{
                    borderRadius: 999,
                    boxShadow: "0 26px 70px rgba(0,0,0,0.45)",
                  }}
                />

                <p
                  className="mx-auto mt-5 max-w-[28rem] text-center"
                  style={{
                    color: "#c5ae84",
                    fontSize: 15,
                    lineHeight: 1.75,
                  }}
                >
                  Un duelo criollo entre mate, facón, baqueanos y fortines. La
                  marca ahora late con la misma atmósfera del tablero.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8">
        <SectionReveal>
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              <p
                style={{
                  color: "#cf9645",
                  fontSize: 12,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginBottom: 14,
                }}
              >
                Lo que se juega
              </p>
              <h2
                style={{
                  fontFamily: "'Cinzel Decorative', Georgia, serif",
                  fontSize: "clamp(2.1rem, 4vw, 4rem)",
                  lineHeight: 1.02,
                  color: "#f2d6a4",
                }}
              >
                Un duelo de campo, no un fantasy importado.
              </h2>
            </div>

            <div className="grid gap-10 lg:grid-cols-3">
              {principios.map((item, index) => {
                const Icon = item.icono;
                return (
                  <SectionReveal key={item.titulo} delay={0.08 * index}>
                    <div
                      className="h-full border-t pt-6"
                      style={{ borderColor: "rgba(197,126,58,0.32)" }}
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                          style={{
                            background: "rgba(196,109,43,0.14)",
                            color: "#ecb45f",
                            border: "1px solid rgba(196,109,43,0.28)",
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <h3
                          style={{
                            fontFamily: "'Cinzel', Georgia, serif",
                            fontSize: 24,
                            color: "#efd2a0",
                          }}
                        >
                          {item.titulo}
                        </h3>
                      </div>
                      <p
                        style={{
                          color: "#bca684",
                          lineHeight: 1.85,
                          fontSize: 16,
                          maxWidth: 360,
                        }}
                      >
                        {item.texto}
                      </p>
                    </div>
                  </SectionReveal>
                );
              })}
            </div>
          </div>
        </SectionReveal>
      </section>

      <section
        className="px-5 py-24 sm:px-8"
        style={{
          background:
            "linear-gradient(180deg, rgba(29,18,12,0.92), rgba(12,16,13,0.98))",
          borderTop: "1px solid rgba(196,109,43,0.16)",
          borderBottom: "1px solid rgba(196,109,43,0.16)",
        }}
      >
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionReveal>
            <div>
              <p
                style={{
                  color: "#cf9645",
                  fontSize: 12,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginBottom: 14,
                }}
              >
                Experiencia completa
              </p>
              <h2
                style={{
                  fontFamily: "'Cinzel Decorative', Georgia, serif",
                  fontSize: "clamp(2rem, 4vw, 3.7rem)",
                  lineHeight: 1.05,
                  color: "#f2d6a4",
                  maxWidth: 460,
                }}
              >
                Mesa online, sala privada y entrada por QR o enlace.
              </h2>
            </div>
          </SectionReveal>

          <div className="grid gap-8">
            {modos.map((modo, index) => (
              <SectionReveal key={modo.titulo} delay={0.08 * index}>
                <div className="grid gap-3 border-b pb-7" style={{ borderColor: "rgba(196,109,43,0.18)" }}>
                  <div className="flex items-center justify-between gap-4">
                    <h3
                      style={{
                        fontFamily: "'Cinzel', Georgia, serif",
                        fontSize: 24,
                        color: "#efd2a0",
                      }}
                    >
                      {modo.titulo}
                    </h3>
                    <Users size={18} color="#d39b48" />
                  </div>
                  <p
                    style={{
                      color: "#c7b08a",
                      lineHeight: 1.8,
                      fontSize: 16,
                      maxWidth: 620,
                    }}
                  >
                    {modo.texto}
                  </p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8">
        <SectionReveal>
          <div className="mx-auto max-w-5xl text-center">
            <Image
              src="/logo-gaucho-puro.png"
              alt={GAME_BRAND}
              width={110}
              height={110}
              className="mx-auto mb-6"
              style={{ borderRadius: 999 }}
            />
            <p
              style={{
                color: "#cf9645",
                fontSize: 12,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              {loreGameDescription()}
            </p>
            <h2
              style={{
                fontFamily: "'Cinzel Decorative', Georgia, serif",
                fontSize: "clamp(2.2rem, 4vw, 4rem)",
                lineHeight: 1.02,
                color: "#f4d9aa",
                maxWidth: 760,
                margin: "0 auto",
              }}
            >
              Entrá al fortín y jugá una partida que ya no se parece a ninguna otra.
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/vestibulo"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em]"
                style={{
                  background: "linear-gradient(135deg, #efb85b, #c46d2b)",
                  color: "#1b1208",
                  boxShadow: "0 16px 44px rgba(196,109,43,0.28)",
                }}
              >
                Abrir sala
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/local"
                className="inline-flex items-center rounded-full px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em]"
                style={{
                  color: "#f0d4a3",
                  border: "1px solid rgba(217,161,74,0.28)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                Probar local
              </Link>
            </div>
          </div>
        </SectionReveal>
      </section>
    </main>
  );
}
