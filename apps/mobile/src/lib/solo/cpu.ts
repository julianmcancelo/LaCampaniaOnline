import type { BattleAction, Carta, CartaArma, MatchState, PlayerBattleState, UnitInPlay } from "../../../../../motor/tipos";
import type { DificultadCpu } from "./tipos";

function valorCarta(card: Carta): number {
  if (card.tipo === "arma" || card.tipo === "oro") {
    return card.valor;
  }
  if (card.tipo === "guerrero") {
    return 6;
  }
  switch (card.especial) {
    case "Poder":
      return 7;
    case "Asedio":
      return 8;
    case "Dragon":
      return 9;
    case "Espia":
      return 6;
    case "Ladron":
      return 5;
    default:
      return 4;
  }
}

function guerrerosEnMano(player: PlayerBattleState) {
  return player.hand.filter((card) => card.tipo === "guerrero" || (card.tipo === "especial" && card.especial === "Dragon"));
}

function armasEnMano(player: PlayerBattleState): CartaArma[] {
  return player.hand.filter((card): card is CartaArma => card.tipo === "arma");
}

function enemigosDe(match: MatchState, player: PlayerBattleState): PlayerBattleState[] {
  const battle = match.currentBattle!;
  return Object.values(battle.players).filter((candidate) => candidate.playerId !== player.playerId && !candidate.eliminated);
}

function elegirDespliegue(player: PlayerBattleState, dificultad: DificultadCpu): string[] {
  const limite = dificultad === "general" ? 3 : dificultad === "capitan" ? 2 : 1;
  return guerrerosEnMano(player).slice(0, limite).map((card) => card.id);
}

function elegirCartaParaDescartar(player: PlayerBattleState): Carta | null {
  return [...player.hand].sort((a, b) => valorCarta(a) - valorCarta(b))[0] ?? null;
}

function elegirRecluta(player: PlayerBattleState): string | null {
  if (player.recruitedThisTurn || player.field.length >= 5) {
    return null;
  }
  return guerrerosEnMano(player)[0]?.id ?? null;
}

function unidadMasDanada(units: UnitInPlay[]): UnitInPlay | null {
  return [...units].sort((a, b) => b.damageTaken - a.damageTaken)[0] ?? null;
}

function esCompatible(attacker: UnitInPlay, weapon: CartaArma): boolean {
  if (attacker.guerrero === "Dragon") {
    return true;
  }
  if (attacker.guerrero === "Mago") {
    return weapon.compatibleCon === "Mago";
  }
  if (attacker.guerrero === "Caballero") {
    return weapon.compatibleCon === "Caballero";
  }
  return weapon.compatibleCon === "Arquero";
}

function elegirAtaque(match: MatchState, player: PlayerBattleState): BattleAction | null {
  const enemigos = enemigosDe(match, player).filter((enemy) => enemy.field.length > 0);
  let mejor:
    | {
        attacker: UnitInPlay;
        defender: UnitInPlay;
        weapon: CartaArma;
        score: number;
      }
    | null = null;

  for (const attacker of player.field.filter((unit) => unit.canAttackThisTurn)) {
    for (const weapon of armasEnMano(player)) {
      if (!esCompatible(attacker, weapon)) {
        continue;
      }
      for (const enemy of enemigos) {
        for (const defender of enemy.field) {
          const score = weapon.valor + defender.damageTaken + (defender.shield ? 2 : 0);
          if (!mejor || score > mejor.score) {
            mejor = { attacker, defender, weapon, score };
          }
        }
      }
    }
  }

  return mejor
    ? {
        type: "ATTACK_WITH_WEAPON",
        payload: {
          attackerId: mejor.attacker.instanceId,
          defenderId: mejor.defender.instanceId,
          weaponCardId: mejor.weapon.id,
        },
      }
    : null;
}

function elegirPoder(match: MatchState, player: PlayerBattleState, dificultad: DificultadCpu): BattleAction | null {
  const power = player.hand.find((card) => card.tipo === "especial" && card.especial === "Poder");
  if (!power) {
    return null;
  }

  const enemigos = enemigosDe(match, player).filter((enemy) => enemy.field.length > 0);
  const aliados = [player, ...Object.values(match.currentBattle!.players).filter((candidate) => candidate.teamId && candidate.teamId === player.teamId && candidate.playerId !== player.playerId)];

  const mago = player.field.find((unit) => unit.guerrero === "Mago");
  if (mago) {
    const objetivoHerido = unidadMasDanada(aliados.flatMap((ally) => ally.field).filter((unit) => unit.damageTaken > 0));
    if (objetivoHerido && (dificultad !== "recluta" || objetivoHerido.damageTaken >= 4)) {
      return {
        type: "USE_POWER_CARD",
        payload: {
          cardId: power.id,
          sourceUnitId: mago.instanceId,
          targetUnitId: objetivoHerido.instanceId,
        },
      };
    }
  }

  const caballero = player.field.find((unit) => unit.guerrero === "Caballero");
  if (caballero) {
    const sinEscudo = aliados
      .flatMap((ally) => ally.field)
      .filter((unit) => !unit.shield)
      .sort((a, b) => {
        const prioridadA = a.canAttackThisTurn ? 2 : 0;
        const prioridadB = b.canAttackThisTurn ? 2 : 0;
        return prioridadB + b.damageTaken - (prioridadA + a.damageTaken);
      })[0];

    if (sinEscudo && (dificultad === "general" || sinEscudo.canAttackThisTurn || sinEscudo.damageTaken > 0)) {
      return {
        type: "USE_POWER_CARD",
        payload: {
          cardId: power.id,
          sourceUnitId: caballero.instanceId,
          targetUnitId: sinEscudo.instanceId,
        },
      };
    }
  }

  const arquero = player.field.find((unit) => unit.guerrero === "Arquero");
  if (arquero) {
    const objetivo = enemigos
      .flatMap((enemy) => enemy.field)
      .sort((a, b) => {
        const killA = a.guerrero === "Dragon" ? 5 - a.damageTaken : 10 - a.damageTaken;
        const killB = b.guerrero === "Dragon" ? 5 - b.damageTaken : 10 - b.damageTaken;
        return killA - killB;
      })[0];

    if (objetivo && (dificultad !== "recluta" || objetivo.damageTaken >= 5 || objetivo.guerrero === "Dragon")) {
      return {
        type: "USE_POWER_CARD",
        payload: {
          cardId: power.id,
          sourceUnitId: arquero.instanceId,
          targetUnitId: objetivo.instanceId,
        },
      };
    }
  }

  return null;
}

function elegirAsedio(match: MatchState, player: PlayerBattleState, dificultad: DificultadCpu): BattleAction | null {
  const asedio = player.hand.find((card) => card.tipo === "especial" && card.especial === "Asedio");
  if (!asedio) {
    return null;
  }

  const objetivo = enemigosDe(match, player)
    .filter((enemy) => enemy.castle.cards.length > 0)
    .sort((a, b) => {
      const prioridadCastillo = b.castle.oroConstruido - a.castle.oroConstruido;
      const prioridadDificultad = dificultad === "general" ? b.hand.length - a.hand.length : 0;
      return prioridadCastillo + prioridadDificultad;
    })[0];

  return objetivo
    ? {
        type: "ATTACK_WITH_SIEGE",
        payload: {
          cardId: asedio.id,
          targetPlayerId: objetivo.playerId,
        },
      }
    : null;
}

function elegirSabotaje(match: MatchState, player: PlayerBattleState, dificultad: DificultadCpu): BattleAction | null {
  const enemies = enemigosDe(match, player);
  const ladron = player.hand.find((card) => card.tipo === "especial" && card.especial === "Ladron");
  if (ladron) {
    const target = [...enemies].sort((a, b) => b.hand.length - a.hand.length)[0];
    if (target && target.hand.length > 0) {
      return {
        type: "USE_THIEF",
        payload: { cardId: ladron.id, targetPlayerId: target.playerId },
      };
    }
  }

  const espia = player.hand.find((card) => card.tipo === "especial" && card.especial === "Espia");
  if (!espia) {
    return null;
  }

  if (dificultad === "recluta") {
    return { type: "USE_SPY", payload: { cardId: espia.id, targetDeck: true } };
  }

  const target = [...enemies].sort((a, b) => b.hand.length - a.hand.length)[0];
  return target
    ? {
        type: "USE_SPY",
        payload: { cardId: espia.id, targetPlayerId: target.playerId },
      }
    : { type: "USE_SPY", payload: { cardId: espia.id, targetDeck: true } };
}

function elegirComercio(player: PlayerBattleState): BattleAction | null {
  const oro = player.hand
    .filter((card): card is Extract<Carta, { tipo: "oro" }> => card.tipo === "oro")
    .sort((a, b) => b.valor - a.valor)[0];

  if (oro) {
    return {
      type: "TRADE_WITH_GOLD",
      payload: {
        goldCardId: oro.id,
        amountToDraw: Math.max(1, Math.floor(oro.valor / 2)),
      },
    };
  }

  if (player.hand.length >= 3) {
    return {
      type: "TRADE_BARTER",
      payload: {
        paymentCardIds: [...player.hand].sort((a, b) => valorCarta(a) - valorCarta(b)).slice(0, 3).map((card) => card.id),
        amountToDraw: 1,
      },
    };
  }

  return null;
}

function elegirConstruccion(player: PlayerBattleState): BattleAction | null {
  if (!player.castle.reliquia) {
    const reliquia = player.hand.find((card) => (card.tipo === "oro" || card.tipo === "arma") && card.valor === 1);
    if (reliquia) {
      return { type: "BUILD_RELIC", payload: { cardId: reliquia.id } };
    }
    return null;
  }

  const oro = player.hand
    .filter((card): card is Extract<Carta, { tipo: "oro" }> => card.tipo === "oro")
    .sort((a, b) => b.valor - a.valor)[0];
  return oro ? { type: "BUILD_CASTLE_CARD", payload: { cardId: oro.id } } : null;
}

export function decidirAccionCpu(match: MatchState, cpuPlayerId: string, dificultad: DificultadCpu): BattleAction | null {
  const battle = match.currentBattle;
  if (!battle) {
    return null;
  }

  const player = battle.players[cpuPlayerId];
  if (!player || player.eliminated) {
    return null;
  }

  if (battle.phase === "BATTLE_INITIATIVE") {
    return battle.initiative.contenders.includes(cpuPlayerId) && battle.initiative.rolls[cpuPlayerId] === null
      ? { type: "ROLL_INITIATIVE", payload: {} }
      : null;
  }

  if (battle.phase === "INITIAL_DEPLOY") {
    if (player.initialDeployConfirmed) {
      return null;
    }
    if (player.initialDeployCount === 0) {
      const cardIds = elegirDespliegue(player, dificultad);
      if (cardIds.length > 0) {
        return { type: "INITIAL_DEPLOY", payload: { cardIds } };
      }
    }
    return { type: "CONFIRM_INITIAL_DEPLOY", payload: {} };
  }

  if (battle.activePlayerId !== cpuPlayerId) {
    return null;
  }

  if (battle.phase !== "TURN_DRAW") {
    const recruitId = elegirRecluta(player);
    if (recruitId) {
      return { type: "RECRUIT", payload: { cardId: recruitId } };
    }
  }

  switch (battle.phase) {
    case "TURN_DRAW": {
      if (player.hand.length >= 7) {
        const descartada = elegirCartaParaDescartar(player);
        if (descartada) {
          return { type: "DISCARD_ONE_FOR_DRAW", payload: { cardId: descartada.id } };
        }
      }
      return { type: "DRAW_CARD", payload: {} };
    }
    case "TURN_ATTACK":
      return (
        elegirPoder(match, player, dificultad) ??
        elegirAtaque(match, player) ??
        elegirAsedio(match, player, dificultad) ??
        { type: "ADVANCE_PHASE", payload: {} }
      );
    case "TURN_SABOTAGE":
      return elegirSabotaje(match, player, dificultad) ?? { type: "ADVANCE_PHASE", payload: {} };
    case "TURN_TRADE":
      return elegirComercio(player) ?? { type: "ADVANCE_PHASE", payload: {} };
    case "TURN_BUILD":
      return elegirConstruccion(player) ?? { type: "ADVANCE_PHASE", payload: {} };
    case "TURN_END_CHECKS":
      return { type: "ADVANCE_PHASE", payload: {} };
    default:
      return null;
  }
}
