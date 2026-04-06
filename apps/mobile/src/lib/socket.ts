import { io, type Socket } from "socket.io-client";
import { loadJson, saveJson, STORAGE_KEYS } from "./storage";
import type { PerfilJugador } from "../store/profile-store";

const FALLBACK_SOCKET_URL = "https://lacampaniaonline.onrender.com";

let socketGlobal: Socket | null = null;
let playerIdEnMemoria: string | null = null;

function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function resolveSocketUrl(): string {
  const configured = process.env.EXPO_PUBLIC_SOCKET_URL?.trim();
  return configured ? normalizeUrl(configured) : FALLBACK_SOCKET_URL;
}

export function getSocketUrl(): string {
  return resolveSocketUrl();
}

function buildSocket(playerId: string | null): Socket {
  return io(resolveSocketUrl(), {
    autoConnect: false,
    transports: ["websocket", "polling"],
    reconnection: true,
    auth: playerId ? { playerId } : {},
    withCredentials: false,
  });
}

export async function hydratePlayerIdFromProfile(): Promise<string | null> {
  const profile = await loadJson<Pick<PerfilJugador, "uid">>(STORAGE_KEYS.profile);
  playerIdEnMemoria = profile?.uid ?? null;
  return playerIdEnMemoria;
}

export async function obtenerSocket(): Promise<Socket> {
  if (socketGlobal) {
    return socketGlobal;
  }

  if (!playerIdEnMemoria) {
    await hydratePlayerIdFromProfile();
  }

  socketGlobal = buildSocket(playerIdEnMemoria);
  return socketGlobal;
}

export async function guardarPlayerId(playerId: string): Promise<void> {
  playerIdEnMemoria = playerId;
}

export async function syncSocketIdentity(playerId: string): Promise<void> {
  playerIdEnMemoria = playerId;
  if (!socketGlobal) {
    return;
  }

  const currentAuth =
    socketGlobal.auth && typeof socketGlobal.auth === "object" ? socketGlobal.auth : null;

  if (currentAuth?.playerId === playerId && socketGlobal.connected) {
    return;
  }

  socketGlobal.disconnect();
  socketGlobal = buildSocket(playerId);
}

export async function persistSocketProfileUid(uid: string): Promise<void> {
  playerIdEnMemoria = uid;
  const existing = (await loadJson<Record<string, unknown>>(STORAGE_KEYS.profile)) ?? {};
  await saveJson(STORAGE_KEYS.profile, {
    ...existing,
    uid,
  });
}

export function reiniciarSocket(): void {
  if (socketGlobal) {
    socketGlobal.disconnect();
    socketGlobal = null;
  }
}
