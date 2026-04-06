"use client";

import { motion } from "framer-motion";
import type { Carta, UnitInPlay } from "../../motor/tipos";

type CardLike = Carta | UnitInPlay;

interface CardProps {
  carta: CardLike;
  selected?: boolean;
  disabled?: boolean;
  interactionHint?: string | null;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

function isUnit(card: CardLike): card is UnitInPlay {
  return "instanceId" in card;
}

function titleFor(card: CardLike): string {
  if (isUnit(card)) {
    return card.guerrero;
  }
  if (card.tipo === "guerrero") {
    return card.guerrero;
  }
  if (card.tipo === "arma") {
    return `${card.arma} ${card.valor}`;
  }
  if (card.tipo === "oro") {
    return `Oro ${card.valor}`;
  }
  return card.especial;
}

function subtitleFor(card: CardLike): string {
  if (isUnit(card)) {
    return `Vida ${card.vida.toFixed(1)} / ${card.vidaMaxima.toFixed(1)}`;
  }
  switch (card.tipo) {
    case "guerrero":
      return "Guerrero";
    case "arma":
      return "Arma";
    case "oro":
      return "Castillo / compra";
    case "especial":
      return "Especial";
    default:
      return "";
  }
}

function secondaryTextFor(card: CardLike): string | null {
  if (isUnit(card)) {
    if (card.shield) {
      return `Escudo ${card.shield.remaining}/5`;
    }
    if (card.damageMarks.length > 0) {
      return `Daño acumulado ${card.damageTaken}`;
    }
    return "Lista para combatir";
  }
  switch (card.tipo) {
    case "guerrero":
      return "Despliegue y refuerzo";
    case "arma":
      return "Equipala sobre una unidad";
    case "oro":
      return "Usala para comprar o construir";
    case "especial":
      return "Accion especial";
    default:
      return null;
  }
}

function toneFor(card: CardLike): { accent: string; wash: string } {
  const key = isUnit(card) ? card.guerrero : card.tipo === "guerrero" ? card.guerrero : card.tipo;
  switch (key) {
    case "Mago":
      return { accent: "#6f7f6d", wash: "rgba(111,127,109,0.18)" };
    case "Caballero":
      return { accent: "#a97858", wash: "rgba(169,120,88,0.16)" };
    case "Arquero":
      return { accent: "#7b6da5", wash: "rgba(123,109,165,0.16)" };
    case "Dragon":
      return { accent: "#d4a017", wash: "rgba(212,160,23,0.16)" };
    case "arma":
      return { accent: "#5f7169", wash: "rgba(95,113,105,0.16)" };
    case "oro":
      return { accent: "#9a8759", wash: "rgba(154,135,89,0.18)" };
    default:
      return { accent: "#8b6f8f", wash: "rgba(139,111,143,0.16)" };
  }
}

export default function CartaComponente({
  carta,
  selected = false,
  disabled = false,
  interactionHint = null,
  onClick,
  draggable = false,
  onDragStart,
  onDragEnd,
}: CardProps) {
  const tone = toneFor(carta);
  const typeLabel = isUnit(carta) ? "unidad" : carta.tipo;
  const secondaryText = secondaryTextFor(carta);
  const statusLabel = interactionHint ?? (draggable ? "Mover" : selected ? "Lista" : null);

  return (
    <motion.button
      type="button"
      onClick={disabled ? undefined : onClick}
      draggable={draggable && !disabled}
      onDragStart={draggable && !disabled ? onDragStart : undefined}
      onDragEnd={draggable && !disabled ? onDragEnd : undefined}
      whileHover={disabled ? undefined : { y: -2 }}
      className="relative flex min-h-[188px] w-[120px] flex-col overflow-hidden rounded-[18px] border p-2 text-left shadow-lg transition"
      style={{
        background: "linear-gradient(180deg, rgba(237,228,211,0.98), rgba(219,204,178,0.96))",
        borderColor: selected ? "#f0d28a" : `${tone.accent}66`,
        color: "#3d3123",
        opacity: disabled ? 0.55 : 1,
        boxShadow: selected
          ? "0 0 0 1px rgba(240,210,138,0.9), 0 16px 30px rgba(0,0,0,0.28)"
          : "0 14px 26px rgba(0,0,0,0.2)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[6px] rounded-[16px] border"
        style={{ borderColor: `${tone.accent}55` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[12px] rounded-[12px] border"
        style={{ borderColor: `${tone.accent}33` }}
      />
      <div className="relative mb-1.5 flex items-start justify-between gap-1.5">
        <div className="text-[9px] uppercase tracking-[0.1em]" style={{ color: tone.accent }}>
          {typeLabel}
        </div>
        {statusLabel ? (
          <div
            className="rounded-full border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em]"
            style={{
              color: selected ? "#6a4b13" : tone.accent,
              borderColor: selected ? "rgba(240,210,138,0.5)" : `${tone.accent}44`,
              background: selected ? "rgba(240,210,138,0.24)" : "rgba(255,255,255,0.28)",
            }}
          >
            {statusLabel}
          </div>
        ) : null}
      </div>
      <div
        className="relative mb-1.5 flex min-h-[84px] items-center justify-center rounded-[14px] border px-2.5 py-3 text-center text-[13px] font-semibold"
        style={{
          borderColor: `${tone.accent}66`,
          background: `linear-gradient(180deg, rgba(255,250,240,0.54), ${tone.wash})`,
          color: tone.accent,
          fontFamily: "'Cinzel Decorative', Georgia, serif",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-2 h-4 w-4 -translate-x-1/2 rounded-full border"
          style={{ borderColor: `${tone.accent}88`, background: "rgba(255,255,255,0.4)" }}
        />
        <div
          aria-hidden="true"
          className="absolute bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border"
          style={{ borderColor: `${tone.accent}88`, background: "rgba(255,255,255,0.28)" }}
        />
        {titleFor(carta)}
      </div>
      <div className="relative text-[9px] uppercase tracking-[0.05em]" style={{ color: tone.accent }}>
        {subtitleFor(carta)}
      </div>
      {secondaryText ? (
        <div className="relative mt-1 text-[9px] leading-4" style={{ color: "#655749" }}>
          {secondaryText}
        </div>
      ) : null}
    </motion.button>
  );
}
