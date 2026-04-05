import type { EquipoId, ModoJuego, NombreEspecial, TipoArma, TipoGuerrero } from "./tipos";

export const VIDA_GUERRERO = 10;
export const VIDA_ESCUDO = 5;
export const MAXIMO_GUERREROS_CAMPO = 5;
export const MAXIMO_CARTAS_MANO = 7;
export const RECURSOS_INICIALES = 4;
export const GUERREROS_INICIALES = 3;
export const MINIMO_JUGADORES = 2;
export const MAXIMO_JUGADORES = 5;
export const JUGADORES_ALIANZA = 4;

export const ORO_CASTILLO_INDIVIDUAL = 25;
export const ORO_CASTILLO_ALIANZAS = 30;

export const BATALLAS_OBJETIVO_INDIVIDUAL: Record<number, number> = {
  2: 2,
  3: 2,
  4: 1,
  5: 1,
};

export const BATALLAS_OBJETIVO_ALIANZAS = 4;

export const VIDA_POR_GUERRERO: Record<TipoGuerrero, number> = {
  Mago: VIDA_GUERRERO,
  Caballero: VIDA_GUERRERO,
  Arquero: VIDA_GUERRERO,
  Dragon: VIDA_GUERRERO,
};

export const COMPATIBILIDAD_ARMA: Record<TipoArma, Exclude<TipoGuerrero, "Dragon">> = {
  Pocion: "Mago",
  Espada: "Caballero",
  Flecha: "Arquero",
};

export const VENTAJAS: Record<Exclude<TipoGuerrero, "Dragon">, Exclude<TipoGuerrero, "Dragon">> = {
  Mago: "Caballero",
  Caballero: "Arquero",
  Arquero: "Mago",
};

export const PLANTILLAS_GUERREROS: Array<{ guerrero: Exclude<TipoGuerrero, "Dragon">; cantidad: number }> = [
  { guerrero: "Mago", cantidad: 5 },
  { guerrero: "Caballero", cantidad: 5 },
  { guerrero: "Arquero", cantidad: 5 },
];

export const PLANTILLAS_ARMAS: Array<{ arma: TipoArma; valor: number; cantidad: number }> = [
  ...Array.from({ length: 9 }, (_, index) => ({ arma: "Pocion" as const, valor: index + 1, cantidad: 1 })),
  ...Array.from({ length: 9 }, (_, index) => ({ arma: "Espada" as const, valor: index + 1, cantidad: 1 })),
  ...Array.from({ length: 9 }, (_, index) => ({ arma: "Flecha" as const, valor: index + 1, cantidad: 1 })),
];

export const VALORES_ORO = [1, 2, 3, 4, 5, 5, 6, 7, 7, 8, 9];

export const ESPECIALES: Array<{ especial: NombreEspecial; cantidad: number }> = [
  { especial: "Poder", cantidad: 3 },
  { especial: "Dragon", cantidad: 1 },
  { especial: "Asedio", cantidad: 1 },
  { especial: "Ladron", cantidad: 1 },
  { especial: "Espia", cantidad: 1 },
];

export const EQUIPOS_ALIANZA: EquipoId[] = ["A", "B"];

export const FASES_TURNO = [
  "TURN_DRAW",
  "TURN_ATTACK",
  "TURN_SABOTAGE",
  "TURN_TRADE",
  "TURN_BUILD",
  "TURN_END_CHECKS",
] as const;

export function objetivoCastilloPorModo(modo: ModoJuego): number {
  return modo === "alianzas" ? ORO_CASTILLO_ALIANZAS : ORO_CASTILLO_INDIVIDUAL;
}

export function objetivoBatallas(modo: ModoJuego, jugadores: number): number {
  return modo === "alianzas" ? BATALLAS_OBJETIVO_ALIANZAS : BATALLAS_OBJETIVO_INDIVIDUAL[jugadores];
}
