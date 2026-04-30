import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';

import { PlanType } from '@/constants/plans';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(FirebaseUser & { profile?: UserProfile }) | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch or create user profile in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        
        let profile: UserProfile;
        if (userDoc.exists()) {
          profile = userDoc.data() as UserProfile;
        } else {
          profile = {
            username: firebaseUser.displayName || 'Neural_Architect',
            email: firebaseUser.email || '',
            tokens: 50,
            plan: 'free'
          };
          await setDoc(userRef, {
            ...profile,
            createdAt: serverTimestamp()
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
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loginWithGoogle, 
      logout, 
      isLoggedIn: !!user,
      isReady 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
