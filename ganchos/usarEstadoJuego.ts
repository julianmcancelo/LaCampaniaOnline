"use client";

import { usarTiendaJuego } from "../tienda/estadoJuego";

export function usarEstadoJuego() {
  const store = usarTiendaJuego();
  const battle = store.gameView?.battle ?? null;
  const room = store.gameView?.room ?? store.currentRoom;
  const match = store.gameView?.match ?? null;

  return {
    ...store,
    room,
    match,
    battle,
    me: battle?.me ?? null,
    opponents: battle?.opponents ?? [],
    isMyTurn: Boolean(battle?.activePlayerId && battle.activePlayerId === store.playerId),
    availableActions: store.gameView?.availableActions ?? [],
    pendingSpy: store.gameView?.privateContext.spyView ?? null,
    handLimitExceeded: Boolean(battle?.me && battle.me.hand.length > 7),
    discardCountRequired: battle?.me && battle.me.hand.length > 7 ? Math.floor(battle.me.hand.length / 2) : 0,
    matchFinished: Boolean(match?.winnerPlayerId || match?.winnerTeamId),
  };
}
