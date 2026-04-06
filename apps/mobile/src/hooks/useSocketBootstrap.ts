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
    setTransport,
    resetRoomState,
  } = useMobileGameStore();
  const hydrated = useProfileStore((state) => state.hydrated);
  const authStatus = useProfileStore((state) => state.authStatus);
  const profile = useProfileStore((state) => state.profile);

  useEffect(() => {
    const profileUid = profile?.uid;
    if (!hydrated || authStatus !== "authenticated" || !profileUid) {
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

      const handleConnect = () => {
        setConnection("connected");
        setTransport(socket.io.engine.transport.name);
        socket.emit("room:list");
      };

      const handleDisconnect = () => {
        setConnection("disconnected");
        setTransport(null);
      };

      const handleConnectError = () => {
        setConnection("error");
        setTransport(null);
        setError("No se pudo conectar con el backend online de Render.");
      };

      const handleSessionReady = async (payload: SessionReadyPayload) => {
        setPlayerId(payload.playerId);
        await guardarPlayerId(payload.playerId);
      };

      const handleRoomList = (rooms: RoomSummary[]) => {
        setRoomList(rooms);
      };

      const handleRoomUpdate = (room: RoomSummary) => {
        setCurrentRoom(room);
      };

      const handleMatchUpdate = (view: ClientGameView) => {
        setGameView(view);
      };

      const handleRoomError = (payload: { message: string }) => {
        setError(payload.message);
      };

      const handleMatchError = (payload: { message: string }) => {
        setError(payload.message);
      };

      const handleRoomClosed = () => {
        resetRoomState();
      };

      const handleRoomLeft = () => {
        resetRoomState();
      };

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("session:ready", handleSessionReady);
      socket.off("room:list", handleRoomList);
      socket.off("room:update", handleRoomUpdate);
      socket.off("match:update", handleMatchUpdate);
      socket.off("room:error", handleRoomError);
      socket.off("match:error", handleMatchError);
      socket.off("room:closed", handleRoomClosed);
      socket.off("room:left", handleRoomLeft);

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);
      socket.on("session:ready", handleSessionReady);
      socket.on("room:list", handleRoomList);
      socket.on("room:update", handleRoomUpdate);
      socket.on("match:update", handleMatchUpdate);
      socket.on("room:error", handleRoomError);
      socket.on("match:error", handleMatchError);
      socket.on("room:closed", handleRoomClosed);
      socket.on("room:left", handleRoomLeft);

      if (socket.connected) {
        handleConnect();
      } else {
        socket.connect();
      }
    }

    void connect();

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
        socket.off("room:left");
      });
    };
  }, [authStatus, hydrated, profile?.uid, resetRoomState, setConnection, setCurrentRoom, setError, setGameView, setPlayerId, setRoomList, setTransport]);
}
