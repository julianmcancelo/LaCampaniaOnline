import type { ClientBattleView, MatchState, OpponentBattleView, PlayerBattleState } from "../../../../../motor/tipos";

export type DificultadCpu = "recluta" | "capitan" | "general";

export interface EstadoSolo {
  match: MatchState;
  playerId: string;
  cpuPlayerId: string;
  dificultad: DificultadCpu;
}

export function construirVistaLocal(match: MatchState, playerId: string): ClientBattleView | null {
  const battle = match.currentBattle;
  if (!battle) {
    return null;
  }

  const me = battle.players[playerId];
  if (!me) {
    return null;
  }

  const opponents: OpponentBattleView[] = Object.values(battle.players)
    .filter((player) => player.playerId !== playerId)
    .map((player) => ({
      playerId: player.playerId,
      displayName: player.displayName,
      teamId: player.teamId,
      connected: player.connected,
      cardCount: player.hand.length,
      field: player.field,
      castle: player.castle,
      eliminated: player.eliminated,
    }));

  return {
    id: battle.id,
    battleNumber: battle.battleNumber,
    phase: battle.phase,
    activePlayerId: battle.activePlayerId,
    currentTurn: battle.currentTurn,
    turnOrder: battle.turnOrder,
    initiative: battle.initiative,
    me: me as PlayerBattleState,
    opponents,
    centralDeckCount: battle.centralDeck.length,
    discardCount: battle.discardPile.length,
    cemeteryCount: battle.cemetery.length,
    log: battle.log,
  };
}
