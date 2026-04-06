import { create } from "zustand";
import type { BattleAction } from "../../../../motor/tipos";
import { aplicarAccionSolo, crearPartidaSolo } from "../lib/solo/partida";
import type { DificultadCpu, EstadoSolo } from "../lib/solo/tipos";

interface SoloStore {
  estado: EstadoSolo | null;
  error: string | null;
  iniciar: (displayName: string, dificultad: DificultadCpu) => void;
  aplicar: (playerId: string, action: BattleAction) => void;
  limpiarError: () => void;
  cerrar: () => void;
}

export const useSoloStore = create<SoloStore>((set) => ({
  estado: null,
  error: null,
  iniciar: (displayName, dificultad) =>
    set({
      estado: crearPartidaSolo(displayName, dificultad),
      error: null,
    }),
  aplicar: (playerId, action) =>
    set((state) => {
      if (!state.estado) {
        return state;
      }
      try {
        return {
          estado: aplicarAccionSolo(state.estado, playerId, action),
          error: null,
        };
      } catch (error) {
        return {
          ...state,
          error: error instanceof Error ? error.message : "No se pudo ejecutar la accion.",
        };
      }
    }),
  limpiarError: () => set({ error: null }),
  cerrar: () => set({ estado: null, error: null }),
}));
