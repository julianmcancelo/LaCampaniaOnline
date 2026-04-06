import { cpuDisplayName, DEFAULT_PLAYER_NAME } from "../../../../../lib/lore";
import { applyMatchBattleAction } from "../../../../../motor/acciones/indice";
import { objetivoBatallas } from "../../../../../motor/constantes";
import { crearBatalla } from "../../../../../motor/mazo";
import type { BattleAction, MatchPlayer, MatchState } from "../../../../../motor/tipos";
import type { DificultadCpu, EstadoSolo } from "./tipos";

function crearJugadorLocal(playerId: string, displayName: string, isHost: boolean): MatchPlayer {
  return {
    playerId,
    displayName,
    socketId: null,
    isReady: true,
    isHost,
    teamId: null,
    connected: true,
  };
}

export function nombreCpu(dificultad: DificultadCpu): string {
  return cpuDisplayName(dificultad);
}

export function crearPartidaSolo(displayName: string, dificultad: DificultadCpu): EstadoSolo {
  const playerId = "humano";
  const cpuPlayerId = "cpu";
  const players: MatchPlayer[] = [
    crearJugadorLocal(playerId, displayName.trim() || DEFAULT_PLAYER_NAME, true),
    crearJugadorLocal(cpuPlayerId, nombreCpu(dificultad), false),
  ];

  const match: MatchState = {
    id: "solo-match",
    roomId: "solo-room",
    mode: "individual",
    targetBattleWins: objetivoBatallas("individual", players.length),
    players,
    scoreByPlayer: Object.fromEntries(players.map((player) => [player.playerId, 0])),
    scoreByTeam: {},
    currentBattle: crearBatalla(players, "individual", 1),
    battleHistory: [],
    winnerPlayerId: null,
    winnerTeamId: null,
  };

  return {
    match,
    playerId,
    cpuPlayerId,
    dificultad,
  };
}

export function aplicarAccionSolo(estado: EstadoSolo, playerId: string, action: BattleAction): EstadoSolo {
  return {
    ...estado,
    match: applyMatchBattleAction(estado.match, playerId, action),
  };
}
