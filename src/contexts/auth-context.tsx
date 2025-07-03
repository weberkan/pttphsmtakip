
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
      try {
        if (firebaseUser && firebaseUser.email) {
          
          const findAndSetUser = async () => {
            try {
              const merkezQuery = query(collection(db, "merkez-personnel"), where("email", "==", firebaseUser.email));
              const merkezSnapshot = await getDocs(merkezQuery);
              if (!merkezSnapshot.empty) {
                const appUserData = merkezSnapshot.docs[0].data() as Omit<Personnel, 'id'>;
                setUser({
                  registryNumber: appUserData.registryNumber,
                  firstName: appUserData.firstName,
                  lastName: appUserData.lastName,
                  email: appUserData.email || '',
                });
                return true;
              }

              const tasraQuery = query(collection(db, "tasra-personnel"), where("email", "==", firebaseUser.email));
              const tasraSnapshot = await getDocs(tasraQuery);
              if (!tasraSnapshot.empty) {
                const appUserData = tasraSnapshot.docs[0].data() as Omit<Personnel, 'id'>;
                setUser({
                  registryNumber: appUserData.registryNumber,
                  firstName: appUserData.firstName,
                  lastName: appUserData.lastName,
                  email: appUserData.email || '',
                });
                return true;
              }
              return false;
            } catch (e) {
              console.error("Firestore user lookup failed. This might be a security rules issue.", e);
              if (auth) {
                await signOut(auth);
              }
              setUser(null);
              return false;
            }
          }

          const userFound = await findAndSetUser();

          if (!userFound) {
              setUser(null);
              if (auth?.currentUser) {
                  await signOut(auth);
              }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("An error occurred during the auth state change process:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (registryNumber: string, password: string): Promise<boolean> => {
    if (!auth || !db) {
        console.error("Auth/DB service is not available. Check Firebase configuration.");
        return false;
    }

    const findEmailForRegistryNumber = async (regNum: string): Promise<string | null> => {
        let q = query(collection(db, "merkez-personnel"), where("registryNumber", "==", regNum));
        let snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return snapshot.docs[0].data().email;
        }

        q = query(collection(db, "tasra-personnel"), where("registryNumber", "==", regNum));
        snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return snapshot.docs[0].data().email;
        }
        
        return null;
    }

    try {
      const userEmail = await findEmailForRegistryNumber(registryNumber);
      
      if (userEmail) {
        await signInWithEmailAndPassword(auth, userEmail, password);
        return true;
      }
      
      console.error(`Login failed: No user found with registry number: ${registryNumber}`);
      return false;
    } catch (error) {
      console.error("Firebase login error:", error);
      return false;
    }
  }, []);

  const signup = useCallback(async (data: SignUpData): Promise<{success: boolean, message?: string}> => {
    if (!auth || !db) {
      const message = "Auth/DB service is not available. Check Firebase configuration.";
      console.error(message);
      return { success: false, message };
    }

    try {
      const merkezRegQuery = query(collection(db, "merkez-personnel"), where("registryNumber", "==", data.registryNumber));
      const merkezRegSnapshot = await getDocs(merkezRegQuery);
      if (!merkezRegSnapshot.empty) {
        return { success: false, message: "Bu sicil numarası Merkez Personel listesinde zaten kayıtlı." };
      }
      
      const tasraRegQuery = query(collection(db, "tasra-personnel"), where("registryNumber", "==", data.registryNumber));
      const tasraRegSnapshot = await getDocs(tasraRegQuery);
      if (!tasraRegSnapshot.empty) {
        return { success: false, message: "Bu sicil numarası Taşra Personel listesinde zaten kayıtlı." };
      }

      // Firebase Auth will handle duplicate email checks.
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // By default, new signups are for the Merkez system
      await addDoc(collection(db, 'merkez-personnel'), {
        firstName: data.firstName,
        lastName: data.lastName,
        registryNumber: data.registryNumber,
        email: data.email,
        status: data.status,
        unvan: data.unvan || null,
        lastModifiedBy: data.registryNumber, // The user themself modified it first
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
