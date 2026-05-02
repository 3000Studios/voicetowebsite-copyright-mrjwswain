import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  role: string;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, role: "user", loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // Attempt to get user doc
        const userRef = doc(db!, "users", u.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setRole(snap.data().role || "user");
        } else {
          // Create basic user doc
          const newRole = u.email === import.meta.env.VITE_OWNER_ADMIN_EMAIL ? "admin" : "user";
          await setDoc(userRef, {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            role: newRole,
            plan: "Free",
            commandsUsedThisCycle: 0,
            commandsLimit: 3,
            createdAt: new Date().toISOString()
          }, { merge: true });
          setRole(newRole);
        }
      } else {
        setRole("user");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, role, loading }}>{children}</AuthContext.Provider>;
};
