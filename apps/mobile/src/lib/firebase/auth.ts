import {
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirebaseApp, isFirebaseConfigured } from "./config";

let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (authInstance) {
    return authInstance;
  }

  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  try {
    authInstance = initializeAuth(app);
  } catch {
    authInstance = getAuth(app);
  }

  return authInstance;
}

export function observeAuthState(callback: (user: User | null) => void): (() => void) | null {
  const auth = getFirebaseAuth();
  if (!auth) {
    return null;
  }

  return onAuthStateChanged(auth, callback);
}

export async function ensureAnonymousAuth(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return null;
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  const result = await signInAnonymously(auth);
  return result.user;
}
