import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
} from "firebase/auth";
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
  !!firebaseConfig.appId &&
  firebaseConfig.apiKey !== "";

export const app = isConfigured && !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export const handleFirestoreError = (error: unknown, action: string, resource: string) => {
  console.error(`Firestore ${action} failed for ${resource}:`, error);
};

export const signInWithGoogle = async () => {
  if (!auth) throw new Error("Firebase Auth is not initialized");
  return signInWithPopup(auth, googleProvider);
};

export const logOut = async () => {
  if (!auth) throw new Error("Firebase Auth is not initialized");
  return signOut(auth);
};

// --- Passwordless email-link auth ---
// Stored on the device so we can complete sign-in after the user clicks the
// link in their inbox (they may open it in a different tab/window).
const EMAIL_LINK_KEY = "vtw.emailForSignIn";

export const sendMagicLink = async (email: string, redirectPath: string = "/dashboard") => {
  if (!auth) throw new Error("Firebase Auth is not initialized");
  const origin = typeof window !== "undefined" ? window.location.origin : "https://voicetowebsite.com";
  await sendSignInLinkToEmail(auth, email, {
    url: `${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
    handleCodeInApp: true,
  });
  if (typeof window !== "undefined") {
    window.localStorage.setItem(EMAIL_LINK_KEY, email);
  }
};

export const completeMagicLinkSignIn = async (url?: string) => {
  if (!auth) throw new Error("Firebase Auth is not initialized");
  const href = url || (typeof window !== "undefined" ? window.location.href : "");
  if (!isSignInWithEmailLink(auth, href)) return null;
  let email = typeof window !== "undefined" ? window.localStorage.getItem(EMAIL_LINK_KEY) : null;
  if (!email && typeof window !== "undefined") {
    email = window.prompt("Confirm the email you used to sign in") || "";
  }
  if (!email) throw new Error("No email provided to complete sign-in");
  const result = await signInWithEmailLink(auth, email, href);
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(EMAIL_LINK_KEY);
  }
  return result;
};

export const isMagicLinkUrl = (url?: string) => {
  if (!auth) return false;
  return isSignInWithEmailLink(auth, url || (typeof window !== "undefined" ? window.location.href : ""));
};
