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

const checks: Array<{ name: string; run: () => void }> = [
  {
    name: "setup reparte 3 guerreros y 4 recursos",
    run: () => {
      const battle = crearBatalla(createPlayers(2), "individual", 1);
      assert.equal(battle.players.p1.hand.length, 7);
      assert.equal(battle.players.p1.hand.filter((card) => card.tipo === "guerrero").length, 3);
      assert.equal(battle.players.p2.hand.filter((card) => card.tipo === "guerrero").length, 3);
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
    name: "poder de caballero agrega escudo de 5",
    run: () => {
      const battle = crearBatalla(createPlayers(2), "individual", 1);
      battle.phase = "TURN_ATTACK";
      battle.activePlayerId = "p1";
      battle.players.p1.hand = [special("poder-1", "Poder")];
      const knight = crearUnidadDesdeCarta(warrior("cab-2", "Caballero"), battle.currentTurn);
      battle.players.p1.field = [knight];

      const result = applyBattleAction(battle, "p1", {
        type: "USE_POWER_CARD",
        payload: {
          cardId: "poder-1",
          sourceUnitId: knight.instanceId,
        },
      });

      assert.equal(result.players.p1.field[0].shield?.remaining, 5);
      assert.equal(result.discardPile.some((card) => card.id === "poder-1"), true);
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
