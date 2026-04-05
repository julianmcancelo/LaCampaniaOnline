/**
 * animaciones.ts — Variantes de Framer Motion compartidas en toda la aplicación.
 * Todas las animaciones siguen la estética de La Campaña: dramáticas y medievales.
 */

import type { Variants } from "framer-motion";

/** Animación de entrada de carta (como si viniera del mazo) */
export const variantesCartaEntrada: Variants = {
  inicial: {
    x: 300,
    y: -200,
    opacity: 0,
    rotateY: 180,
    scale: 0.5,
  },
  animado: {
    x: 0,
    y: 0,
    opacity: 1,
    rotateY: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      duration: 0.6,
    },
  },
  salida: {
    x: -300,
    y: 200,
    opacity: 0,
    scale: 0.5,
    transition: { duration: 0.3 },
  },
};

/** Animación de hover sobre carta (levita con brillo dorado) */
export const variantesCartaHover: Variants = {
  reposo: {
    y: 0,
    scale: 1,
    zIndex: 1,
    boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
    transition: { duration: 0.15 },
  },
  hover: {
    y: -24,
    scale: 1.1,
    zIndex: 50,
    boxShadow: "0 8px 32px rgba(0,0,0,0.8), 0 0 12px rgba(212,160,23,0.4)",
    transition: { duration: 0.15 },
  },
};

/** Animación de carta seleccionada (borde dorado pulsante) */
export const variantesCartaSeleccionada: Variants = {
  noSeleccionada: {
    y: 0,
    boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
  },
  seleccionada: {
    y: -12,
    boxShadow: "0 0 0 3px #d4a017, 0 8px 32px rgba(0,0,0,0.8)",
    transition: {
      boxShadow: {
        repeat: Infinity,
        repeatType: "reverse",
        duration: 1,
      },
    },
  },
};

/** Animación de sacudida de ataque */
export const variantesSacudidaAtaque: Variants = {
  reposo: { x: 0 },
  atacando: {
    x: [0, -8, 8, -8, 8, -4, 4, 0],
    transition: { duration: 0.4, ease: "easeInOut" },
  },
};

/** Animación de daño recibido (parpadeo rojo) */
export const variantesDanio: Variants = {
  reposo: { backgroundColor: "transparent", scale: 1 },
  danado: {
    backgroundColor: ["transparent", "rgba(192,57,43,0.6)", "transparent"],
    scale: [1, 1.05, 1],
    transition: { duration: 0.5 },
  },
};

/** Animación de aparecer/desaparecer para modales y overlays */
export const variantesModal: Variants = {
  oculto: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  salida: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: { duration: 0.2 },
  },
};

/** Animación de overlay de fondo oscuro */
export const variantesOverlay: Variants = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  salida: { opacity: 0, transition: { duration: 0.2 } },
};

/** Animación de victoria épica */
export const variantesVictoria: Variants = {
  oculto: {
    opacity: 0,
    scale: 0.5,
    rotateZ: -10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotateZ: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
      delay: 0.2,
    },
  },
};

/** Animación de lista — cada elemento entra con retraso escalonado */
export const variantesLista: Variants = {
  oculto: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

/** Elemento de lista individual */
export const variantesItemLista: Variants = {
  oculto: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300 },
  },
};
