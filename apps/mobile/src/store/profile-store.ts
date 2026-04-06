import { create } from "zustand";
import type { User } from "firebase/auth";
import { buildCrestId, type AvatarKind } from "../lib/profile-avatar";
import { ensureAnonymousAuth, getCurrentFirebaseUser, signInWithGoogleNative } from "../lib/firebase/auth";
import { loadLeaderboard, loadRemoteProfile, saveLeaderboardEntry, saveRemoteProfile, type LeaderboardEntry, type PerfilJugadorRemoto } from "../lib/firebase/profile";
import { loadJson, saveJson, STORAGE_KEYS } from "../lib/storage";

export type DificultadLocal = "recluta" | "capitan" | "general";
export type PreferenciaOrientacionCelular = "portrait" | "landscape" | "auto";

const LIMITE_PARTIDAS_ANONIMAS = 4;

export interface PerfilJugador {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  avatarKind: AvatarKind;
  crestId?: string;
  isAnonymous: boolean;
  perfilCompleto: boolean;
  preferencias: {
    lastCpuDifficulty: DificultadLocal;
    phoneOrientationPreference: PreferenciaOrientacionCelular;
  };
  progreso: {
    localMatchesPlayed: number;
    localWins: number;
    localLosses: number;
    onlineMatchesPlayed: number;
    onlineWins: number;
    onlineLosses: number;
    puntos: number;
    highestCpuDifficultyWon: DificultadLocal | null;
    winStreak: number;
  };
}

type AuthStatus = "loading" | "signed-out" | "authenticated";

interface ProfileStore {
  hydrated: boolean;
  authStatus: AuthStatus;
  profile: PerfilJugador | null;
  leaderboard: LeaderboardEntry[];
  error: string | null;
  initialize: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshLeaderboard: () => Promise<void>;
  saveDisplayName: (displayName: string) => Promise<void>;
  setLastCpuDifficulty: (difficulty: DificultadLocal) => Promise<void>;
  setPhoneOrientationPreference: (orientation: PreferenciaOrientacionCelular) => Promise<void>;
  recordLocalMatch: (result: "win" | "loss", difficulty: DificultadLocal) => Promise<void>;
  recordOnlineMatch: (result: "win" | "loss") => Promise<void>;
}

function puntosPorVictoriaLocal(difficulty: DificultadLocal) {
  switch (difficulty) {
    case "recluta":
      return 10;
    case "capitan":
      return 20;
    case "general":
      return 35;
  }
}

function maxDifficulty(a: DificultadLocal | null, b: DificultadLocal): DificultadLocal {
  const order: DificultadLocal[] = ["recluta", "capitan", "general"];
  if (!a) return b;
  return order.indexOf(b) > order.indexOf(a) ? b : a;
}

function totalMatches(profile: PerfilJugador | null) {
  if (!profile) return 0;
  return profile.progreso.localMatchesPlayed + profile.progreso.onlineMatchesPlayed;
}

function avatarFromSources(args: { uid: string; displayName: string; photoURL?: string | null }) {
  const trimmedName = args.displayName.trim();
  const seed = args.uid || trimmedName || "viajero";
  const crestId = buildCrestId(seed);
  const photoURL = args.photoURL?.trim() ? args.photoURL.trim() : null;
  return {
    photoURL,
    avatarKind: photoURL ? ("google" as const) : ("crest" as const),
    crestId,
  };
}

export function reachedAnonymousLimit(profile: PerfilJugador | null) {
  return Boolean(profile?.isAnonymous && totalMatches(profile) >= LIMITE_PARTIDAS_ANONIMAS);
}

function describeSyncError(fallback: string, error: unknown): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const normalized = error.message.toLowerCase();
  if (
    normalized.includes("unsupported field value") ||
    normalized.includes("invalid data") ||
    normalized.includes("function setdoc")
  ) {
    return "No se pudo sincronizar tu perfil con la nube. Proba de nuevo en unos segundos.";
  }

  return fallback;
}

async function persistProfile(profile: PerfilJugador): Promise<void> {
  await saveJson(STORAGE_KEYS.profile, profile);
}

function toRemoteProfile(profile: PerfilJugador): PerfilJugadorRemoto {
  return {
    uid: profile.uid,
    displayName: profile.displayName,
    photoURL: profile.photoURL ?? null,
    avatarKind: profile.avatarKind,
    crestId: profile.crestId,
    isAnonymous: profile.isAnonymous,
    perfilCompleto: profile.perfilCompleto,
    preferencias: profile.preferencias,
    progreso: profile.progreso,
  };
}

function toLeaderboardEntry(profile: PerfilJugador): LeaderboardEntry {
  return {
    uid: profile.uid,
    displayName: profile.displayName,
    photoURL: profile.photoURL ?? null,
    avatarKind: profile.avatarKind,
    crestId: profile.crestId,
    puntos: profile.progreso.puntos,
  };
}

function mergeProfile(user: User, localProfile: PerfilJugador | null, remote: PerfilJugadorRemoto | null): PerfilJugador {
  const displayName = remote?.displayName ?? user.displayName ?? localProfile?.displayName ?? "";
  const photoURL = remote?.photoURL ?? user.photoURL ?? localProfile?.photoURL ?? null;
  const avatar = avatarFromSources({
    uid: user.uid,
    displayName,
    photoURL,
  });

  return {
    uid: user.uid,
    displayName,
    photoURL: avatar.photoURL,
    avatarKind: remote?.avatarKind ?? localProfile?.avatarKind ?? avatar.avatarKind,
    crestId: remote?.crestId ?? localProfile?.crestId ?? avatar.crestId,
    isAnonymous: user.isAnonymous,
    perfilCompleto: remote?.perfilCompleto ?? Boolean(displayName.trim()),
    preferencias: {
      lastCpuDifficulty: remote?.preferencias?.lastCpuDifficulty ?? localProfile?.preferencias.lastCpuDifficulty ?? "capitan",
      phoneOrientationPreference:
        remote?.preferencias?.phoneOrientationPreference ?? localProfile?.preferencias.phoneOrientationPreference ?? "portrait",
    },
    progreso: {
      localMatchesPlayed: remote?.progreso?.localMatchesPlayed ?? localProfile?.progreso.localMatchesPlayed ?? 0,
      localWins: remote?.progreso?.localWins ?? localProfile?.progreso.localWins ?? 0,
      localLosses: remote?.progreso?.localLosses ?? localProfile?.progreso.localLosses ?? 0,
      onlineMatchesPlayed: remote?.progreso?.onlineMatchesPlayed ?? localProfile?.progreso.onlineMatchesPlayed ?? 0,
      onlineWins: remote?.progreso?.onlineWins ?? localProfile?.progreso.onlineWins ?? 0,
      onlineLosses: remote?.progreso?.onlineLosses ?? localProfile?.progreso.onlineLosses ?? 0,
      puntos: remote?.progreso?.puntos ?? localProfile?.progreso.puntos ?? 0,
      highestCpuDifficultyWon: remote?.progreso?.highestCpuDifficultyWon ?? localProfile?.progreso.highestCpuDifficultyWon ?? null,
      winStreak: remote?.progreso?.winStreak ?? localProfile?.progreso.winStreak ?? 0,
    },
  };
}

async function syncSignedInUser(user: User, localProfile: PerfilJugador | null): Promise<PerfilJugador> {
  const remote = await loadRemoteProfile(user.uid);
  const next = mergeProfile(user, localProfile, remote);
  await persistProfile(next);
  await saveRemoteProfile(toRemoteProfile(next));
  await saveLeaderboardEntry(toLeaderboardEntry(next));
  return next;
}

async function commitProfile(next: PerfilJugador): Promise<void> {
  await persistProfile(next);
  await saveRemoteProfile(toRemoteProfile(next));
  await saveLeaderboardEntry(toLeaderboardEntry(next));
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  hydrated: false,
  authStatus: "loading",
  profile: null,
  leaderboard: [],
  error: null,
  initialize: async () => {
    if (get().hydrated) {
      return;
    }

    const localProfile = await loadJson<PerfilJugador>(STORAGE_KEYS.profile);

    try {
      const [user, leaderboard] = [getCurrentFirebaseUser(), await loadLeaderboard(15)];
      if (user) {
        const profile = await syncSignedInUser(user, localProfile);
        set({
          hydrated: true,
          authStatus: "authenticated",
          profile,
          leaderboard,
          error: null,
        });
        return;
      }

      set({
        hydrated: true,
        authStatus: "signed-out",
        profile: localProfile,
        leaderboard,
        error: null,
      });
    } catch (error) {
      set({
        hydrated: true,
        authStatus: "signed-out",
        profile: localProfile,
        error: error instanceof Error ? error.message : "No se pudo preparar el acceso.",
      });
    }
  },
  continueAsGuest: async () => {
    if (reachedAnonymousLimit(get().profile)) {
      set({ error: "Ya usaste tus 4 partidas de invitado. Entrá con Google para seguir." });
      return;
    }

    const currentLocal = get().profile;
    try {
      const user = await ensureAnonymousAuth();
      if (!user) {
        throw new Error("No se pudo crear la sesión anónima.");
      }

      const profile = await syncSignedInUser(user, currentLocal);
      const leaderboard = await loadLeaderboard(15);
      set({
        authStatus: "authenticated",
        profile,
        leaderboard,
        error: null,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "No se pudo entrar como invitado." });
    }
  },
  signInWithGoogle: async () => {
    try {
      const currentLocal = get().profile;
      const user = await signInWithGoogleNative();
      if (!user) {
        throw new Error("No se pudo iniciar sesión con Google.");
      }

      const profile = await syncSignedInUser(user, currentLocal);
      const leaderboard = await loadLeaderboard(15);
      set({
        authStatus: "authenticated",
        profile,
        leaderboard,
        error: null,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "No se pudo iniciar sesión con Google." });
    }
  },
  refreshLeaderboard: async () => {
    try {
      const leaderboard = await loadLeaderboard(15);
      set({ leaderboard });
    } catch {
      // keep stale leaderboard if network is unavailable
    }
  },
  saveDisplayName: async (displayName) => {
    const current = get().profile;
    if (!current) {
      return;
    }

    const trimmed = displayName.trim();
    const avatar = avatarFromSources({
      uid: current.uid,
      displayName: trimmed,
      photoURL: current.photoURL,
    });
    const next: PerfilJugador = {
      ...current,
      displayName: trimmed,
      photoURL: avatar.photoURL,
      avatarKind: avatar.avatarKind,
      crestId: current.crestId ?? avatar.crestId,
      perfilCompleto: Boolean(trimmed),
    };

    await persistProfile(next);
    try {
      await saveRemoteProfile(toRemoteProfile(next));
      await saveLeaderboardEntry(toLeaderboardEntry(next));
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
  setPhoneOrientationPreference: async (orientation) => {
    const current = get().profile;
    if (!current) {
      return;
    }

    const next: PerfilJugador = {
      ...current,
      preferencias: {
        ...current.preferencias,
        phoneOrientationPreference: orientation,
      },
    };

    await persistProfile(next);
    try {
      await saveRemoteProfile(toRemoteProfile(next));
      set({ profile: next, error: null });
    } catch (error) {
      set({ profile: next, error: error instanceof Error ? error.message : "No se pudo guardar la orientación." });
    }
  },
  recordLocalMatch: async (result, difficulty) => {
    const current = get().profile;
    if (!current) {
      return;
    }

    const won = result === "win";
    const next: PerfilJugador = {
      ...current,
      progreso: {
        localMatchesPlayed: current.progreso.localMatchesPlayed + 1,
        localWins: current.progreso.localWins + (won ? 1 : 0),
        localLosses: current.progreso.localLosses + (won ? 0 : 1),
        onlineMatchesPlayed: current.progreso.onlineMatchesPlayed,
        onlineWins: current.progreso.onlineWins,
        onlineLosses: current.progreso.onlineLosses,
        puntos: current.progreso.puntos + (won ? puntosPorVictoriaLocal(difficulty) : 0),
        highestCpuDifficultyWon: won ? maxDifficulty(current.progreso.highestCpuDifficultyWon, difficulty) : current.progreso.highestCpuDifficultyWon,
        winStreak: won ? current.progreso.winStreak + 1 : 0,
      },
    };

    try {
      await commitProfile(next);
      set({ profile: next, leaderboard: await loadLeaderboard(15), error: null });
    } catch (error) {
      await persistProfile(next);
      set({ profile: next, error: error instanceof Error ? error.message : "No se pudo actualizar el progreso." });
    }
  },
  recordOnlineMatch: async (result) => {
    const current = get().profile;
    if (!current) {
      return;
    }

    const won = result === "win";
    const next: PerfilJugador = {
      ...current,
      progreso: {
        localMatchesPlayed: current.progreso.localMatchesPlayed,
        localWins: current.progreso.localWins,
        localLosses: current.progreso.localLosses,
        onlineMatchesPlayed: current.progreso.onlineMatchesPlayed + 1,
        onlineWins: current.progreso.onlineWins + (won ? 1 : 0),
        onlineLosses: current.progreso.onlineLosses + (won ? 0 : 1),
        puntos: current.progreso.puntos + (won ? 50 : 0),
        highestCpuDifficultyWon: current.progreso.highestCpuDifficultyWon,
        winStreak: won ? current.progreso.winStreak + 1 : 0,
      },
    };

    try {
      await commitProfile(next);
      set({ profile: next, leaderboard: await loadLeaderboard(15), error: null });
    } catch (error) {
      await persistProfile(next);
      set({ profile: next, error: error instanceof Error ? error.message : "No se pudo actualizar el progreso online." });
    }
  },
}));
