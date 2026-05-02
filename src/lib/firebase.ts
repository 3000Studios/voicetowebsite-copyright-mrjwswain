import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if config is provided
const isConfigured = 
  !!firebaseConfig.apiKey && 
  !!firebaseConfig.projectId && 
  firebaseConfig.apiKey !== "";

export const app = isConfigured && !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export const signInWithGoogle = async () => {
  if (!auth) throw new Error("Firebase Auth is not initialized");
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const logOut = async () => {
  if (!auth) throw new Error("Firebase Auth is not initialized");
  return signOut(auth);
};
