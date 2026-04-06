import { getApps, initializeApp, type FirebaseApp } from "firebase/app";

const firebaseFallbackConfig = {
  apiKey: "AIzaSyAuZuuS8Gl-pkFZWhFc2r2nsTS9A4AjyYo",
  authDomain: "juegoonl.firebaseapp.com",
  projectId: "juegoonl",
  storageBucket: "juegoonl.firebasestorage.app",
  messagingSenderId: "556271006135",
  appId: "1:556271006135:android:6a38ee36a1a498c3263832",
};

const googleClientFallbackConfig = {
  androidClientId: "556271006135-mt0vj6ka6qanjei6gub0hqshc3kde097.apps.googleusercontent.com",
  webClientId: "556271006135-tfo33337ras6ne16fimc11om512mcoch.apps.googleusercontent.com",
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? firebaseFallbackConfig.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? firebaseFallbackConfig.authDomain,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? firebaseFallbackConfig.projectId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? firebaseFallbackConfig.storageBucket,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? firebaseFallbackConfig.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? firebaseFallbackConfig.appId,
};

const googleClientConfig = {
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? googleClientFallbackConfig.androidClientId,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? googleClientFallbackConfig.webClientId,
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

export function getGoogleClientConfig() {
  return googleClientConfig;
}
