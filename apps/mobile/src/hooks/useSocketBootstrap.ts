import { useEffect } from "react";
import type { ClientGameView, RoomSummary, SessionReadyPayload } from "../../../../motor/tipos";
import { guardarPlayerId, obtenerSocket, syncSocketIdentity } from "../lib/socket";
import { useMobileGameStore } from "../store/game-store";
import { useProfileStore } from "../store/profile-store";

export function useSocketBootstrap() {
  const {
    setConnection,
    setCurrentRoom,
    setError,
    setGameView,
    setPlayerId,
    setRoomList,
    resetRoomState,
  } = useMobileGameStore();
  const hydrated = useProfileStore((state) => state.hydrated);
  const profile = useProfileStore((state) => state.profile);

  useEffect(() => {
    const profileUid = profile?.uid;
    if (!hydrated || !profileUid) {
      return;
    }
    const stableProfileUid = profileUid;

    let mounted = true;

    async function connect() {
      await syncSocketIdentity(stableProfileUid);
      const socket = await obtenerSocket();
      if (!mounted) {
        return;
      }

      socket.on("connect", () => {
        setConnection("connected");
        socket.emit("room:list");
      });

      socket.on("disconnect", () => {
        setConnection("disconnected");
      });

      socket.on("connect_error", () => {
        setConnection("error");
      });

      socket.on("session:ready", async (payload: SessionReadyPayload) => {
        setPlayerId(payload.playerId);
        await guardarPlayerId(payload.playerId);
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
    }

    connect();

    return () => {
      mounted = false;
      void obtenerSocket().then((socket) => {
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
      });
    };
  }, [hydrated, profile?.uid, resetRoomState, setConnection, setCurrentRoom, setError, setGameView, setPlayerId, setRoomList]);
}
