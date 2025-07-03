
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Personnel } from '@/lib/types';

export interface AuthUser {
  registryNumber: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (registryNumber: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && firebaseUser.email) {
        // Query firestore to get the full user details.
        const q = query(collection(db, "merkez-personnel"), where("email", "==", firebaseUser.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const appUserDoc = querySnapshot.docs[0];
            const appUserData = appUserDoc.data() as Omit<Personnel, 'id'>;
            setUser({
              registryNumber: appUserData.registryNumber,
              firstName: appUserData.firstName,
              lastName: appUserData.lastName,
              email: appUserData.email || '',
            });
        } else {
            // This case can happen if the user was deleted from our DB but still has a valid Firebase session.
            setUser(null);
            signOut(auth);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (registryNumber: string, password: string): Promise<boolean> => {
    if (!auth || !db) {
        console.error("Auth/DB service is not available. Check Firebase configuration.");
        return false;
    }

    // Query firestore to find user by registry number.
    const q = query(collection(db, "merkez-personnel"), where("registryNumber", "==", registryNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0].data();
      const userEmail = userDoc.email;

      if (userEmail) {
        try {
          await signInWithEmailAndPassword(auth, userEmail, password);
          // The onAuthStateChanged listener will handle setting the user state.
          return true;
        } catch (error) {
          console.error("Firebase login error:", error);
          return false;
        }
      }
    }
    
    console.error(`Login failed: No user found with registry number: ${registryNumber}`);
    return false;
  }, []);

  const logout = useCallback(async () => {
    if (!auth) {
      console.error("Auth service is not available. Check Firebase configuration.");
      router.push('/login');
      return;
    }
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Firebase logout error:", error);
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
