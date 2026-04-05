import { io, Socket } from "socket.io-client";

let socketGlobal: Socket | null = null;

export function obtenerSocket(): Socket {
  if (socketGlobal) {
    return socketGlobal;
  }

  const playerId =
    typeof window !== "undefined" ? window.localStorage.getItem("campana:playerId") : null;

  socketGlobal = io({
    autoConnect: true,
    transports: ["websocket", "polling"],
    auth: playerId ? { playerId } : {},
    reconnection: true,
  });

  return socketGlobal;
}

export function reiniciarSocket(): void {
  if (socketGlobal) {
    socketGlobal.disconnect();
    socketGlobal = null;
  }
}
