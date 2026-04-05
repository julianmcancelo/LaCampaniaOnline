import { MAXIMO_GUERREROS_CAMPO, MAXIMO_JUGADORES, MINIMO_JUGADORES } from "./constantes";
import type { BattleAction, BattlePhase, MatchState, PlayerBattleState } from "./tipos";

type ValidationResult = { ok: true } | { ok: false; reason: string };

function ok(): ValidationResult {
  return { ok: true };
}

function fail(reason: string): ValidationResult {
  return { ok: false, reason };
}

function requireBattle(match: MatchState) {
  return match.currentBattle ?? null;
}

function requirePhase(phase: BattlePhase, expected: BattlePhase): ValidationResult {
  return phase === expected ? ok() : fail(`La accion requiere fase ${expected}.`);
}

function getPlayer(match: MatchState, playerId: string): PlayerBattleState | null {
  return match.currentBattle?.players[playerId] ?? null;
}

export function validateBattleAction(match: MatchState, playerId: string, action: BattleAction): ValidationResult {
  const battle = requireBattle(match);
  if (!battle) {
    return fail("No hay batalla activa.");
  }

  const player = getPlayer(match, playerId);
  if (!player) {
    return fail("Jugador inexistente.");
  }

  if (battle.phase === "INITIAL_DEPLOY") {
    if (action.type !== "INITIAL_DEPLOY" && action.type !== "CONFIRM_INITIAL_DEPLOY") {
      return fail("Solo se permite el despliegue inicial.");
    }
    return ok();
  }

  if (battle.activePlayerId !== playerId) {
    return fail("No es tu turno.");
  }

  switch (action.type) {
    case "DRAW_CARD":
    case "DISCARD_ONE_FOR_DRAW":
      return requirePhase(battle.phase, "TURN_DRAW");
    case "ATTACK_WITH_WEAPON":
    case "ATTACK_WITH_SIEGE":
    case "USE_POWER_CARD":
      return requirePhase(battle.phase, "TURN_ATTACK");
    case "USE_THIEF":
    case "USE_SPY":
      return requirePhase(battle.phase, "TURN_SABOTAGE");
    case "TRADE_WITH_GOLD":
    case "TRADE_BARTER":
      return requirePhase(battle.phase, "TURN_TRADE");
    case "BUILD_RELIC":
    case "BUILD_CASTLE_CARD":
      return requirePhase(battle.phase, "TURN_BUILD");
    case "RECRUIT":
    case "SEND_REINFORCEMENT":
      if (player.recruitedThisTurn) {
        return fail("Ya reclutaste o enviaste un refuerzo este turno.");
      }
      if (player.field.length >= MAXIMO_GUERREROS_CAMPO && action.type === "RECRUIT") {
        return fail("Tu campo ya esta completo.");
      }
      return ok();
    case "ADVANCE_PHASE":
      return ok();
    default:
      return ok();
  }
}

export function validateRoomConfiguration(mode: MatchState["mode"], maxPlayers: number): ValidationResult {
  if (mode === "alianzas" && maxPlayers !== 4) {
    return fail("El modo alianzas requiere exactamente 4 jugadores.");
  }
  if (mode === "individual" && (maxPlayers < MINIMO_JUGADORES || maxPlayers > MAXIMO_JUGADORES)) {
    return fail("El modo individual admite entre 2 y 5 jugadores.");
  }
  return ok();
}
