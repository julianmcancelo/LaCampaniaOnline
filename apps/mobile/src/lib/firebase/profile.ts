import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirebaseApp, isFirebaseConfigured } from "./config";

export interface PerfilJugadorRemoto {
  uid: string;
  displayName: string;
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
    puntos: number;
  };
}

function getDb() {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
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

  await setDoc(
    doc(db, "players", profile.uid),
    {
      ...profile,
      updatedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}
