import { MAXIMO_CARTAS_MANO, MAXIMO_GUERREROS_CAMPO, VIDA_GUERRERO } from "../constantes";
import {
  aplicarDanioAUnidad,
  aplicarEscudo,
  armaCompatibleConUnidad,
  calcularDanioPorArma,
  crearMarcaDeDanio,
  resolverTiroCertero,
  sanarUnidad,
} from "../combate";
import { crearBatalla, crearUnidadDesdeCarta, mezclar, robar } from "../mazo";
import type {
  BattleAction,
  BattleState,
  Carta,
  CartaArma,
  CartaEspecial,
  CartaOro,
  MatchState,
  PlayerBattleState,
  UnitInPlay,
} from "../tipos";
import { actualizarMarcador, determinarGanadorDeBatalla, resolverGanadorDelMatch } from "../victoria";
import { crearId } from "../id";

function cloneBattle(battle: BattleState): BattleState {
  return structuredClone(battle);
}

function log(battle: BattleState, actorPlayerId: string | null, text: string): void {
  battle.log.push({
    id: crearId("log"),
    createdAt: Date.now(),
    actorPlayerId,
    text,
  });
}

function getPlayer(battle: BattleState, playerId: string): PlayerBattleState {
  const player = battle.players[playerId];
  if (!player) {
    throw new Error("Jugador inexistente en batalla.");
  }
  return player;
}

function removeCardById(cards: Carta[], cardId: string): Carta {
  const index = cards.findIndex((card) => card.id === cardId);
  if (index < 0) {
    throw new Error("Carta no encontrada.");
  }
  const [card] = cards.splice(index, 1);
  return card;
}

function findUnitOwner(battle: BattleState, unitId: string): { player: PlayerBattleState; unit: UnitInPlay; index: number } | null {
  for (const player of Object.values(battle.players)) {
    const index = player.field.findIndex((unit) => unit.instanceId === unitId);
    if (index >= 0) {
      return { player, unit: player.field[index], index };
    }
  }
  return null;
}

function recycleCentralDeckIfNeeded(battle: BattleState): void {
  if (battle.centralDeck.length > 0 || battle.discardPile.length === 0) {
    return;
  }
  battle.centralDeck = mezclar([...battle.discardPile]);
  battle.discardPile = [];
}

function resetAttackAvailability(battle: BattleState, activePlayerId: string): void {
  for (const unit of battle.players[activePlayerId].field) {
    unit.canAttackThisTurn = true;
  }
}

function nextTurn(battle: BattleState): void {
  const currentIndex = battle.turnOrder.indexOf(battle.activePlayerId ?? battle.turnOrder[0] ?? "");
  for (let offset = 1; offset <= battle.turnOrder.length; offset += 1) {
    const candidateIndex = (currentIndex + offset) % battle.turnOrder.length;
    const candidateId = battle.turnOrder[candidateIndex];
    if (!battle.players[candidateId].eliminated) {
      battle.activePlayerId = candidateId;
      battle.currentTurn += 1;
      battle.phase = "TURN_DRAW";
      for (const player of Object.values(battle.players)) {
        player.drewThisTurn = false;
        player.recruitedThisTurn = false;
        player.pendingSpy = null;
      }
      resetAttackAvailability(battle, candidateId);
      battle.updatedAt = Date.now();
      return;
    }
  }
}

function maybeResolveBattle(battle: BattleState): void {
  const result = determinarGanadorDeBatalla(battle);
  if (result) {
    battle.result = result;
    battle.phase = "BATTLE_OVER";
    battle.activePlayerId = null;
  }
}

function randomIndex(max: number): number {
  return Math.floor(Math.random() * max);
}

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function takeRandomCard(cards: Carta[]): Carta | null {
  if (cards.length === 0) {
    return null;
  }
  const index = randomIndex(cards.length);
  return cards.splice(index, 1)[0] ?? null;
}

function castleCards(player: PlayerBattleState): Carta[] {
  const cards: Carta[] = [];
  if (player.castle.reliquia) {
    cards.push(player.castle.reliquia);
  }
  cards.push(...player.castle.cards);
  return cards;
}

function resetCastle(player: PlayerBattleState): void {
  player.castle.reliquia = null;
  player.castle.cards = [];
  player.castle.oroConstruido = 0;
}

function syncSharedCastle(battle: BattleState, sourcePlayer: PlayerBattleState): void {
  if (!sourcePlayer.teamId) {
    return;
  }

  for (const member of teamMembers(battle, sourcePlayer.teamId)) {
    member.castle = structuredClone(sourcePlayer.castle);
  }
}

function teamMembers(battle: BattleState, teamId: PlayerBattleState["teamId"]): PlayerBattleState[] {
  return Object.values(battle.players).filter((player) => player.teamId === teamId);
}

function resolveElimination(battle: BattleState, loser: PlayerBattleState, killer: PlayerBattleState): void {
  if (loser.eliminated) {
    return;
  }

  loser.eliminated = true;
  const firstLoot = takeRandomCard(loser.hand);
  if (firstLoot && killer.hand.length < MAXIMO_CARTAS_MANO) {
    killer.hand.push(firstLoot);
  } else if (firstLoot) {
    battle.discardPile.push(firstLoot);
  }

  if (killer.teamId) {
    const ally = teamMembers(battle, killer.teamId).find((player) => player.playerId !== killer.playerId && !player.eliminated);
    if (ally) {
      for (let count = 0; count < 2; count += 1) {
        const bonusLoot = takeRandomCard(loser.hand);
        if (!bonusLoot) {
          break;
        }
        if (ally.hand.length < MAXIMO_CARTAS_MANO) {
          ally.hand.push(bonusLoot);
        } else {
          battle.discardPile.push(bonusLoot);
        }
      }
    }
  }

  battle.discardPile.push(...loser.hand);
  loser.hand = [];

  const castle = castleCards(loser);
  battle.discardPile.push(...castle);
  if (loser.teamId) {
    for (const mate of teamMembers(battle, loser.teamId)) {
      resetCastle(mate);
    }
  } else {
    resetCastle(loser);
  }

  log(battle, killer.playerId, `${loser.displayName} fue eliminado de la batalla.`);
}

function markEliminations(battle: BattleState, actingPlayerId: string): void {
  const actor = getPlayer(battle, actingPlayerId);
  for (const player of Object.values(battle.players)) {
    if (!player.eliminated && player.field.length === 0) {
      resolveElimination(battle, player, actor);
    }
  }
  maybeResolveBattle(battle);
}

function advancePhaseInternal(battle: BattleState): void {
  switch (battle.phase) {
    case "TURN_DRAW":
      battle.phase = "TURN_ATTACK";
      break;
    case "TURN_ATTACK":
      battle.phase = "TURN_SABOTAGE";
      break;
    case "TURN_SABOTAGE":
      battle.phase = "TURN_TRADE";
      break;
    case "TURN_TRADE":
      battle.phase = "TURN_BUILD";
      break;
    case "TURN_BUILD":
      battle.phase = "TURN_END_CHECKS";
      break;
    case "TURN_END_CHECKS":
      nextTurn(battle);
      break;
    default:
      break;
  }
}

function allyPlayerIds(battle: BattleState, player: PlayerBattleState): string[] {
  if (!player.teamId) {
    return [player.playerId];
  }
  return teamMembers(battle, player.teamId).map((entry) => entry.playerId);
}

function canAttackTarget(battle: BattleState, attackerId: string, defenderOwnerId: string): boolean {
  if (battle.turnOrder.length !== 5) {
    return attackerId !== defenderOwnerId;
  }

  const attackerIndex = battle.turnOrder.indexOf(attackerId);
  const defenderIndex = battle.turnOrder.indexOf(defenderOwnerId);
  if (attackerIndex < 0 || defenderIndex < 0) {
    return false;
  }
  const left = battle.turnOrder[(attackerIndex - 1 + battle.turnOrder.length) % battle.turnOrder.length];
  const right = battle.turnOrder[(attackerIndex + 1) % battle.turnOrder.length];
  return defenderOwnerId === left || defenderOwnerId === right;
}

function enforceHandLimitPenalty(battle: BattleState, playerId: string): void {
  const player = getPlayer(battle, playerId);
  if (player.hand.length <= MAXIMO_CARTAS_MANO) {
    return;
  }
  const amount = Math.floor(player.hand.length / 2);
  const lost: Carta[] = [];
  for (let index = 0; index < amount; index += 1) {
    const card = takeRandomCard(player.hand);
    if (card) {
      lost.push(card);
    }
  }
  battle.discardPile.push(...lost);
  log(battle, playerId, `${player.displayName} excedio el limite de mano y perdio ${lost.length} cartas al azar.`);
}

function applyRecruit(battle: BattleState, playerId: string, cardId: string, targetPlayerId: string): void {
  const player = getPlayer(battle, playerId);
  const target = getPlayer(battle, targetPlayerId);
  const card = removeCardById(player.hand, cardId);

  if (card.tipo !== "guerrero" && !(card.tipo === "especial" && card.especial === "Dragon")) {
    throw new Error("Solo se pueden reclutar guerreros o el Dragon.");
  }
  if (target.field.length >= MAXIMO_GUERREROS_CAMPO) {
    throw new Error("El campo de batalla ya esta completo.");
  }

  const unit = crearUnidadDesdeCarta(card, battle.currentTurn);
  unit.canAttackThisTurn = battle.phase === "TURN_DRAW" || battle.phase === "TURN_ATTACK";
  target.field.push(unit);
  player.recruitedThisTurn = true;
  log(
    battle,
    playerId,
    targetPlayerId === playerId
      ? `${player.displayName} recluto un ${unit.guerrero}.`
      : `${player.displayName} envio un refuerzo a ${target.displayName}.`
  );
}

function isValueOneCard(card: Carta): card is CartaArma | CartaOro {
  return (card.tipo === "oro" || card.tipo === "arma") && card.valor === 1;
}

function resolveInitiativeRound(battle: BattleState): void {
  const contenders = battle.initiative.contenders;
  if (!contenders.every((playerId) => battle.initiative.rolls[playerId] !== null)) {
    return;
  }

  const highest = Math.max(...contenders.map((playerId) => battle.initiative.rolls[playerId] ?? 0));
  const winners = contenders.filter((playerId) => battle.initiative.rolls[playerId] === highest);

  if (winners.length === 1) {
    const winnerPlayerId = winners[0];
    battle.initiative.winnerPlayerId = winnerPlayerId;
    battle.initiative.status = "resolved";
    battle.activePlayerId = winnerPlayerId;
    battle.startingPlayerIndex = battle.turnOrder.indexOf(winnerPlayerId);
    battle.phase = "INITIAL_DEPLOY";
    log(battle, winnerPlayerId, `${battle.players[winnerPlayerId].displayName} ganó la iniciativa con ${highest}.`);
    return;
  }

  battle.initiative.contenders = winners;
  battle.initiative.round += 1;
  battle.initiative.status = "tiebreak";
  for (const playerId of winners) {
    battle.initiative.rolls[playerId] = null;
  }
  log(
    battle,
    null,
    `Empate en iniciativa entre ${winners.map((playerId) => battle.players[playerId].displayName).join(", ")}. Vuelven a tirar.`,
  );
}

export function applyBattleAction(battleInput: BattleState, playerId: string, action: BattleAction): BattleState {
  const battle = cloneBattle(battleInput);
  const player = getPlayer(battle, playerId);

  switch (action.type) {
    case "ROLL_INITIATIVE": {
      if (battle.phase !== "BATTLE_INITIATIVE") {
        throw new Error("La batalla no está definiendo iniciativa.");
      }
      if (!battle.initiative.contenders.includes(playerId)) {
        throw new Error("No participás en esta ronda de iniciativa.");
      }
      if (battle.initiative.rolls[playerId] !== null) {
        throw new Error("Ya tiraste el dado en esta ronda.");
      }
      const result = rollDie();
      battle.initiative.rolls[playerId] = result;
      log(battle, playerId, `${player.displayName} tiró iniciativa y obtuvo ${result}.`);
      resolveInitiativeRound(battle);
      break;
    }
    case "INITIAL_DEPLOY": {
      if (battle.phase !== "INITIAL_DEPLOY") {
        throw new Error("La batalla no esta en despliegue inicial.");
      }
      const cardIds = action.payload.cardIds;
      if (cardIds.length === 0) {
        throw new Error("Debes desplegar al menos un guerrero.");
      }
      for (const cardId of cardIds) {
        const card = player.hand.find((entry) => entry.id === cardId);
        if (!card || card.tipo !== "guerrero") {
          throw new Error("Solo los guerreros pueden usarse en el despliegue inicial.");
        }
      }
      for (const cardId of cardIds) {
        applyRecruit(battle, playerId, cardId, playerId);
      }
      player.initialDeployCount += cardIds.length;
      break;
    }
    case "CONFIRM_INITIAL_DEPLOY": {
      if (battle.phase !== "INITIAL_DEPLOY") {
        throw new Error("El despliegue inicial ya termino.");
      }
      if (player.field.length === 0) {
        throw new Error("Debes comenzar con al menos un guerrero en el campo.");
      }
      player.initialDeployConfirmed = true;
      if (Object.values(battle.players).every((entry) => entry.initialDeployConfirmed)) {
        battle.phase = "TURN_DRAW";
        resetAttackAvailability(battle, battle.activePlayerId ?? playerId);
      }
      break;
    }
    case "DRAW_CARD": {
      if (battle.phase !== "TURN_DRAW" || battle.activePlayerId !== playerId) {
        throw new Error("No corresponde tomar ahora.");
      }
      if (player.hand.length >= MAXIMO_CARTAS_MANO) {
        throw new Error("Debes descartar una carta antes de tomar.");
      }
      recycleCentralDeckIfNeeded(battle);
      const draw = robar(battle.centralDeck, 1);
      battle.centralDeck = draw.rest;
      player.hand.push(...draw.drawn);
      player.drewThisTurn = true;
      log(battle, playerId, `${player.displayName} tomo una carta.`);
      enforceHandLimitPenalty(battle, playerId);
      advancePhaseInternal(battle);
      break;
    }
    case "DISCARD_ONE_FOR_DRAW": {
      if (battle.phase !== "TURN_DRAW" || battle.activePlayerId !== playerId) {
        throw new Error("No corresponde descartar para tomar ahora.");
      }
      const discarded = removeCardById(player.hand, action.payload.cardId);
      battle.discardPile.push(discarded);
      recycleCentralDeckIfNeeded(battle);
      const draw = robar(battle.centralDeck, 1);
      battle.centralDeck = draw.rest;
      player.hand.push(...draw.drawn);
      player.drewThisTurn = true;
      log(battle, playerId, `${player.displayName} descarto una carta para poder tomar del mazo.`);
      advancePhaseInternal(battle);
      break;
    }
    case "RECRUIT": {
      applyRecruit(battle, playerId, action.payload.cardId, playerId);
      break;
    }
    case "SEND_REINFORCEMENT": {
      applyRecruit(battle, playerId, action.payload.cardId, action.payload.allyPlayerId);
      break;
    }
    case "ATTACK_WITH_WEAPON": {
      if (battle.phase !== "TURN_ATTACK" || battle.activePlayerId !== playerId) {
        throw new Error("No corresponde atacar ahora.");
      }
      const attackOwner = findUnitOwner(battle, action.payload.attackerId);
      const defendOwner = findUnitOwner(battle, action.payload.defenderId);
      if (!attackOwner || !defendOwner) {
        throw new Error("No se encontraron unidades para el ataque.");
      }
      if (attackOwner.player.playerId !== playerId) {
        throw new Error("El atacante debe ser propio.");
      }
      if (allyPlayerIds(battle, player).includes(defendOwner.player.playerId)) {
        throw new Error("No puedes atacar a tu propio ejercito o alianza.");
      }
      if (!canAttackTarget(battle, playerId, defendOwner.player.playerId)) {
        throw new Error("En partidas de 5 jugadores solo puedes atacar con armas a quienes se sientan a tu lado.");
      }
      if (!attackOwner.unit.canAttackThisTurn) {
        throw new Error("Ese guerrero no puede atacar en este turno.");
      }
      const weapon = removeCardById(player.hand, action.payload.weaponCardId);
      if (weapon.tipo !== "arma") {
        throw new Error("Debes usar un arma de tu mano para atacar.");
      }
      if (!armaCompatibleConUnidad(weapon, attackOwner.unit)) {
        throw new Error("El arma no es compatible con el guerrero elegido.");
      }
      const damage = calcularDanioPorArma(attackOwner.unit.guerrero, defendOwner.unit.guerrero, weapon);
      const resolution = aplicarDanioAUnidad(
        defendOwner.unit,
        crearMarcaDeDanio(weapon, damage.amount, damage.kind),
        Boolean(defendOwner.unit.shield)
      );
      defendOwner.player.field[defendOwner.index] = resolution.updated;
      battle.discardPile.push(weapon);
      attackOwner.player.field[attackOwner.index].canAttackThisTurn = false;
      log(
        battle,
        playerId,
        `${player.displayName} ataco a ${defendOwner.player.displayName} con ${weapon.nombre} y causo ${damage.amount} de dano ${damage.kind}.`
      );
      if (resolution.eliminated) {
        const [deadUnit] = defendOwner.player.field.splice(defendOwner.index, 1);
        defendOwner.player.cemetery.push({
          id: deadUnit.sourceCardId,
          tipo: deadUnit.guerrero === "Dragon" ? "especial" : "guerrero",
          nombre: deadUnit.guerrero,
          ...(deadUnit.guerrero === "Dragon"
            ? { especial: "Dragon" as const }
            : { guerrero: deadUnit.guerrero as Exclude<UnitInPlay["guerrero"], "Dragon"> }),
        } as Carta);
      }
      markEliminations(battle, playerId);
      if (!battle.result) {
        advancePhaseInternal(battle);
      }
      break;
    }
    case "ATTACK_WITH_SIEGE": {
      if (battle.phase !== "TURN_ATTACK" || battle.activePlayerId !== playerId) {
        throw new Error("No corresponde usar Asedio ahora.");
      }
      const siege = removeCardById(player.hand, action.payload.cardId);
      if (siege.tipo !== "especial" || siege.especial !== "Asedio") {
        throw new Error("Debes jugar la carta de Asedio.");
      }
      const target = getPlayer(battle, action.payload.targetPlayerId);
      const castleCardsWithoutRelic = [...target.castle.cards];
      if (castleCardsWithoutRelic.length === 0) {
        throw new Error("El castillo rival no tiene oro para destruir.");
      }
      const shuffled = mezclar(castleCardsWithoutRelic);
      const stolen = shuffled[0] as CartaOro;
      target.castle.cards = target.castle.cards.filter((card) => card.id !== stolen.id);
      target.castle.oroConstruido = target.castle.cards.reduce((sum, card) => sum + card.valor, target.castle.reliquia?.tipo === "oro" ? target.castle.reliquia.valor : 0);
      syncSharedCastle(battle, target);
      battle.discardPile.push(siege, stolen);
      log(battle, playerId, `${player.displayName} asedio el castillo de ${target.displayName}.`);
      maybeResolveBattle(battle);
      if (!battle.result) {
        advancePhaseInternal(battle);
      }
      break;
    }
    case "USE_POWER_CARD": {
      if (battle.phase !== "TURN_ATTACK" || battle.activePlayerId !== playerId) {
        throw new Error("No corresponde usar un poder ahora.");
      }
      const power = removeCardById(player.hand, action.payload.cardId);
      if (power.tipo !== "especial" || power.especial !== "Poder") {
        throw new Error("Debes usar una carta de Poder.");
      }
      const source = findUnitOwner(battle, action.payload.sourceUnitId);
      if (!source || source.player.playerId !== playerId) {
        throw new Error("El guerrero que activa el poder debe ser propio.");
      }
      if (source.unit.guerrero === "Dragon") {
        throw new Error("El Dragon no puede usar Poder.");
      }
      if (source.unit.guerrero === "Mago") {
        const target = findUnitOwner(battle, action.payload.targetUnitId);
        if (!target || !allyPlayerIds(battle, player).includes(target.player.playerId)) {
          throw new Error("Sanacion solo puede aplicarse a un guerrero propio o aliado.");
        }
        target.player.field[target.index] = sanarUnidad(target.unit);
        log(battle, playerId, `${player.displayName} usó Sanación sobre ${target.player.displayName}.`);
      } else if (source.unit.guerrero === "Caballero") {
        const target = findUnitOwner(battle, action.payload.targetUnitId);
        if (!target || !allyPlayerIds(battle, player).includes(target.player.playerId)) {
          throw new Error("Escudo solo puede aplicarse a un guerrero propio o aliado.");
        }
        target.player.field[target.index] = aplicarEscudo(target.unit, power.id);
        log(battle, playerId, `${player.displayName} protegió a ${target.player.displayName} con Escudo.`);
      } else if (source.unit.guerrero === "Arquero") {
        const target = findUnitOwner(battle, action.payload.targetUnitId);
        if (!target || allyPlayerIds(battle, player).includes(target.player.playerId)) {
          throw new Error("El objetivo debe pertenecer a un rival.");
        }
        const result = resolverTiroCertero(target.unit);
        target.player.field[target.index] = result.updated;
        if (result.eliminated) {
          const [deadUnit] = target.player.field.splice(target.index, 1);
          target.player.cemetery.push({
            id: deadUnit.sourceCardId,
            tipo: deadUnit.guerrero === "Dragon" ? "especial" : "guerrero",
            nombre: deadUnit.guerrero,
            ...(deadUnit.guerrero === "Dragon"
              ? { especial: "Dragon" as const }
              : { guerrero: deadUnit.guerrero as Exclude<UnitInPlay["guerrero"], "Dragon"> }),
            } as Carta);
        }
        log(battle, playerId, `${player.displayName} usó Tiro Certero contra ${target.player.displayName}.`);
      }
      battle.discardPile.push(power);
      markEliminations(battle, playerId);
      if (!battle.result) {
        advancePhaseInternal(battle);
      }
      break;
    }
    case "USE_THIEF": {
      if (battle.phase !== "TURN_SABOTAGE" || battle.activePlayerId !== playerId) {
        throw new Error("No corresponde robar ahora.");
      }
      const thief = removeCardById(player.hand, action.payload.cardId);
      if (thief.tipo !== "especial" || thief.especial !== "Ladron") {
        throw new Error("Debes jugar la carta de Ladron.");
      }
      const target = getPlayer(battle, action.payload.targetPlayerId);
      const stolen = takeRandomCard(target.hand);
      if (stolen) {
        player.hand.push(stolen);
      }
      battle.discardPile.push(thief);
      log(battle, playerId, `${player.displayName} robo una carta al azar de ${target.displayName}.`);
      enforceHandLimitPenalty(battle, playerId);
      advancePhaseInternal(battle);
      break;
    }
    case "USE_SPY": {
      if (battle.phase !== "TURN_SABOTAGE" || battle.activePlayerId !== playerId) {
        throw new Error("No corresponde espiar ahora.");
      }
      const spy = removeCardById(player.hand, action.payload.cardId);
      if (spy.tipo !== "especial" || spy.especial !== "Espia") {
        throw new Error("Debes jugar la carta de Espia.");
      }
      if (action.payload.targetDeck) {
        player.pendingSpy = {
          source: "deck",
          targetLabel: "Mazo central",
          cards: structuredClone(battle.centralDeck.slice(0, 5)),
        };
      } else if (action.payload.targetPlayerId) {
        const target = getPlayer(battle, action.payload.targetPlayerId);
        player.pendingSpy = {
          source: "hand",
          targetPlayerId: target.playerId,
          targetLabel: `Mano de ${target.displayName}`,
          cards: structuredClone(target.hand),
        };
      } else {
        throw new Error("Espia requiere mirar un mazo o la mano de un rival.");
      }
      battle.discardPile.push(spy);
      log(battle, playerId, `${player.displayName} uso Espia.`);
      advancePhaseInternal(battle);
      break;
    }
    case "TRADE_WITH_GOLD": {
      if (battle.phase !== "TURN_TRADE" || battle.activePlayerId !== playerId) {
        throw new Error("No corresponde comerciar ahora.");
      }
      const gold = removeCardById(player.hand, action.payload.goldCardId);
      if (gold.tipo !== "oro") {
        throw new Error("Solo una carta de Oro puede usarse para comerciar.");
      }
      const maxAmount = Math.floor(gold.valor / 2);
      const amount = Math.max(0, Math.min(action.payload.amountToDraw ?? maxAmount, maxAmount));
      recycleCentralDeckIfNeeded(battle);
      const draw = robar(battle.centralDeck, amount);
      battle.centralDeck = draw.rest;
      player.hand.push(...draw.drawn);
      battle.discardPile.push(gold);
      log(battle, playerId, `${player.displayName} compro ${draw.drawn.length} cartas con Oro.`);
      enforceHandLimitPenalty(battle, playerId);
      advancePhaseInternal(battle);
      break;
    }
    case "TRADE_BARTER": {
      if (battle.phase !== "TURN_TRADE" || battle.activePlayerId !== playerId) {
        throw new Error("No corresponde comerciar ahora.");
      }
      if (action.payload.amountToDraw < 1 || action.payload.amountToDraw > 2) {
        throw new Error("El trueque permite comprar 1 o 2 cartas.");
      }
      if (action.payload.paymentCardIds.length !== action.payload.amountToDraw * 3) {
        throw new Error("El trueque requiere 3 cartas por cada carta comprada.");
      }
      const spent = action.payload.paymentCardIds.map((cardId) => removeCardById(player.hand, cardId));
      recycleCentralDeckIfNeeded(battle);
      const draw = robar(battle.centralDeck, action.payload.amountToDraw);
      battle.centralDeck = draw.rest;
      player.hand.push(...draw.drawn);
      battle.discardPile.push(...spent);
      log(battle, playerId, `${player.displayName} hizo un trueque por ${draw.drawn.length} cartas.`);
      enforceHandLimitPenalty(battle, playerId);
      advancePhaseInternal(battle);
      break;
    }
    case "BUILD_RELIC": {
      if (battle.phase !== "TURN_BUILD" || battle.activePlayerId !== playerId) {
        throw new Error("No corresponde construir ahora.");
      }
      const target = getPlayer(battle, action.payload.targetPlayerId ?? playerId);
      if (!allyPlayerIds(battle, player).includes(target.playerId)) {
        throw new Error("Solo puedes construir en tu castillo o en el de un aliado.");
      }
      if (target.castle.reliquia) {
        throw new Error("El castillo ya tiene Reliquia.");
      }
      const relic = removeCardById(player.hand, action.payload.cardId);
      if (!isValueOneCard(relic)) {
        throw new Error("La Reliquia debe ser una carta de valor 1.");
      }
      target.castle.reliquia = relic;
      target.castle.oroConstruido = relic.tipo === "oro" ? relic.valor : 0;
      syncSharedCastle(battle, target);
      log(battle, playerId, `${player.displayName} inicio la construccion del castillo con una Reliquia.`);
      maybeResolveBattle(battle);
      if (!battle.result) {
        advancePhaseInternal(battle);
      }
      break;
    }
    case "BUILD_CASTLE_CARD": {
      if (battle.phase !== "TURN_BUILD" || battle.activePlayerId !== playerId) {
        throw new Error("No corresponde construir ahora.");
      }
      const target = getPlayer(battle, action.payload.targetPlayerId ?? playerId);
      if (!allyPlayerIds(battle, player).includes(target.playerId)) {
        throw new Error("Solo puedes construir en tu castillo o en el de un aliado.");
      }
      if (!target.castle.reliquia) {
        throw new Error("Primero debes bajar una Reliquia.");
      }
      const card = removeCardById(player.hand, action.payload.cardId);
      if (card.tipo !== "oro") {
        throw new Error("Solo el Oro puede agregarse al castillo.");
      }
      target.castle.cards.push(card);
      target.castle.oroConstruido += card.valor;
      syncSharedCastle(battle, target);
      log(battle, playerId, `${player.displayName} agrego ${card.valor} al castillo.`);
      maybeResolveBattle(battle);
      if (!battle.result) {
        advancePhaseInternal(battle);
      }
      break;
    }
    case "ADVANCE_PHASE": {
      if (battle.activePlayerId !== playerId) {
        throw new Error("Solo el jugador activo puede avanzar de fase.");
      }
      advancePhaseInternal(battle);
      break;
    }
    default:
      throw new Error("Accion no implementada.");
  }

  battle.updatedAt = Date.now();
  return battle;
}

export function startNextBattle(match: MatchState): MatchState {
  const battleNumber = (match.currentBattle?.battleNumber ?? match.battleHistory.length) + 1;
  const nextStarter = match.currentBattle ? (match.currentBattle.startingPlayerIndex + 1) % match.players.length : 0;
  return {
    ...match,
    currentBattle: crearBatalla(match.players, match.mode, battleNumber, nextStarter),
  };
}

export function applyMatchBattleAction(matchInput: MatchState, playerId: string, action: BattleAction): MatchState {
  if (!matchInput.currentBattle) {
    throw new Error("No hay batalla activa.");
  }

  const currentBattle = matchInput.currentBattle;
  let match = structuredClone(matchInput) as MatchState;
  match.currentBattle = applyBattleAction(currentBattle, playerId, action);

  if (match.currentBattle.phase === "BATTLE_OVER" && match.currentBattle.result) {
    match = actualizarMarcador(match, match.currentBattle.result);
    match = resolverGanadorDelMatch(match);
    if (!match.winnerPlayerId && !match.winnerTeamId) {
      match = startNextBattle(match);
    } else {
      if (match.currentBattle) {
        match.currentBattle.phase = "MATCH_OVER";
      }
    }
  }

  return match;
}
