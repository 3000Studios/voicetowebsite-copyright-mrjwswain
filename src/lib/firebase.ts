import type { FirebaseOptions } from "firebase/app";
import { initializeApp } from "firebase/app";
import { getAuth, GithubAuthProvider, GoogleAuthProvider } from "firebase/auth";
import { doc, getDocFromServer, getFirestore } from "firebase/firestore";

type FirebaseConfigWithDb = FirebaseOptions & { firestoreDatabaseId?: string };

const firebaseConfig: FirebaseConfigWithDb = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID,
};

// Check if Firebase config is valid
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let githubProvider: GithubAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    githubProvider = new GithubAuthProvider();
    db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn(
    "Firebase not configured - auth and database features will be disabled",
  );
}

export { auth, db, googleProvider, githubProvider };

/**
 * Validates connection to Firestore as per instructions
 */
async function testConnection() {
  if (!db) {
    console.warn("Firestore not initialized - skipping connection test");
    return;
  }
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.error(
        "Please check your Firebase configuration or connectivity.",
      );
    }
  }
}

// Only test connection if Firebase is configured
if (isFirebaseConfigured) {
  testConnection();
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: "create" | "update" | "delete" | "list" | "get" | "write";
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string }[];
  };
}

export const handleFirestoreError = (
  error: any,
  operationType: FirestoreErrorInfo["operationType"],
  path: string | null = null,
) => {
  if (error.code === "permission-denied") {
    const user = auth?.currentUser;
    const errorInfo: FirestoreErrorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: {
        userId: user?.uid || "anonymous",
        email: user?.email || "none",
        emailVerified: user?.emailVerified || false,
        isAnonymous: user?.isAnonymous || true,
        providerInfo:
          user?.providerData.map((p) => ({
            providerId: p.providerId,
            displayName: p.displayName || "",
            email: p.email || "",
          })) || [],
      },
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
};
