import { auth, db, googleProvider } from "@/lib/firebase";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

import { PlanType } from "@/constants/plans";

interface UserProfile {
  username: string;
  email: string;
  tokens: number;
  plan: PlanType;
}

interface AuthContextType {
  user: (FirebaseUser & { profile?: UserProfile; plan?: PlanType }) | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<
    (FirebaseUser & { profile?: UserProfile }) | null
  >(null);
  const [isReady, setIsReady] = useState(false);

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
      console.error("Auth not configured");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
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
        logout,
        isLoggedIn: !!user,
        isReady,
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
