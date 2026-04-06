import { create } from "zustand";
import { ensureAnonymousAuth } from "../lib/firebase/auth";
import { loadRemoteProfile, saveRemoteProfile, type PerfilJugadorRemoto } from "../lib/firebase/profile";
import { loadJson, saveJson, STORAGE_KEYS } from "../lib/storage";

export type DificultadLocal = "recluta" | "capitan" | "general";

export interface PerfilJugador {
  uid: string;
  displayName: string;
  isAnonymous: boolean;
  perfilCompleto: boolean;
  preferencias: {
    lastCpuDifficulty: DificultadLocal;
  };
  progreso: {
    localMatchesPlayed: number;
  };
}

type AuthStatus = "loading" | "ready" | "local-only";

interface ProfileStore {
  hydrated: boolean;
  authStatus: AuthStatus;
  profile: PerfilJugador | null;
  error: string | null;
  initialize: () => Promise<void>;
  saveDisplayName: (displayName: string) => Promise<void>;
  setLastCpuDifficulty: (difficulty: DificultadLocal) => Promise<void>;
  incrementLocalMatches: () => Promise<void>;
}

function createFallbackProfile(uid: string, displayName = ""): PerfilJugador {
  return {
    uid,
    displayName,
    isAnonymous: true,
    perfilCompleto: Boolean(displayName.trim()),
    preferencias: {
      lastCpuDifficulty: "capitan",
    },
    progreso: {
      localMatchesPlayed: 0,
    },
  };
}

async function persistProfile(profile: PerfilJugador): Promise<void> {
  await saveJson(STORAGE_KEYS.profile, profile);
}

function toRemoteProfile(profile: PerfilJugador): PerfilJugadorRemoto {
  return {
    uid: profile.uid,
    displayName: profile.displayName,
    isAnonymous: profile.isAnonymous,
    perfilCompleto: profile.perfilCompleto,
    preferencias: profile.preferencias,
    progreso: profile.progreso,
  };
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  hydrated: false,
  authStatus: "loading",
  profile: null,
  error: null,
  initialize: async () => {
    if (get().hydrated) {
      return;
    }

    const localProfile = await loadJson<PerfilJugador>(STORAGE_KEYS.profile);

    try {
      const user = await ensureAnonymousAuth();
      const uid = user?.uid ?? localProfile?.uid ?? `local-${Date.now()}`;
      const remote = user ? await loadRemoteProfile(uid) : null;

      const merged: PerfilJugador =
        (remote && {
          uid: remote.uid,
          displayName: remote.displayName ?? localProfile?.displayName ?? "",
          isAnonymous: remote.isAnonymous ?? true,
          perfilCompleto: remote.perfilCompleto ?? Boolean(remote.displayName?.trim()),
          preferencias: {
            lastCpuDifficulty: remote.preferencias?.lastCpuDifficulty ?? localProfile?.preferencias.lastCpuDifficulty ?? "capitan",
          },
          progreso: {
            localMatchesPlayed: remote.progreso?.localMatchesPlayed ?? localProfile?.progreso.localMatchesPlayed ?? 0,
          },
        }) ||
        localProfile ||
        createFallbackProfile(uid);

      await persistProfile(merged);
      await saveRemoteProfile(toRemoteProfile(merged));

      set({
        hydrated: true,
        authStatus: user ? "ready" : "local-only",
        profile: merged,
        error: null,
      });
    } catch (error) {
      const fallback = localProfile ?? createFallbackProfile(`local-${Date.now()}`);
      await persistProfile(fallback);

      set({
        hydrated: true,
        authStatus: "local-only",
        profile: fallback,
        error: error instanceof Error ? error.message : "No se pudo inicializar el perfil.",
      });
    }
  },
  saveDisplayName: async (displayName) => {
    const current = get().profile;
    if (!current) {
      return;
    }

    const next: PerfilJugador = {
      ...current,
      displayName: displayName.trim(),
      perfilCompleto: Boolean(displayName.trim()),
    };

    await persistProfile(next);
    try {
      await saveRemoteProfile(toRemoteProfile(next));
      set({ profile: next, error: null });
    } catch (error) {
      set({
        profile: next,
        error: error instanceof Error ? error.message : "No se pudo sincronizar el perfil.",
      });
    }
  },
  setLastCpuDifficulty: async (difficulty) => {
    const current = get().profile;
    if (!current) {
      return;
    }

    const next: PerfilJugador = {
      ...current,
      preferencias: {
        ...current.preferencias,
        lastCpuDifficulty: difficulty,
      },
    };

    await persistProfile(next);
    try {
      await saveRemoteProfile(toRemoteProfile(next));
      set({ profile: next, error: null });
    } catch (error) {
      set({ profile: next, error: error instanceof Error ? error.message : "No se pudo guardar la preferencia." });
    }
  },
  incrementLocalMatches: async () => {
    const current = get().profile;
    if (!current) {
      return;
    }

    const next: PerfilJugador = {
      ...current,
      progreso: {
        localMatchesPlayed: current.progreso.localMatchesPlayed + 1,
      },
    };

    await persistProfile(next);
    try {
      await saveRemoteProfile(toRemoteProfile(next));
      set({ profile: next, error: null });
    } catch (error) {
      set({ profile: next, error: error instanceof Error ? error.message : "No se pudo actualizar el progreso." });
    }
  },
}));
