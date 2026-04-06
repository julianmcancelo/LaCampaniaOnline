import assert from "node:assert/strict";
import { applyBattleAction, applyMatchBattleAction } from "./acciones/indice";
import { calcularDanioPorArma } from "./combate";
import { ORO_CASTILLO_ALIANZAS } from "./constantes";
import { crearBatalla, crearUnidadDesdeCarta } from "./mazo";
import type { CartaArma, CartaEspecial, CartaGuerrero, CartaOro, MatchPlayer, MatchState } from "./tipos";
import { determinarGanadorDeBatalla, resolverGanadorDelMatch } from "./victoria";

function createPlayers(count: number, mode: "individual" | "alianzas" = "individual"): MatchPlayer[] {
  return Array.from({ length: count }, (_, index) => ({
    playerId: `p${index + 1}`,
    displayName: `Jugador ${index + 1}`,
    socketId: `s${index + 1}`,
    isReady: true,
    isHost: index === 0,
    teamId: mode === "alianzas" ? (index % 2 === 0 ? "A" : "B") : null,
    connected: true,
  }));
}

function weapon(id: string, arma: CartaArma["arma"], valor: number): CartaArma {
  return {
    id,
    tipo: "arma",
    nombre: `${arma} ${valor}`,
    arma,
    valor,
    compatibleCon: arma === "Pocion" ? "Mago" : arma === "Espada" ? "Caballero" : "Arquero",
  };
}

function gold(id: string, valor: number): CartaOro {
  return {
    id,
    tipo: "oro",
    nombre: `Oro ${valor}`,
    valor,
  };
}

function warrior(id: string, guerrero: CartaGuerrero["guerrero"]): CartaGuerrero {
  return {
    id,
    tipo: "guerrero",
    nombre: guerrero,
    guerrero,
  };
}

function special(id: string, especial: CartaEspecial["especial"]): CartaEspecial {
  return {
    id,
    tipo: "especial",
    nombre: especial,
    especial,
  };
}

function withMockedRandom<T>(values: number[], run: () => T): T {
  const original = Math.random;
  let index = 0;
  Math.random = () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };

  try {
    return run();
  } finally {
    Math.random = original;
  }
}

const checks: Array<{ name: string; run: () => void }> = [
  {
    name: "setup reparte 3 guerreros y 4 recursos",
    run: () => {
      const battle = crearBatalla(createPlayers(2), "individual", 1);
      assert.equal(battle.phase, "BATTLE_INITIATIVE");
      assert.equal(battle.players.p1.hand.length, 7);
      assert.equal(battle.players.p1.hand.filter((card) => card.tipo === "guerrero").length, 3);
      assert.equal(battle.players.p2.hand.filter((card) => card.tipo === "guerrero").length, 3);
    },
  },
  {
    name: "la iniciativa define el primer jugador y pasa a despliegue",
    run: () => {
      const battle = crearBatalla(createPlayers(2), "individual", 1);

      const result = withMockedRandom([0.1, 0.9], () => {
        const afterP1 = applyBattleAction(battle, "p1", { type: "ROLL_INITIATIVE", payload: {} });
        return applyBattleAction(afterP1, "p2", { type: "ROLL_INITIATIVE", payload: {} });
      });

      assert.equal(result.phase, "INITIAL_DEPLOY");
      assert.equal(result.initiative.winnerPlayerId, "p2");
      assert.equal(result.activePlayerId, "p2");
    },
  },
  {
    name: "la iniciativa desempatan solo los empatados",
    run: () => {
      const battle = crearBatalla(createPlayers(3), "individual", 1);

      const result = withMockedRandom([0.4, 0.4, 0.1, 0.9, 0.2], () => {
        let state = applyBattleAction(battle, "p1", { type: "ROLL_INITIATIVE", payload: {} });
        state = applyBattleAction(state, "p2", { type: "ROLL_INITIATIVE", payload: {} });
        state = applyBattleAction(state, "p3", { type: "ROLL_INITIATIVE", payload: {} });
        assert.equal(state.initiative.status, "tiebreak");
        assert.deepEqual(state.initiative.contenders.sort(), ["p1", "p2"]);
        state = applyBattleAction(state, "p1", { type: "ROLL_INITIATIVE", payload: {} });
        return applyBattleAction(state, "p2", { type: "ROLL_INITIATIVE", payload: {} });
      });

      assert.equal(result.phase, "INITIAL_DEPLOY");
      assert.equal(result.initiative.winnerPlayerId, "p1");
    },
  },
  {
    name: "dragon recibe dano impuro y mago hace dano puro a caballero",
    run: () => {
      const sword = weapon("espada-7", "Espada", 7);
      const potion = weapon("pocion-7", "Pocion", 7);
      assert.deepEqual(calcularDanioPorArma("Caballero", "Dragon", sword), { amount: 3.5, kind: "impuro" });
      assert.deepEqual(calcularDanioPorArma("Mago", "Caballero", potion), { amount: 7, kind: "puro" });
    },
  },
  {
    name: "alianzas usa castillo a 30",
    run: () => {
      const battle = crearBatalla(createPlayers(4, "alianzas"), "alianzas", 1);
      assert.equal(battle.players.p1.castle.objetivo, ORO_CASTILLO_ALIANZAS);
      assert.equal(battle.players.p3.castle.objetivo, ORO_CASTILLO_ALIANZAS);
    },
  },
  {
    name: "ataque usa arma desde la mano y elimina al rival",
    run: () => {
      const battle = crearBatalla(createPlayers(2), "individual", 1);
      battle.phase = "TURN_ATTACK";
      battle.activePlayerId = "p1";
      battle.currentTurn = 1;
      battle.players.p1.hand = [weapon("espada-9", "Espada", 9)];
      battle.players.p2.hand = [gold("oro-3", 3), gold("oro-4", 4)];

      const attacker = crearUnidadDesdeCarta(warrior("cab-1", "Caballero"), battle.currentTurn);
      attacker.canAttackThisTurn = true;
      const defender = crearUnidadDesdeCarta(warrior("arq-1", "Arquero"), battle.currentTurn);
      defender.damageTaken = 1;
      defender.vida = 9;

      battle.players.p1.field = [attacker];
      battle.players.p2.field = [defender];

      const result = applyBattleAction(battle, "p1", {
        type: "ATTACK_WITH_WEAPON",
        payload: {
          attackerId: attacker.instanceId,
          defenderId: defender.instanceId,
          weaponCardId: "espada-9",
        },
      });

      assert.equal(result.players.p1.hand.length, 1);
      assert.equal(result.players.p2.field.length, 0);
      assert.equal(result.players.p2.eliminated, true);
      assert.equal(result.players.p1.hand.length, 1);
    },
  },
  {
    name: "poder de caballero agrega escudo de 5 a una unidad aliada",
    run: () => {
      const battle = crearBatalla(createPlayers(4, "alianzas"), "alianzas", 1);
      battle.phase = "TURN_ATTACK";
      battle.activePlayerId = "p1";
      battle.players.p1.hand = [special("poder-1", "Poder")];
      const knight = crearUnidadDesdeCarta(warrior("cab-2", "Caballero"), battle.currentTurn);
      const allyArcher = crearUnidadDesdeCarta(warrior("arq-ally", "Arquero"), battle.currentTurn);
      battle.players.p1.field = [knight];
      battle.players.p3.field = [allyArcher];

      const result = applyBattleAction(battle, "p1", {
        type: "USE_POWER_CARD",
        payload: {
          cardId: "poder-1",
          sourceUnitId: knight.instanceId,
          targetUnitId: allyArcher.instanceId,
        },
      });

      assert.equal(result.players.p3.field[0].shield?.remaining, 5);
      assert.equal(result.discardPile.some((card) => card.id === "poder-1"), true);
    },
  },
  {
    name: "poder de mago cura una unidad aliada",
    run: () => {
      const battle = crearBatalla(createPlayers(4, "alianzas"), "alianzas", 1);
      battle.phase = "TURN_ATTACK";
      battle.activePlayerId = "p1";
      battle.players.p1.hand = [special("poder-sanacion", "Poder")];
      const mage = crearUnidadDesdeCarta(warrior("mago-1", "Mago"), battle.currentTurn);
      const allyKnight = crearUnidadDesdeCarta(warrior("cab-ally", "Caballero"), battle.currentTurn);
      allyKnight.damageTaken = 6;
      allyKnight.vida = 4;
      allyKnight.damageMarks.push({ cardId: "d1", cardName: "Espada 6", amount: 6, kind: "puro", sourceWeapon: "Espada" });
      battle.players.p1.field = [mage];
      battle.players.p3.field = [allyKnight];

      const result = applyBattleAction(battle, "p1", {
        type: "USE_POWER_CARD",
        payload: {
          cardId: "poder-sanacion",
          sourceUnitId: mage.instanceId,
          targetUnitId: allyKnight.instanceId,
        },
      });

      assert.equal(result.players.p3.field[0].damageTaken, 0);
      assert.equal(result.players.p3.field[0].damageMarks.length, 0);
    },
  },
  {
    name: "poder de arquero solo afecta a enemigos",
    run: () => {
      const battle = crearBatalla(createPlayers(2), "individual", 1);
      battle.phase = "TURN_ATTACK";
      battle.activePlayerId = "p1";
      battle.players.p1.hand = [special("poder-arquero", "Poder")];
      const archer = crearUnidadDesdeCarta(warrior("arq-4", "Arquero"), battle.currentTurn);
      const enemyMage = crearUnidadDesdeCarta(warrior("mago-rival", "Mago"), battle.currentTurn);
      battle.players.p1.field = [archer];
      battle.players.p2.field = [enemyMage];

      const result = applyBattleAction(battle, "p1", {
        type: "USE_POWER_CARD",
        payload: {
          cardId: "poder-arquero",
          sourceUnitId: archer.instanceId,
          targetUnitId: enemyMage.instanceId,
        },
      });

      assert.equal(result.players.p2.field.length, 0);
      assert.equal(result.players.p2.cemetery.length, 1);
    },
  },
  {
    name: "espia puede ver el mazo central y la mano rival",
    run: () => {
      const battle = crearBatalla(createPlayers(2), "individual", 1);
      battle.phase = "TURN_SABOTAGE";
      battle.activePlayerId = "p1";
      battle.centralDeck = [gold("oro-a", 1), gold("oro-b", 2), gold("oro-c", 3), gold("oro-d", 4), gold("oro-e", 5), gold("oro-f", 6)];
      battle.players.p1.hand = [special("espia-mazo", "Espia")];
      battle.players.p2.hand = [gold("oro-rival", 7), weapon("espada-rival", "Espada", 4)];

      const afterDeckSpy = applyBattleAction(battle, "p1", {
        type: "USE_SPY",
        payload: {
          cardId: "espia-mazo",
          targetDeck: true,
        },
      });

      assert.equal(afterDeckSpy.players.p1.pendingSpy?.source, "deck");
      assert.equal(afterDeckSpy.players.p1.pendingSpy?.cards.length, 5);

      afterDeckSpy.phase = "TURN_SABOTAGE";
      afterDeckSpy.activePlayerId = "p1";
      afterDeckSpy.players.p1.hand = [special("espia-mano", "Espia")];

      const afterHandSpy = applyBattleAction(afterDeckSpy, "p1", {
        type: "USE_SPY",
        payload: {
          cardId: "espia-mano",
          targetPlayerId: "p2",
        },
      });

      assert.equal(afterHandSpy.players.p1.pendingSpy?.source, "hand");
      assert.equal(afterHandSpy.players.p1.pendingSpy?.targetPlayerId, "p2");
      assert.equal(afterHandSpy.players.p1.pendingSpy?.cards.length, 2);
    },
  },
  {
    name: "castillo compartido en alianzas se sincroniza",
    run: () => {
      const battle = crearBatalla(createPlayers(4, "alianzas"), "alianzas", 1);
      battle.phase = "TURN_BUILD";
      battle.activePlayerId = "p1";
      battle.players.p1.hand = [gold("reliquia-oro-1", 1)];

      const afterRelic = applyBattleAction(battle, "p1", {
        type: "BUILD_RELIC",
        payload: { cardId: "reliquia-oro-1", targetPlayerId: "p1" },
      });

      assert.equal(afterRelic.players.p1.castle.reliquia?.id, "reliquia-oro-1");
      assert.equal(afterRelic.players.p3.castle.reliquia?.id, "reliquia-oro-1");

      afterRelic.phase = "TURN_BUILD";
      afterRelic.activePlayerId = "p3";
      afterRelic.players.p3.hand = [gold("oro-build-5", 5)];

      const afterGold = applyBattleAction(afterRelic, "p3", {
        type: "BUILD_CASTLE_CARD",
        payload: { cardId: "oro-build-5", targetPlayerId: "p3" },
      });

      assert.equal(afterGold.players.p1.castle.oroConstruido, 6);
      assert.equal(afterGold.players.p3.castle.oroConstruido, 6);
      assert.equal(afterGold.players.p1.castle.cards.length, 1);
      assert.equal(afterGold.players.p3.castle.cards.length, 1);
    },
  },
  {
    name: "construir con reliquia y oro gana por castillo",
    run: () => {
      const battle = crearBatalla(createPlayers(2), "individual", 1);
      battle.players.p1.castle.reliquia = gold("rel-oro-1", 1);
      battle.players.p1.castle.oroConstruido = 25;
      assert.equal(determinarGanadorDeBatalla(battle)?.winnerPlayerId, "p1");
    },
  },
  {
    name: "el match arma una nueva batalla si aun no hay ganador",
    run: () => {
      const players = createPlayers(2);
      const match: MatchState = {
        id: "match-1",
        roomId: "room-1",
        mode: "individual",
        targetBattleWins: 2,
        players,
        scoreByPlayer: { p1: 0, p2: 0 },
        scoreByTeam: {},
        currentBattle: crearBatalla(players, "individual", 1),
        battleHistory: [],
        winnerPlayerId: null,
        winnerTeamId: null,
      };

      const battle = match.currentBattle!;
      battle.phase = "TURN_ATTACK";
      battle.activePlayerId = "p1";
      battle.players.p1.hand = [weapon("espada-8", "Espada", 8)];
      battle.players.p2.hand = [gold("oro-2", 2)];

      const attacker = crearUnidadDesdeCarta(warrior("cab-3", "Caballero"), battle.currentTurn);
      attacker.canAttackThisTurn = true;
      const defender = crearUnidadDesdeCarta(warrior("arq-3", "Arquero"), battle.currentTurn);
      defender.damageTaken = 2;
      defender.vida = 8;
      battle.players.p1.field = [attacker];
      battle.players.p2.field = [defender];

      const updated = applyMatchBattleAction(match, "p1", {
        type: "ATTACK_WITH_WEAPON",
        payload: {
          attackerId: attacker.instanceId,
          defenderId: defender.instanceId,
          weaponCardId: "espada-8",
        },
      });

      assert.equal(updated.scoreByPlayer.p1, 1);
      assert.equal(updated.currentBattle?.battleNumber, 2);
    },
  },
  {
    name: "ganador del match se resuelve al llegar al objetivo",
    run: () => {
      const players = createPlayers(2);
      const match: MatchState = {
        id: "match-2",
        roomId: "room-2",
        mode: "individual",
        targetBattleWins: 2,
        players,
        scoreByPlayer: { p1: 2, p2: 0 },
        scoreByTeam: {},
        currentBattle: crearBatalla(players, "individual", 2),
        battleHistory: [],
        winnerPlayerId: null,
        winnerTeamId: null,
      };
      assert.equal(resolverGanadorDelMatch(match).winnerPlayerId, "p1");
    },
  },
];

let passed = 0;
for (const check of checks) {
  try {
    check.run();
    passed += 1;
    console.log(`PASS ${check.name}`);
  } catch (error) {
    console.error(`FAIL ${check.name}`);
    throw error;
  }
}

console.log(`OK ${passed} checks`);
