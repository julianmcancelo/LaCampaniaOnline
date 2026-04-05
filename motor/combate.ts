import { VENTAJAS, VIDA_ESCUDO, VIDA_GUERRERO } from "./constantes";
import type { CartaArma, CartaEspecial, DamageMark, TipoArma, TipoDanio, TipoGuerrero, UnitInPlay } from "./tipos";

export function tieneVentaja(atacante: TipoGuerrero, defensor: TipoGuerrero): boolean {
  if (atacante === "Dragon" || defensor === "Dragon") {
    return false;
  }

  return VENTAJAS[atacante] === defensor;
}

export function calcularDanioPorArma(
  attackerType: TipoGuerrero,
  defenderType: TipoGuerrero,
  weapon: Pick<CartaArma, "valor" | "arma">
): { amount: number; kind: TipoDanio } {
  if (defenderType === "Dragon") {
    return { amount: weapon.valor / 2, kind: "impuro" };
  }

  if (attackerType === "Dragon") {
    const adoptedType =
      weapon.arma === "Pocion" ? "Mago" : weapon.arma === "Espada" ? "Caballero" : "Arquero";
    return tieneVentaja(adoptedType, defenderType as Exclude<TipoGuerrero, "Dragon">)
      ? { amount: weapon.valor, kind: "puro" }
      : { amount: weapon.valor / 2, kind: "impuro" };
  }

  return tieneVentaja(attackerType, defenderType)
    ? { amount: weapon.valor, kind: "puro" }
    : { amount: weapon.valor / 2, kind: "impuro" };
}

export function crearMarcaDeDanio(card: CartaArma | CartaEspecial, amount: number, kind: TipoDanio): DamageMark {
  return {
    cardId: card.id,
    cardName: card.nombre,
    amount,
    kind,
    sourceWeapon: card.tipo === "arma" ? card.arma : "Especial",
  };
}

export function aplicarDanioAUnidad(
  unit: UnitInPlay,
  damageMark: DamageMark,
  forceImpureOnShield = false
): { updated: UnitInPlay; eliminated: boolean; shieldBroken: boolean } {
  if (unit.shield) {
    const applied = forceImpureOnShield ? damageMark.amount : damageMark.amount;
    const shieldRemaining = Math.max(0, unit.shield.remaining - applied);
    return {
      updated: {
        ...unit,
        shield: shieldRemaining > 0 ? { ...unit.shield, remaining: shieldRemaining } : null,
      },
      eliminated: false,
      shieldBroken: shieldRemaining <= 0,
    };
  }

  const damageTaken = unit.damageTaken + damageMark.amount;
  const vida = Math.max(0, VIDA_GUERRERO - damageTaken);
  return {
    updated: {
      ...unit,
      damageTaken,
      vida,
      damageMarks: [...unit.damageMarks, damageMark],
    },
    eliminated: damageTaken >= VIDA_GUERRERO,
    shieldBroken: false,
  };
}

export function sanarUnidad(unit: UnitInPlay): UnitInPlay {
  if (unit.guerrero === "Dragon") {
    return unit;
  }

  return {
    ...unit,
    vida: VIDA_GUERRERO,
    damageTaken: 0,
    damageMarks: [],
  };
}

export function aplicarEscudo(unit: UnitInPlay, sourceCardId: string): UnitInPlay {
  if (unit.guerrero === "Dragon" || unit.shield) {
    return unit;
  }

  return {
    ...unit,
    shield: {
      cardId: sourceCardId,
      remaining: VIDA_ESCUDO,
    },
  };
}

export function resolverTiroCertero(unit: UnitInPlay): { updated: UnitInPlay; eliminated: boolean; shieldBroken: boolean } {
  if (unit.shield) {
    return {
      updated: { ...unit, shield: null },
      eliminated: false,
      shieldBroken: true,
    };
  }

  if (unit.guerrero === "Dragon") {
    return aplicarDanioAUnidad(
      unit,
      {
        cardId: "tiro-certero",
        cardName: "Tiro Certero",
        amount: 5,
        kind: "impuro",
        sourceWeapon: "Especial",
      },
      false
    );
  }

  return {
    updated: {
      ...unit,
      vida: 0,
      damageTaken: VIDA_GUERRERO,
      damageMarks: [
        ...unit.damageMarks,
        {
          cardId: "tiro-certero",
          cardName: "Tiro Certero",
          amount: VIDA_GUERRERO,
          kind: "puro",
          sourceWeapon: "Especial",
        },
      ],
    },
    eliminated: true,
    shieldBroken: false,
  };
}

export function armaCompatibleConUnidad(weapon: CartaArma, unit: UnitInPlay): boolean {
  if (unit.guerrero === "Dragon") {
    return true;
  }
  return weapon.compatibleCon === unit.guerrero;
}
