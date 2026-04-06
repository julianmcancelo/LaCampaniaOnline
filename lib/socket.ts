import { io, Socket } from "socket.io-client";

let socketGlobal: Socket | null = null;
const FALLBACK_PRODUCTION_SOCKET_URL = "https://lacampaniaonline.onrender.com";

function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function resolveSocketUrl(): string | undefined {
  const configuredUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (configuredUrl) {
    return normalizeUrl(configuredUrl);
  }

  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return window.location.origin;
    }

    return FALLBACK_PRODUCTION_SOCKET_URL;
  }

  if (process.env.NODE_ENV === "production") {
    return FALLBACK_PRODUCTION_SOCKET_URL;
  }

  return undefined;
}

function buildSocketOptions(playerId: string | null) {
  return {
    autoConnect: true,
    transports: ["websocket", "polling"],
    auth: playerId ? { playerId } : {},
    reconnection: true,
    withCredentials: false,
  };
}

export function obtenerSocket(): Socket {
  if (socketGlobal) {
    return socketGlobal;
  }

  const playerId =
    typeof window !== "undefined" ? window.localStorage.getItem("campana:playerId") : null;

  const socketUrl = resolveSocketUrl();

  if (socketUrl) {
    socketGlobal = io(socketUrl, buildSocketOptions(playerId));
    return socketGlobal;
  }

  socketGlobal = io(buildSocketOptions(playerId));

  return socketGlobal;
}

export function reiniciarSocket(): void {
  if (socketGlobal) {
    socketGlobal.disconnect();
    socketGlobal = null;
  }
}
