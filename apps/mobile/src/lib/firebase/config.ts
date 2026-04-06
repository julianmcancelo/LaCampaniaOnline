import { getApps, initializeApp, type FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function hasMinimalConfig(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

let cachedApp: FirebaseApp | null = null;

export function isFirebaseConfigured(): boolean {
  return hasMinimalConfig();
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!hasMinimalConfig()) {
    return null;
  }

  if (cachedApp) {
    return cachedApp;
  }

  cachedApp = getApps()[0] ?? initializeApp(firebaseConfig);
  return cachedApp;
}
