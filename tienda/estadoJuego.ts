"use client";

import { create } from "zustand";
import type { ClientGameView, RoomSummary } from "../motor/tipos";

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

interface GameStore {
  playerId: string | null;
  connection: ConnectionState;
  roomList: RoomSummary[];
  currentRoom: RoomSummary | null;
  gameView: ClientGameView | null;
  selectedHandCardIds: string[];
  selectedUnitId: string | null;
  selectedTargetId: string | null;
  selectedLootCardIds: string[];
  error: string | null;
  setPlayerId: (playerId: string) => void;
  setConnection: (connection: ConnectionState) => void;
  setRoomList: (rooms: RoomSummary[]) => void;
  setCurrentRoom: (room: RoomSummary | null) => void;
  setGameView: (view: ClientGameView) => void;
  toggleHandCard: (cardId: string) => void;
  clearHandSelection: () => void;
  setSelectedUnit: (unitId: string | null) => void;
  setSelectedTarget: (unitId: string | null) => void;
  toggleLootCard: (cardId: string) => void;
  clearLoot: () => void;
  setError: (error: string | null) => void;
  resetRoomState: () => void;
}

export const usarTiendaJuego = create<GameStore>((set) => ({
  playerId: null,
  connection: "connecting",
  roomList: [],
  currentRoom: null,
  gameView: null,
  selectedHandCardIds: [],
  selectedUnitId: null,
  selectedTargetId: null,
  selectedLootCardIds: [],
  error: null,
  setPlayerId: (playerId) => set({ playerId }),
  setConnection: (connection) => set({ connection }),
  setRoomList: (roomList) => set({ roomList }),
  setCurrentRoom: (currentRoom) => set({ currentRoom }),
  setGameView: (gameView) => set({ gameView, currentRoom: gameView.room }),
  toggleHandCard: (cardId) =>
    set((state) => ({
      selectedHandCardIds: state.selectedHandCardIds.includes(cardId)
        ? state.selectedHandCardIds.filter((entry) => entry !== cardId)
        : [...state.selectedHandCardIds, cardId],
    })),
  clearHandSelection: () => set({ selectedHandCardIds: [] }),
  setSelectedUnit: (selectedUnitId) => set({ selectedUnitId }),
  setSelectedTarget: (selectedTargetId) => set({ selectedTargetId }),
  toggleLootCard: (cardId) =>
    set((state) => ({
      selectedLootCardIds: state.selectedLootCardIds.includes(cardId)
        ? state.selectedLootCardIds.filter((entry) => entry !== cardId)
        : [...state.selectedLootCardIds, cardId],
    })),
  clearLoot: () => set({ selectedLootCardIds: [] }),
  setError: (error) => set({ error }),
  resetRoomState: () =>
    set({
      currentRoom: null,
      gameView: null,
      selectedHandCardIds: [],
      selectedUnitId: null,
      selectedTargetId: null,
      selectedLootCardIds: [],
      error: null,
    }),
}));
