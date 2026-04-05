"use client";

import { useEffect } from "react";
import { obtenerSocket } from "../lib/socket";
import { usarTiendaJuego } from "../tienda/estadoJuego";
import type { ClientGameView, RoomSummary, SessionReadyPayload } from "../motor/tipos";

export function usarSocket() {
  const { setConnection, setPlayerId, setRoomList, setCurrentRoom, setGameView, setError, resetRoomState } = usarTiendaJuego();

  useEffect(() => {
    const socket = obtenerSocket();

    socket.on("connect", () => {
      setConnection("connected");
    });

    socket.on("disconnect", () => {
      setConnection("disconnected");
    });

    socket.on("connect_error", () => {
      setConnection("error");
    });

    socket.on("session:ready", (payload: SessionReadyPayload) => {
      setPlayerId(payload.playerId);
      localStorage.setItem("campana:playerId", payload.playerId);
    });

    socket.on("room:list", (rooms: RoomSummary[]) => {
      setRoomList(rooms);
    });

    socket.on("room:update", (room: RoomSummary) => {
      setCurrentRoom(room);
    });

    socket.on("match:update", (view: ClientGameView) => {
      setGameView(view);
    });

    socket.on("room:error", (payload: { message: string }) => {
      setError(payload.message);
    });

    socket.on("match:error", (payload: { message: string }) => {
      setError(payload.message);
    });

    socket.on("room:closed", () => {
      resetRoomState();
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("session:ready");
      socket.off("room:list");
      socket.off("room:update");
      socket.off("match:update");
      socket.off("room:error");
      socket.off("match:error");
      socket.off("room:closed");
    };
  }, [resetRoomState, setConnection, setCurrentRoom, setError, setGameView, setPlayerId, setRoomList]);
}
