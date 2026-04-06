import type { Carta } from "../motor/tipos";

export const GAME_BRAND = "Sangre y Plata";
export const GAME_TAGLINE = "Fantasia gaucha, fortines y supersticion en la frontera.";
export const CASTLE_LABEL = "Fortin";
export const GOLD_LABEL = "Plata";
export const RELIC_LABEL = "Poncho de leyenda";

const warriorNames: Record<string, string> = {
  Mago: "Curandero",
  Caballero: "Gaucho",
  Arquero: "Rastrero",
  Dragon: "Lobizon",
};

const weaponNames: Record<string, string> = {
  Espada: "Facon",
  Flecha: "Boleadoras",
  Pocion: "Gualicho",
};

const specialNames: Record<string, string> = {
  Poder: "Coraje",
  Asedio: "Malon",
  Ladron: "Cuatrero",
  Espia: "Baqueano",
  Dragon: "Lobizon",
};

export function loreGameDescription() {
  return `${GAME_BRAND}: estrategia de cartas en una frontera criolla, entre fortines, plata, malones y criaturas de la noche.`;
}

export function displayWarriorName(name: string) {
  return warriorNames[name] ?? name;
}

export function displayWeaponName(name: string) {
  return weaponNames[name] ?? name;
}

export function displaySpecialName(name: string) {
  return specialNames[name] ?? name;
}

export function displayCardTitle(card: Carta) {
  if (card.tipo === "guerrero") {
    return displayWarriorName(card.guerrero);
  }
  if (card.tipo === "arma") {
    return `${displayWeaponName(card.arma)} ${card.valor}`;
  }
  if (card.tipo === "oro") {
    return `${GOLD_LABEL} ${card.valor}`;
  }
  return displaySpecialName(card.especial);
}

export function displayCardSubtitle(card: Carta) {
  if (card.tipo === "arma") {
    return `${displayWeaponName(card.arma)} ${card.valor}`;
  }
  if (card.tipo === "oro") {
    return `${GOLD_LABEL} ${card.valor}`;
  }
  if (card.tipo === "especial") {
    return "Especial";
  }
  return "Combatiente";
}

export function displayCardType(card: Carta | { tipo: string }) {
  switch (card.tipo) {
    case "guerrero":
      return "combatiente";
    case "arma":
      return "arma";
    case "oro":
      return GOLD_LABEL.toLowerCase();
    case "especial":
      return "especial";
    default:
      return card.tipo;
  }
}
