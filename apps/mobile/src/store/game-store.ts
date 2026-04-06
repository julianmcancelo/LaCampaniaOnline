import { create } from "zustand";
import type { ClientGameView, RoomInvitePreview, RoomSummary } from "../../../../motor/tipos";
import type { PendingInvite } from "../lib/invitaciones";

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

interface MobileGameStore {
  playerId: string | null;
  connection: ConnectionState;
  transport: string | null;
  roomList: RoomSummary[];
  currentRoom: RoomSummary | null;
  gameView: ClientGameView | null;
  pendingInvite: PendingInvite | null;
  invitePreview: RoomInvitePreview | null;
  error: string | null;
  setPlayerId: (playerId: string) => void;
  setConnection: (connection: ConnectionState) => void;
  setTransport: (transport: string | null) => void;
  setRoomList: (roomList: RoomSummary[]) => void;
  setCurrentRoom: (room: RoomSummary | null) => void;
  setGameView: (view: ClientGameView) => void;
  setPendingInvite: (invite: PendingInvite | null) => void;
  setInvitePreview: (preview: RoomInvitePreview | null) => void;
  setError: (error: string | null) => void;
  resetRoomState: () => void;
}

export const useMobileGameStore = create<MobileGameStore>((set) => ({
  playerId: null,
  connection: "connecting",
  transport: null,
  roomList: [],
  currentRoom: null,
  gameView: null,
  pendingInvite: null,
  invitePreview: null,
  error: null,
  setPlayerId: (playerId) => set({ playerId }),
  setConnection: (connection) => set({ connection }),
  setTransport: (transport) => set({ transport }),
  setRoomList: (roomList) => set({ roomList }),
  setCurrentRoom: (currentRoom) => set({ currentRoom }),
  setGameView: (gameView) => set({ gameView, currentRoom: gameView.room }),
  setPendingInvite: (pendingInvite) => set({ pendingInvite }),
  setInvitePreview: (invitePreview) => set({ invitePreview }),
  setError: (error) => set({ error }),
  resetRoomState: () =>
    set({
      currentRoom: null,
      gameView: null,
      invitePreview: null,
      error: null,
      transport: null,
    }),
}));
