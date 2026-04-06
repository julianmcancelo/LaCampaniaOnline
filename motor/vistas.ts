// Construye la vista del cliente desde el estado de batalla completo.
// El servidor hace esto en tiempo real; en el modo local lo hacemos directamente en el cliente.
import { crearId } from "./id";
import type {
  BattleState,
  ClientBattleView,
  ClientGameView,
  ClientMatchView,
  MatchPlayer,
  OpponentBattleView,
  RoomSummary,
} from "./tipos";

// Construye un RoomSummary ficticio para el modo local
function crearSalaLocal(idSala: string, jugadores: MatchPlayer[]): RoomSummary {
  return {
    id: idSala,
    nombre: "Práctica vs CPU",
    modo: "individual",
    maxJugadores: 2,
    estado: "playing",
    hostPlayerId: jugadores[0]?.playerId ?? "",
    players: jugadores.map((j) => ({
      playerId: j.playerId,
      displayName: j.displayName,
      isReady: true,
      isHost: j.isHost,
      teamId: j.teamId,
      connected: true,
    })),
  };
}

// Construye la vista del match para el modo local
function crearMatchLocal(
  idMatch: string,
  idSala: string,
  jugadores: MatchPlayer[],
  marcador: Record<string, number>,
): ClientMatchView {
  return {
    matchId: idMatch,
    roomId: idSala,
    roomName: "Práctica vs CPU",
    mode: "individual",
    targetBattleWins: 2,
    players: jugadores,
    scoreByPlayer: marcador,
    scoreByTeam: {},
    winnerPlayerId: null,
    winnerTeamId: null,
  };
}

// Convierte BattleState en ClientBattleView para el jugador humano.
// Las manos de los oponentes (CPU) quedan ocultas — solo se ve cardCount.
function construirVistaBatalla(batalla: BattleState, idJugador: string): ClientBattleView {
  const yo = batalla.players[idJugador];
  if (!yo) {
    throw new Error("Jugador no encontrado en la batalla.");
  }

  const oponentes: OpponentBattleView[] = Object.values(batalla.players)
    .filter((jugador) => jugador.playerId !== idJugador)
    .map((jugador) => ({
      playerId: jugador.playerId,
      displayName: jugador.displayName,
      teamId: jugador.teamId,
      connected: jugador.connected,
      cardCount: jugador.hand.length,
      field: jugador.field,
      castle: jugador.castle,
      eliminated: jugador.eliminated,
    }));

  return {
    id: batalla.id,
    battleNumber: batalla.battleNumber,
    phase: batalla.phase,
    activePlayerId: batalla.activePlayerId,
    currentTurn: batalla.currentTurn,
    turnOrder: batalla.turnOrder,
    initiative: batalla.initiative,
    me: yo,
    opponents: oponentes,
    centralDeckCount: batalla.centralDeck.length,
    discardCount: batalla.discardPile.length,
    cemeteryCount: batalla.cemetery.length,
    log: batalla.log,
  };
}

export interface ContextoPartidaLocal {
  idJugador: string;
  idSala: string;
  idMatch: string;
  jugadores: MatchPlayer[];
  marcador: Record<string, number>;
}

// Función principal: convierte BattleState → ClientGameView para el modo local
export function construirVistaLocal(
  batalla: BattleState,
  contexto: ContextoPartidaLocal,
): ClientGameView {
  const { idJugador, idSala, idMatch, jugadores, marcador } = contexto;

  const sala = crearSalaLocal(idSala, jugadores);
  const match = crearMatchLocal(idMatch, idSala, jugadores, marcador);
  const battleView = construirVistaBatalla(batalla, idJugador);

  return {
    playerId: idJugador,
    room: sala,
    match,
    battle: battleView,
    availableActions: [],
    privateContext: {
      spyView: batalla.players[idJugador]?.pendingSpy ?? null,
    },
  };
}
