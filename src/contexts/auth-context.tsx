
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  login: (email: string, password: string) => Promise<{success: boolean, message?: string}>;
  signup: (data: SignUpData) => Promise<{success: boolean, message?: string}>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchAppUser = useCallback(async (email: string): Promise<AuthUser | null> => {
    if (!db || !email) return null;

    try {
      const merkezQuery = query(collection(db, "merkez-personnel"), where("email", "==", email));
      const tasraQuery = query(collection(db, "tasra-personnel"), where("email", "==", email));

      const [merkezSnapshot, tasraSnapshot] = await Promise.all([
        getDocs(merkezQuery),
        getDocs(tasraQuery)
      ]);
      
      let appUserData: Omit<Personnel, 'id'> | null = null;
      if (!merkezSnapshot.empty) {
        appUserData = merkezSnapshot.docs[0].data() as Omit<Personnel, 'id'>;
      } else if (!tasraSnapshot.empty) {
        appUserData = tasraSnapshot.docs[0].data() as Omit<Personnel, 'id'>;
      }

      if (appUserData) {
        return {
          registryNumber: appUserData.registryNumber,
          firstName: appUserData.firstName,
          lastName: appUserData.lastName,
          email: appUserData.email || '',
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching app user from Firestore:", error);
      return null; // Return null on error to indicate failure
    }
  }, []);

  useEffect(() => {
    // This listener handles session persistence on page refresh or initial load.
    if (!auth) {
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser?.email) {
        const appUser = await fetchAppUser(firebaseUser.email);
        if (appUser) {
          setUser(appUser);
        } else {
          // User exists in Firebase Auth but not in our DB. This is an invalid state.
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchAppUser]);

  useEffect(() => {
    // This is the single source of truth for redirection logic.
    if (loading) {
      return; // Do nothing until authentication state is fully resolved.
    }

    const isAuthPage = pathname === '/login';

    if (user && isAuthPage) {
      // User is logged in and on the login page -> redirect to dashboard.
      router.push('/');
    } else if (!user && !isAuthPage) {
      // User is not logged in and not on the login page -> redirect to login.
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  const login = useCallback(async (email: string, password: string): Promise<{success: boolean, message?: string}> => {
    if (!auth || !db) return { success: false, message: "Kimlik doğrulama sistemi başlatılamadı." };
    
    setLoading(true);
    try {
      // Step 1: Authenticate with Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
      
      // Step 2: Fetch app-specific user profile from Firestore AFTER successful auth
      const appUser = await fetchAppUser(email);

      if (appUser) {
        // Step 3: Set user state. The useEffect hook will handle the redirect.
        setUser(appUser);
        setLoading(false);
        return { success: true };
      } else {
        // Critical case: User authenticated with Firebase but has no profile in our DB.
        await signOut(auth); // Log them out immediately.
        setUser(null);
        setLoading(false);
        return { success: false, message: "Kimlik doğrulandı ancak sisteme kayıtlı personel profili bulunamadı." };
      }
    } catch (error: any) {
      let message = "Beklenmedik bir hata oluştu.";
       if (error.code === 'auth/invalid-credential') {
          message = "E-posta veya şifre hatalı.";
      }
      console.error("Login error:", error);
      setUser(null);
      setLoading(false);
      return { success: false, message };
    }
  }, [fetchAppUser]);
  
  const signup = useCallback(async (data: SignUpData): Promise<{success: boolean, message?: string}> => {
    if (!auth || !db) return { success: false, message: "Sistem başlatılamadı." };
    
    setLoading(true);
    try {
      // Check for duplicate registry number
      const merkezRegQuery = query(collection(db, "merkez-personnel"), where("registryNumber", "==", data.registryNumber));
      const tasraRegQuery = query(collection(db, "tasra-personnel"), where("registryNumber", "==", data.registryNumber));
      const [merkezRegSnapshot, tasraRegSnapshot] = await Promise.all([ getDocs(merkezRegQuery), getDocs(tasraRegQuery) ]);
      if (!merkezRegSnapshot.empty || !tasraRegSnapshot.empty) {
        setLoading(false);
        return { success: false, message: "Bu sicil numarası zaten sistemde kayıtlı." };
      }
      
      // Create user in Firebase Auth
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      const newPersonnelData = {
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
      };

      // Create user profile in Firestore
      await addDoc(collection(db, 'merkez-personnel'), newPersonnelData);

      // Set the user state immediately after successful signup
      setUser({
        registryNumber: newPersonnelData.registryNumber,
        firstName: newPersonnelData.firstName,
        lastName: newPersonnelData.lastName,
        email: newPersonnelData.email,
      });
      
      setLoading(false);
      return { success: true };
    } catch (error: any) {
      let message = "Kayıt sırasında bir hata oluştu.";
      if (error.code === 'auth/email-already-in-use') {
        message = "Bu e-posta adresi zaten kullanılıyor.";
      } else if (error.code === 'auth/weak-password') {
          message = "Şifre en az 6 karakter olmalıdır.";
      }
      console.error("Signup error:", error);
      setUser(null);
      setLoading(false);
      return { success: false, message };
    }
  }, []);

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    // The useEffect hook will redirect to /login because user is now null.
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
