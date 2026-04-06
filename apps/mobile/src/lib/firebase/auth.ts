import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin, statusCodes, type SignInResponse } from "@react-native-google-signin/google-signin";
import {
  getAuth,
  GoogleAuthProvider,
  initializeAuth,
  linkWithCredential,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  type Auth,
  type Persistence,
  type User,
} from "firebase/auth";
import { getFirebaseApp, getGoogleClientConfig, isFirebaseConfigured } from "./config";

const reactNativeAsyncPersistence = {
  type: "LOCAL",
  async _isAvailable() {
    try {
      await AsyncStorage.setItem("__firebase_persistence_test__", "1");
      await AsyncStorage.removeItem("__firebase_persistence_test__");
      return true;
    } catch {
      return false;
    }
  },
  async _set(key: string, value: unknown) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async _get<T>(key: string) {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  },
  async _remove(key: string) {
    await AsyncStorage.removeItem(key);
  },
} as unknown as Persistence;

let authInstance: Auth | null = null;
let googleConfigured = false;

function ensureGoogleConfigured() {
  if (googleConfigured) {
    return;
  }

  const googleConfig = getGoogleClientConfig();
  GoogleSignin.configure({
    scopes: ["profile", "email"],
    webClientId: googleConfig.webClientId,
    offlineAccess: false,
  });
  googleConfigured = true;
}

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
    authInstance = initializeAuth(app, {
      persistence: reactNativeAsyncPersistence,
    });
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

export function getCurrentFirebaseUser(): User | null {
  const auth = getFirebaseAuth();
  return auth?.currentUser ?? null;
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

async function buildGoogleTokens() {
  ensureGoogleConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response: SignInResponse = await GoogleSignin.signIn();
  if (response.type === "cancelled") {
    return null;
  }

  const tokens = await GoogleSignin.getTokens();
  return {
    idToken: response.data.idToken ?? tokens.idToken ?? null,
    accessToken: tokens.accessToken ?? null,
  };
}

function mapGoogleError(error: unknown): Error {
  if (error instanceof Error) {
    const code = (error as Error & { code?: string }).code;

    if (code === statusCodes.SIGN_IN_CANCELLED) {
      return new Error("Se canceló el acceso con Google.");
    }
    if (code === statusCodes.IN_PROGRESS) {
      return new Error("Google ya está intentando abrir una sesión.");
    }
    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return new Error("Google Play Services no está disponible en este dispositivo.");
    }
    if (code === statusCodes.SIGN_IN_REQUIRED) {
      return new Error("Google pidió volver a elegir una cuenta para continuar.");
    }
  }

  return error instanceof Error ? error : new Error("No se pudo completar el acceso con Google.");
}

export async function signInWithGoogleTokens(args: {
  idToken?: string | null;
  accessToken?: string | null;
}): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return null;
  }

  if (!args.idToken && !args.accessToken) {
    throw new Error("Google no devolvió credenciales válidas.");
  }

  const credential = GoogleAuthProvider.credential(args.idToken ?? undefined, args.accessToken ?? undefined);

  if (auth.currentUser?.isAnonymous) {
    try {
      const result = await linkWithCredential(auth.currentUser, credential);
      return result.user;
    } catch {
      const result = await signInWithCredential(auth, credential);
      return result.user;
    }
  }

  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export async function signInWithGoogleNative(): Promise<User | null> {
  try {
    const tokens = await buildGoogleTokens();
    if (!tokens) {
      return null;
    }

    return await signInWithGoogleTokens(tokens);
  } catch (error) {
    throw mapGoogleError(error);
  }
}
