import { v4 as uuid } from "uuid";
import { JUGADORES_ALIANZA, MINIMO_JUGADORES, objetivoBatallas } from "../motor/constantes";
import { crearBatalla } from "../motor/mazo";
import type {
  EquipoId,
  MatchPlayer,
  MatchState,
  ModoJuego,
  RoomInvitePreview,
  RoomCreatePayload,
  RoomJoinPayload,
  RoomSummary,
  Sala,
} from "../motor/tipos";
import { validateRoomConfiguration } from "../motor/validadores";

const rooms = new Map<string, Sala>();

function now() {
  return Date.now();
}

function toSummary(room: Sala): RoomSummary {
  return {
    id: room.id,
    nombre: room.nombre,
    modo: room.modo,
    maxJugadores: room.maxJugadores,
    estado: room.estado,
    hostPlayerId: room.hostPlayerId,
    players: room.playerSlots.map((player) => ({
      playerId: player.playerId,
      displayName: player.displayName,
      isReady: player.isReady,
      isHost: player.isHost,
      teamId: player.teamId,
      connected: player.connected,
    })),
  };
}

function createPlayer(playerId: string, socketId: string, displayName: string, isHost: boolean, teamId: EquipoId | null): MatchPlayer {
  return {
    playerId,
    displayName,
    socketId,
    isReady: false,
    isHost,
    teamId,
    connected: true,
  };
}

export function listRoomSummaries(): RoomSummary[] {
  return Array.from(rooms.values()).map(toSummary);
}

export function getRoom(roomId: string): Sala | undefined {
  return rooms.get(roomId);
}

export function getRoomByPlayer(playerId: string): Sala | undefined {
  return Array.from(rooms.values()).find((room) =>
    room.playerSlots.some((player: MatchPlayer) => player.playerId === playerId)
  );
}

export function createRoom(playerId: string, socketId: string, payload: RoomCreatePayload): { room?: Sala; error?: string } {
  const validation = validateRoomConfiguration(payload.mode, payload.maxPlayers);
  if (!validation.ok) {
    return { error: validation.reason };
  }

  const room: Sala = {
    id: uuid(),
    nombre: payload.roomName,
    modo: payload.mode,
    maxJugadores: payload.maxPlayers,
    hostPlayerId: playerId,
    estado: "waiting",
    playerSlots: [
      createPlayer(playerId, socketId, payload.displayName, true, payload.mode === "alianzas" ? payload.teamId ?? "A" : null),
    ],
    matchState: null,
    createdAt: now(),
    updatedAt: now(),
  };
  rooms.set(room.id, room);
  return { room };
}

export function joinRoom(playerId: string, socketId: string, payload: RoomJoinPayload): { room?: Sala; error?: string } {
  const room = rooms.get(payload.roomId);
  if (!room) {
    return { error: "La sala no existe." };
  }
  if (room.estado !== "waiting") {
    return { error: "La sala ya esta en juego." };
  }
  if (room.playerSlots.length >= room.maxJugadores) {
    return { error: "La sala esta completa." };
  }

  const existing = room.playerSlots.find((player) => player.playerId === playerId);
  if (existing) {
    existing.socketId = socketId;
    existing.connected = true;
    existing.displayName = payload.displayName;
    room.updatedAt = now();
    return { room };
  }

  room.playerSlots.push(
    createPlayer(playerId, socketId, payload.displayName, false, room.modo === "alianzas" ? payload.teamId ?? null : null)
  );
  room.updatedAt = now();
  return { room };
}

export function leaveRoom(playerId: string): Sala | null {
  const room = getRoomByPlayer(playerId);
  if (!room) {
    return null;
  }

  if (room.estado === "waiting") {
    room.playerSlots = room.playerSlots.filter((player) => player.playerId !== playerId);
    if (room.playerSlots.length === 0) {
      rooms.delete(room.id);
      return null;
    }
    if (room.hostPlayerId === playerId) {
      const nextHost = room.playerSlots[0];
      room.hostPlayerId = nextHost.playerId;
      nextHost.isHost = true;
    }
  } else {
    const player = room.playerSlots.find((entry) => entry.playerId === playerId);
    if (player) {
      player.connected = false;
      player.socketId = null;
    }
  }
  room.updatedAt = now();
  return room;
}

export function closeRoom(playerId: string): { room?: Sala; error?: string } {
  const room = getRoomByPlayer(playerId);
  if (!room) {
    return { error: "La sala no existe." };
  }
  if (room.hostPlayerId !== playerId) {
    return { error: "Solo el anfitrion puede cerrar la sala." };
  }
  rooms.delete(room.id);
  return { room };
}

export function setReady(playerId: string, ready: boolean): Sala | null {
  const room = getRoomByPlayer(playerId);
  if (!room) {
    return null;
  }
  const player = room.playerSlots.find((entry) => entry.playerId === playerId);
  if (!player) {
    return null;
  }
  player.isReady = ready;
  room.updatedAt = now();
  return room;
}

export function assignTeam(playerId: string, teamId: EquipoId | null): Sala | null {
  const room = getRoomByPlayer(playerId);
  if (!room) {
    return null;
  }
  const player = room.playerSlots.find((entry) => entry.playerId === playerId);
  if (!player) {
    return null;
  }
  player.teamId = teamId;
  room.updatedAt = now();
  return room;
}

function validateAllianceTeams(room: Sala): string | null {
  if (room.modo !== "alianzas") {
    return null;
  }
  if (room.playerSlots.length !== JUGADORES_ALIANZA) {
    return "El modo alianzas requiere 4 jugadores.";
  }
  const a = room.playerSlots.filter((player) => player.teamId === "A").length;
  const b = room.playerSlots.filter((player) => player.teamId === "B").length;
  if (a !== 2 || b !== 2) {
    return "El modo alianzas requiere equipos 2 contra 2.";
  }
  return null;
}

export function startMatch(playerId: string): { room?: Sala; error?: string } {
  const room = getRoomByPlayer(playerId);
  if (!room) {
    return { error: "La sala no existe." };
  }
  if (room.hostPlayerId !== playerId) {
    return { error: "Solo el anfitrion puede iniciar." };
  }
  if (room.playerSlots.length < MINIMO_JUGADORES) {
    return { error: "No hay jugadores suficientes." };
  }
  if (!room.playerSlots.every((player) => player.isReady)) {
    return { error: "Todos los jugadores deben estar listos." };
  }
  const allianceError = validateAllianceTeams(room);
  if (allianceError) {
    return { error: allianceError };
  }

  const match: MatchState = {
    id: uuid(),
    roomId: room.id,
    mode: room.modo,
    targetBattleWins: objetivoBatallas(room.modo, room.playerSlots.length),
    players: room.playerSlots.map((player) => ({ ...player })),
    scoreByPlayer: Object.fromEntries(room.playerSlots.map((player) => [player.playerId, 0])),
    scoreByTeam: room.modo === "alianzas" ? { A: 0, B: 0 } : {},
    currentBattle: crearBatalla(room.playerSlots, room.modo, 1),
    battleHistory: [],
    winnerPlayerId: null,
    winnerTeamId: null,
  };

  room.matchState = match;
  room.estado = "playing";
  room.updatedAt = now();
  return { room };
}

export function updateMatch(roomId: string, matchState: MatchState): Sala | null {
  const room = rooms.get(roomId);
  if (!room) {
    return null;
  }
  room.matchState = matchState;
  if (matchState.winnerPlayerId || matchState.winnerTeamId) {
    room.estado = "finished";
  }
  room.updatedAt = now();
  return room;
}

export function markConnection(playerId: string, socketId: string | null, connected: boolean): Sala | null {
  const room = getRoomByPlayer(playerId);
  if (!room) {
    return null;
  }
  const slot = room.playerSlots.find((player) => player.playerId === playerId);
  if (!slot) {
    return null;
  }
  slot.connected = connected;
  slot.socketId = socketId;

  if (room.matchState) {
    const matchPlayer = room.matchState.players.find((player) => player.playerId === playerId);
    if (matchPlayer) {
      matchPlayer.connected = connected;
      matchPlayer.socketId = socketId;
    }
    const battlePlayer = room.matchState.currentBattle?.players[playerId];
    if (battlePlayer) {
      battlePlayer.connected = connected;
    }
  }
  room.updatedAt = now();
  return room;
}

export function getSocketTargets(room: Sala): string[] {
  return room.playerSlots.map((player) => player.socketId).filter((value): value is string => Boolean(value));
}

export function toRoomSummary(room: Sala): RoomSummary {
  return toSummary(room);
}

export function getRoomInvitePreview(roomId: string): RoomInvitePreview {
  const room = rooms.get(roomId);
  if (!room) {
    return {
      roomId,
      roomName: "Sala no encontrada",
      status: "missing",
      modeLabel: "Duelo / 2 jugadores",
      playerCount: 0,
      maxPlayers: 2,
    };
  }

  let status: RoomInvitePreview["status"] = "available";
  if (room.estado === "finished") {
    status = "closed";
  } else if (room.estado === "playing") {
    status = "started";
  } else if (room.playerSlots.length >= room.maxJugadores) {
    status = "full";
  }

  return {
    roomId: room.id,
    roomName: room.nombre,
    status,
    modeLabel: room.modo === "alianzas" ? "Alianzas" : "Duelo / 2 jugadores",
    playerCount: room.playerSlots.length,
    maxPlayers: room.maxJugadores,
  };
}
