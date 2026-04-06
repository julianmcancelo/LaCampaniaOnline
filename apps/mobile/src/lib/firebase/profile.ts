import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirebaseApp, isFirebaseConfigured } from "./config";
import type { AvatarKind, } from "../profile-avatar";

export interface PerfilJugadorRemoto {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  avatarKind: AvatarKind;
  crestId?: string;
  isAnonymous: boolean;
  perfilCompleto: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  lastSeenAt?: unknown;
  preferencias: {
    lastCpuDifficulty: "recluta" | "capitan" | "general";
    phoneOrientationPreference: "portrait" | "landscape" | "auto";
  };
  progreso: {
    localMatchesPlayed: number;
    localWins: number;
    localLosses: number;
    onlineMatchesPlayed: number;
    onlineWins: number;
    onlineLosses: number;
    puntos: number;
    highestCpuDifficultyWon: "recluta" | "capitan" | "general" | null;
    winStreak: number;
  };
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  avatarKind: AvatarKind;
  crestId?: string;
  puntos: number;
  updatedAt?: unknown;
}

function getDb() {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
}

function definedEntries<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>;
}

export async function loadRemoteProfile(uid: string): Promise<PerfilJugadorRemoto | null> {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const db = getDb();
  if (!db) {
    return null;
  }

  const snapshot = await getDoc(doc(db, "players", uid));
  return snapshot.exists() ? (snapshot.data() as PerfilJugadorRemoto) : null;
}

export async function saveRemoteProfile(profile: PerfilJugadorRemoto): Promise<void> {
  if (!isFirebaseConfigured()) {
    return;
  }

  const db = getDb();
  if (!db) {
    return;
  }

  const profileRef = doc(db, "players", profile.uid);
  const existing = await getDoc(profileRef);
  const existingData = existing.data() as Partial<PerfilJugadorRemoto> | undefined;
  const createdAtValue = existing.exists() ? (existingData?.createdAt ?? serverTimestamp()) : serverTimestamp();
  const payload = {
    ...definedEntries({
      uid: profile.uid,
      displayName: profile.displayName,
      photoURL: profile.photoURL ?? null,
      avatarKind: profile.avatarKind,
      crestId: profile.crestId,
      isAnonymous: profile.isAnonymous,
      perfilCompleto: profile.perfilCompleto,
      preferencias: profile.preferencias,
      progreso: profile.progreso,
    }),
    createdAt: createdAtValue,
    updatedAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
  };

  await setDoc(profileRef, payload, { merge: true });
}

export async function saveLeaderboardEntry(entry: LeaderboardEntry): Promise<void> {
  if (!isFirebaseConfigured()) {
    return;
  }

  const db = getDb();
  if (!db) {
    return;
  }

  const payload = {
    ...definedEntries({
      uid: entry.uid,
      displayName: entry.displayName,
      photoURL: entry.photoURL ?? null,
      avatarKind: entry.avatarKind,
      crestId: entry.crestId,
      puntos: entry.puntos,
    }),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "leaderboard", entry.uid), payload, { merge: true });
}

export async function loadLeaderboard(limitCount = 20): Promise<LeaderboardEntry[]> {
  if (!isFirebaseConfigured()) {
    return [];
  }

  const db = getDb();
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, "leaderboard"), orderBy("puntos", "desc"), limit(limitCount)));
  return snapshot.docs.map((item) => item.data() as LeaderboardEntry);
}
