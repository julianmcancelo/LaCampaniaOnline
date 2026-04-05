import {
  BATALLAS_OBJETIVO_ALIANZAS,
  BATALLAS_OBJETIVO_INDIVIDUAL,
  ORO_CASTILLO_ALIANZAS,
  ORO_CASTILLO_INDIVIDUAL,
} from "./constantes";
import type { BattleResultSummary, BattleState, MatchState } from "./tipos";

export function determinarGanadorDeBatalla(battle: BattleState): BattleResultSummary | null {
  const activos = Object.values(battle.players).filter((player) => !player.eliminated);

  for (const player of activos) {
    if (player.castle.oroConstruido >= player.castle.objetivo) {
      return {
        winnerPlayerId: player.teamId ? null : player.playerId,
        winnerTeamId: player.teamId,
        reason: "castle",
      };
    }
  }

  if (activos.length === 1) {
    return {
      winnerPlayerId: activos[0].teamId ? null : activos[0].playerId,
      winnerTeamId: activos[0].teamId,
      reason: "elimination",
    };
  }

  const equiposActivos = new Set(activos.map((player) => player.teamId).filter(Boolean));
  if (equiposActivos.size === 1 && activos.length > 0 && activos[0].teamId) {
    return {
      winnerPlayerId: null,
      winnerTeamId: activos[0].teamId,
      reason: "elimination",
    };
  }

  return null;
}

export function actualizarMarcador(match: MatchState, result: BattleResultSummary): MatchState {
  const next: MatchState = {
    ...match,
    battleHistory: [...match.battleHistory, result],
    scoreByPlayer: { ...match.scoreByPlayer },
    scoreByTeam: { ...match.scoreByTeam },
  };

  if (result.winnerPlayerId) {
    next.scoreByPlayer[result.winnerPlayerId] = (next.scoreByPlayer[result.winnerPlayerId] ?? 0) + 1;
  }

  if (result.winnerTeamId) {
    next.scoreByTeam[result.winnerTeamId] = (next.scoreByTeam[result.winnerTeamId] ?? 0) + 1;
  }

  return next;
}

export function resolverGanadorDelMatch(match: MatchState): MatchState {
  if (match.mode === "alianzas") {
    for (const teamId of ["A", "B"] as const) {
      if ((match.scoreByTeam[teamId] ?? 0) >= BATALLAS_OBJETIVO_ALIANZAS) {
        return {
          ...match,
          winnerTeamId: teamId,
          winnerPlayerId: null,
        };
      }
    }

    const castleWinner = match.currentBattle
      ? Object.values(match.currentBattle.players).find((player) => player.castle.oroConstruido >= ORO_CASTILLO_ALIANZAS)
      : null;
    if (castleWinner?.teamId) {
      return {
        ...match,
        winnerTeamId: castleWinner.teamId,
        winnerPlayerId: null,
      };
    }

    return match;
  }

  const required = BATALLAS_OBJETIVO_INDIVIDUAL[match.players.length];
  for (const player of match.players) {
    if ((match.scoreByPlayer[player.playerId] ?? 0) >= required) {
      return {
        ...match,
        winnerPlayerId: player.playerId,
        winnerTeamId: null,
      };
    }
  }

  const castleWinner = match.currentBattle
    ? Object.values(match.currentBattle.players).find((player) => player.castle.oroConstruido >= ORO_CASTILLO_INDIVIDUAL)
    : null;
  if (castleWinner) {
    return {
      ...match,
      winnerPlayerId: castleWinner.playerId,
      winnerTeamId: null,
    };
  }

  return match;
}
