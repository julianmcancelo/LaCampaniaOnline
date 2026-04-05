import { Server as SocketServer, Socket } from "socket.io";
import { v4 as uuid } from "uuid";
import { applyMatchBattleAction } from "../motor/acciones/indice";
import type {
  AvailableAction,
  BattleAction,
  ClientGameView,
  ClientMatchView,
  ClientBattleView as BattleView,
  EquipoId,
  MatchState,
  RoomCreatePayload,
  RoomJoinPayload,
  Sala,
  SessionReadyPayload,
} from "../motor/tipos";
import { validateBattleAction } from "../motor/validadores";
import {
  assignTeam,
  createRoom,
  closeRoom,
  getRoom,
  getRoomByPlayer,
  getSocketTargets,
  joinRoom,
  leaveRoom,
  listRoomSummaries,
  markConnection,
  setReady,
  startMatch,
  toRoomSummary,
  updateMatch,
} from "./manejadorSalas";

function availableActions(match: MatchState | null, playerId: string, room: Sala): AvailableAction[] {
  const actions: AvailableAction[] = [];
  const roomPlayer = room.playerSlots.find((player) => player.playerId === playerId);
  actions.push({ type: "SET_READY", enabled: room.estado === "waiting" });
  actions.push({ type: "ASSIGN_TEAM", enabled: room.estado === "waiting" && room.modo === "alianzas" });
  actions.push({
    type: "START_MATCH",
    enabled: room.hostPlayerId === playerId && room.estado === "waiting",
  });

  if (!match?.currentBattle) {
    return actions;
  }

  const battle = match.currentBattle;
  const battlePlayer = battle.players[playerId];
  const phaseToAction: AvailableAction[] = [
    { type: "DRAW_CARD", enabled: battle.phase === "TURN_DRAW" && battle.activePlayerId === playerId },
    { type: "DISCARD_ONE_FOR_DRAW", enabled: battle.phase === "TURN_DRAW" && battle.activePlayerId === playerId && battlePlayer.hand.length >= 7 },
    { type: "ATTACK_WITH_WEAPON", enabled: battle.phase === "TURN_ATTACK" && battle.activePlayerId === playerId },
    { type: "ATTACK_WITH_SIEGE", enabled: battle.phase === "TURN_ATTACK" && battle.activePlayerId === playerId },
    { type: "USE_POWER_CARD", enabled: battle.phase === "TURN_ATTACK" && battle.activePlayerId === playerId },
    { type: "USE_THIEF", enabled: battle.phase === "TURN_SABOTAGE" && battle.activePlayerId === playerId },
    { type: "USE_SPY", enabled: battle.phase === "TURN_SABOTAGE" && battle.activePlayerId === playerId },
    { type: "TRADE_WITH_GOLD", enabled: battle.phase === "TURN_TRADE" && battle.activePlayerId === playerId },
    { type: "TRADE_BARTER", enabled: battle.phase === "TURN_TRADE" && battle.activePlayerId === playerId },
    { type: "BUILD_RELIC", enabled: battle.phase === "TURN_BUILD" && battle.activePlayerId === playerId },
    { type: "BUILD_CASTLE_CARD", enabled: battle.phase === "TURN_BUILD" && battle.activePlayerId === playerId },
    { type: "RECRUIT", enabled: battle.activePlayerId === playerId && !battlePlayer.recruitedThisTurn },
    { type: "SEND_REINFORCEMENT", enabled: battle.activePlayerId === playerId && !battlePlayer.recruitedThisTurn && room.modo === "alianzas" },
    { type: "ADVANCE_PHASE", enabled: battle.activePlayerId === playerId },
    { type: "INITIAL_DEPLOY", enabled: battle.phase === "INITIAL_DEPLOY" && !battlePlayer.initialDeployConfirmed },
    { type: "CONFIRM_INITIAL_DEPLOY", enabled: battle.phase === "INITIAL_DEPLOY" && battlePlayer.field.length > 0 && !battlePlayer.initialDeployConfirmed },
  ];
  return actions.concat(phaseToAction);
}

function buildBattleView(match: MatchState, playerId: string): BattleView | null {
  const battle = match.currentBattle;
  if (!battle) {
    return null;
  }
  return {
    id: battle.id,
    battleNumber: battle.battleNumber,
    phase: battle.phase,
    activePlayerId: battle.activePlayerId,
    currentTurn: battle.currentTurn,
    me: battle.players[playerId],
    opponents: Object.values(battle.players)
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
      })),
    centralDeckCount: battle.centralDeck.length,
    discardCount: battle.discardPile.length,
    cemeteryCount: battle.cemetery.length,
    log: battle.log.slice(-20),
  };
}

function buildMatchView(room: Sala): ClientMatchView {
  const match = room.matchState;
  return {
    matchId: match?.id ?? null,
    roomId: room.id,
    roomName: room.nombre,
    mode: room.modo,
    targetBattleWins: match?.targetBattleWins ?? 0,
    players: match?.players ?? room.playerSlots,
    scoreByPlayer: match?.scoreByPlayer ?? {},
    scoreByTeam: match?.scoreByTeam ?? {},
    winnerPlayerId: match?.winnerPlayerId ?? null,
    winnerTeamId: match?.winnerTeamId ?? null,
  };
}

function buildClientView(room: Sala, playerId: string): ClientGameView {
  const match = room.matchState;
  const battleView = match ? buildBattleView(match, playerId) : null;
  return {
    playerId,
    room: toRoomSummary(room),
    match: buildMatchView(room),
    battle: battleView,
    availableActions: availableActions(match, playerId, room),
    privateContext: {
      spyView: match?.currentBattle?.players[playerId]?.pendingSpy ?? null,
    },
  };
}

function broadcastRoom(io: SocketServer, room: Sala): void {
  for (const player of room.playerSlots) {
    if (!player.socketId) {
      continue;
    }
    io.to(player.socketId).emit("room:update", toRoomSummary(room));
    io.to(player.socketId).emit("match:update", buildClientView(room, player.playerId));
  }
  io.emit("room:list", listRoomSummaries());
}

function emitError(socket: Socket, message: string): void {
  socket.emit("room:error", { message });
}

export function registrarEventosSocket(io: SocketServer): void {
  io.on("connection", (socket: Socket) => {
    const requestedPlayerId = typeof socket.handshake.auth?.playerId === "string" ? socket.handshake.auth.playerId : null;
    const playerId = requestedPlayerId || uuid();
    socket.data.playerId = playerId;

    socket.emit("session:ready", { playerId } satisfies SessionReadyPayload);
    markConnection(playerId, socket.id, true);

    const existingRoom = getRoomByPlayer(playerId);
    if (existingRoom) {
      broadcastRoom(io, existingRoom);
    } else {
      socket.emit("room:list", listRoomSummaries());
    }

    socket.on("room:list", () => {
      socket.emit("room:list", listRoomSummaries());
    });

    socket.on("room:create", (payload: RoomCreatePayload) => {
      const result = createRoom(playerId, socket.id, payload);
      if (!result.room) {
        emitError(socket, result.error ?? "No fue posible crear la sala.");
        return;
      }
      broadcastRoom(io, result.room);
    });

    socket.on("room:join", (payload: RoomJoinPayload) => {
      const result = joinRoom(playerId, socket.id, payload);
      if (!result.room) {
        emitError(socket, result.error ?? "No fue posible unirse a la sala.");
        return;
      }
      broadcastRoom(io, result.room);
    });

    socket.on("room:leave", () => {
      const room = leaveRoom(playerId);
      if (room) {
        broadcastRoom(io, room);
      } else {
        io.emit("room:list", listRoomSummaries());
      }
    });

    socket.on("room:close", () => {
      const room = getRoomByPlayer(playerId);
      const result = closeRoom(playerId);
      if (!result.room) {
        emitError(socket, result.error ?? "No se pudo cerrar la sala.");
        return;
      }
      if (room) {
        for (const player of room.playerSlots) {
          if (player.socketId) {
            io.to(player.socketId).emit("room:closed");
          }
        }
      }
      io.emit("room:list", listRoomSummaries());
    });

    socket.on("room:setReady", (payload: { ready: boolean }) => {
      const room = setReady(playerId, payload.ready);
      if (!room) {
        emitError(socket, "No se encontro la sala del jugador.");
        return;
      }
      broadcastRoom(io, room);
    });

    socket.on("room:setTeam", (payload: { teamId: EquipoId | null }) => {
      const room = assignTeam(playerId, payload.teamId);
      if (!room) {
        emitError(socket, "No se pudo actualizar el equipo.");
        return;
      }
      broadcastRoom(io, room);
    });

    socket.on("match:start", () => {
      const result = startMatch(playerId);
      if (!result.room) {
        emitError(socket, result.error ?? "No se pudo iniciar el match.");
        return;
      }
      broadcastRoom(io, result.room);
    });

    socket.on("battle:action", (action: BattleAction) => {
      const room = getRoomByPlayer(playerId);
      if (!room?.matchState) {
        emitError(socket, "No hay match activo.");
        return;
      }

      const validation = validateBattleAction(room.matchState, playerId, action);
      if (!validation.ok) {
        socket.emit("match:error", { message: validation.reason });
        return;
      }

      try {
        const nextMatch = applyMatchBattleAction(room.matchState, playerId, action);
        const updated = updateMatch(room.id, nextMatch);
        if (!updated) {
          emitError(socket, "No se pudo persistir el estado del match.");
          return;
        }
        broadcastRoom(io, updated);
      } catch (error) {
        socket.emit("match:error", {
          message: error instanceof Error ? error.message : "Error de accion.",
        });
      }
    });

    socket.on("disconnect", () => {
      const room = markConnection(playerId, null, false);
      if (room) {
        broadcastRoom(io, room);
      }
    });
  });
}
