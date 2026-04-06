import { create } from "zustand";
import type { ClientGameView, RoomSummary } from "../../../../motor/tipos";

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

interface MobileGameStore {
  playerId: string | null;
  connection: ConnectionState;
  roomList: RoomSummary[];
  currentRoom: RoomSummary | null;
  gameView: ClientGameView | null;
  error: string | null;
  setPlayerId: (playerId: string) => void;
  setConnection: (connection: ConnectionState) => void;
  setRoomList: (roomList: RoomSummary[]) => void;
  setCurrentRoom: (room: RoomSummary | null) => void;
  setGameView: (view: ClientGameView) => void;
  setError: (error: string | null) => void;
  resetRoomState: () => void;
}

export const useMobileGameStore = create<MobileGameStore>((set) => ({
  playerId: null,
  connection: "connecting",
  roomList: [],
  currentRoom: null,
  gameView: null,
  error: null,
  setPlayerId: (playerId) => set({ playerId }),
  setConnection: (connection) => set({ connection }),
  setRoomList: (roomList) => set({ roomList }),
  setCurrentRoom: (currentRoom) => set({ currentRoom }),
  setGameView: (gameView) => set({ gameView, currentRoom: gameView.room }),
  setError: (error) => set({ error }),
  resetRoomState: () =>
    set({
      currentRoom: null,
      gameView: null,
      error: null,
    }),
}));
