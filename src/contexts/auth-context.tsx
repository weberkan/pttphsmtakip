
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { USERS } from '@/lib/auth-data';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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

// Note: We are not storing the user in localStorage anymore as Firebase handles session persistence.
// This simplifies state management and improves security.

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && firebaseUser.email) {
        // Find the corresponding user in our hardcoded list to get full details
        const appUser = USERS.find(u => u.email === firebaseUser.email);
        if (appUser) {
          setUser({
            registryNumber: appUser.registryNumber,
            firstName: appUser.firstName,
            lastName: appUser.lastName,
            email: appUser.email
          });
        } else {
            // This case might happen if a user was deleted from our auth-data.ts but still has a valid Firebase session.
            setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (registryNumber: string, password: string): Promise<boolean> => {
    if (!auth) {
        console.error("Auth service is not available. Check Firebase configuration.");
        return false;
    }

    const foundUser = USERS.find(
      (u) => u.registryNumber === registryNumber && u.password === password
    );

    if (foundUser && foundUser.email) {
      try {
        await signInWithEmailAndPassword(auth, foundUser.email, password);
        // The onAuthStateChanged listener will handle setting the user state.
        return true;
      } catch (error) {
        console.error("Firebase login error:", error);
        return false;
      }
    }
    
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
      // The onAuthStateChanged listener will handle setting user to null.
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
