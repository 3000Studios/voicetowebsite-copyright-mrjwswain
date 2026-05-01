import { auth, db, githubProvider, googleProvider } from "@/lib/firebase";
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

import { PlanType } from "@/constants/plans";

interface UserProfile {
  username: string;
  email: string;
  phone?: string;
  tokens: number;
  plan: PlanType;
}

interface AuthContextType {
  user: (FirebaseUser & { profile?: UserProfile; plan?: PlanType }) | null;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (payload: {
    email: string;
    password: string;
    phone: string;
    username: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  isReady: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<
    (FirebaseUser & { profile?: UserProfile }) | null
  >(null);
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Skip auth setup if Firebase is not configured
    if (!auth || !db) {
      console.warn("Auth disabled - Firebase not configured");
      setIsReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch or create user profile in Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        let profile: UserProfile;
        if (userDoc.exists()) {
          profile = userDoc.data() as UserProfile;
        } else {
          profile = {
            username: firebaseUser.displayName || "Neural_Architect",
            email: firebaseUser.email || "",
            tokens: 50,
            plan: "free",
          };
          await setDoc(userRef, {
            ...profile,
            createdAt: serverTimestamp(),
          });
        }

        setUser({ ...firebaseUser, profile, plan: profile.plan } as any);
      } else {
        setUser(null);
      }
      setIsReady(true);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) {
      setAuthError("Google sign-in is not configured yet.");
      return;
    }
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setAuthError("Google sign-in failed. Check Firebase OAuth settings.");
    }
  };

  const loginWithGithub = async () => {
    if (!auth || !githubProvider) {
      setAuthError("GitHub sign-in is not configured yet.");
      return;
    }
    try {
      setAuthError(null);
      await signInWithPopup(auth, githubProvider);
    } catch (error: any) {
      if (error?.code === "auth/account-exists-with-different-credential") {
        setAuthError(
          "An account already exists with another provider. Sign in with that provider first.",
        );
        return;
      }
      setAuthError("GitHub sign-in failed. Check Firebase OAuth settings.");
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    if (!auth) {
      setAuthError("Email sign-in is not configured yet.");
      return;
    }
    try {
      setAuthError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setAuthError("Email sign-in failed. Check your email and password.");
    }
  };

  const registerWithEmail = async (payload: {
    email: string;
    password: string;
    phone: string;
    username: string;
  }) => {
    if (!auth || !db) {
      setAuthError("Account creation is not configured yet.");
      return;
    }
    try {
      setAuthError(null);
      const credential = await createUserWithEmailAndPassword(
        auth,
        payload.email,
        payload.password,
      );
      await updateProfile(credential.user, { displayName: payload.username });
      const userRef = doc(db, "users", credential.user.uid);
      await setDoc(
        userRef,
        {
          username: payload.username.trim(),
          email: payload.email.trim().toLowerCase(),
          phone: payload.phone.trim(),
          tokens: 50,
          plan: "free",
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (error: any) {
      if (error?.code === "auth/email-already-in-use") {
        setAuthError("Email is already in use. Please sign in instead.");
        return;
      }
      if (error?.code === "auth/weak-password") {
        setAuthError("Password is too weak. Use at least 6 characters.");
        return;
      }
      setAuthError("Account creation failed. Please try again.");
    }
  };

  const logout = async () => {
    if (!auth) {
      console.error("Auth not configured");
      return;
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loginWithGoogle,
        loginWithGithub,
        loginWithEmail,
        registerWithEmail,
        logout,
        isLoggedIn: !!user,
        isReady,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
