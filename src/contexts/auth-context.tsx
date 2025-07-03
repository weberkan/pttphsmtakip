
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import type { Personnel } from '@/lib/types';

export interface AuthUser {
  registryNumber: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  registryNumber: string;
  status: 'İHS' | '399';
  unvan?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (registryNumber: string, password: string) => Promise<boolean>;
  signup: (data: SignUpData) => Promise<{success: boolean, message?: string}>;
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
            setUser(null);
            if (auth) {
                signOut(auth);
            }
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

    const q = query(collection(db, "merkez-personnel"), where("registryNumber", "==", registryNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0].data();
      const userEmail = userDoc.email;

      if (userEmail) {
        try {
          await signInWithEmailAndPassword(auth, userEmail, password);
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

  const signup = useCallback(async (data: SignUpData): Promise<{success: boolean, message?: string}> => {
    if (!auth || !db) {
      const message = "Auth/DB service is not available. Check Firebase configuration.";
      console.error(message);
      return { success: false, message };
    }

    const q = query(collection(db, "merkez-personnel"), where("registryNumber", "==", data.registryNumber));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { success: false, message: "Bu sicil numarası zaten kayıtlı." };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      await addDoc(collection(db, 'merkez-personnel'), {
        firstName: data.firstName,
        lastName: data.lastName,
        registryNumber: data.registryNumber,
        email: data.email,
        status: data.status,
        unvan: data.unvan || null,
        lastModifiedBy: data.registryNumber,
        lastModifiedAt: Timestamp.now(),
        photoUrl: null,
        phone: null,
        dateOfBirth: null,
      });
      
      return { success: true };

    } catch (error: any) {
      console.error("Firebase signup error:", error);
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: "Bu e-posta adresi zaten kullanılıyor." };
      }
      if (error.code === 'auth/weak-password') {
          return { success: false, message: "Şifre en az 6 karakter olmalıdır." };
      }
      return { success: false, message: "Kayıt sırasında bir hata oluştu." };
    }
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
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
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
