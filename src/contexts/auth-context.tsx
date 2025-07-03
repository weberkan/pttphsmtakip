
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface AuthUser {
  uid: string;
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
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{success: boolean, message?: string}>;
  signup: (data: SignUpData) => Promise<{success: boolean, message?: string}>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserProfile = useCallback(async (firebaseUser: FirebaseUser): Promise<AuthUser | null> => {
    if (!db || !firebaseUser) return null;

    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          firstName: userData.firstName,
          lastName: userData.lastName,
          registryNumber: userData.registryNumber,
        };
      }
      console.warn(`No profile document found in 'users' collection for UID: ${firebaseUser.uid}. This can happen if signup was interrupted.`);
      return null;
    } catch (error) {
      console.error("Error fetching user profile from Firestore:", error);
      return null;
    }
  }, []);
  
  // onAuthStateChanged is the single source of truth for the user's auth state.
  // It runs on initial load, and whenever a user signs in or out.
  useEffect(() => {
    if (!auth) {
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const userProfile = await fetchUserProfile(firebaseUser);
        if (userProfile) {
          setUser(userProfile);
        } else {
          // If a user is authenticated in Firebase Auth but has no profile
          // document in Firestore, we sign them out to prevent a broken state.
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);


  // This useEffect handles all redirection logic based on the auth state.
  useEffect(() => {
    if (loading) {
      return; // Wait until loading is complete before deciding where to redirect.
    }

    const isAuthPage = pathname === '/login';

    if (user && isAuthPage) {
      router.push('/');
    } else if (!user && !isAuthPage) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);


  const login = async (email: string, password: string): Promise<{success: boolean, message?: string}> => {
    if (!auth) return { success: false, message: "Kimlik doğrulama sistemi başlatılamadı." };
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Success. The onAuthStateChanged listener will now handle fetching the user profile
      // and updating the state, which will trigger the redirection useEffect.
      return { success: true };
    } catch (error: any) {
      let message = "Beklenmedik bir hata oluştu.";
       if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          message = "E-posta veya şifre hatalı.";
      }
      console.error("Login error:", error.code);
      return { success: false, message };
    }
  };
  
  const signup = async (data: SignUpData): Promise<{success: boolean, message?: string}> => {
    if (!auth || !db) return { success: false, message: "Sistem başlatılamadı." };
    
    try {
      // Step 1: Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      
      // Step 2: Create the user profile document in the 'users' collection in Firestore
      const newUserProfile: Omit<AuthUser, 'uid' | 'email'> = {
        firstName: data.firstName,
        lastName: data.lastName,
        registryNumber: data.registryNumber,
      };
      
      await setDoc(doc(db, "users", firebaseUser.uid), newUserProfile);
      
      // Success. The onAuthStateChanged listener will now pick up the new authenticated user,
      // fetch their newly created profile, and update the state.
      return { success: true };

    } catch (error: any) {
      let message = "Kayıt sırasında bir hata oluştu.";
      if (error.code === 'auth/email-already-in-use') {
        message = "Bu e-posta adresi zaten kullanılıyor.";
      } else if (error.code === 'auth/weak-password') {
          message = "Şifre en az 6 karakter olmalıdır.";
      }
      console.error("Signup error:", error);
      return { success: false, message };
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    // The onAuthStateChanged listener will set the user to null,
    // and the redirection useEffect will then automatically redirect to /login.
  };

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
