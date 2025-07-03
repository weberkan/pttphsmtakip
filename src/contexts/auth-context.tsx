
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

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const email = firebaseUser.email;
          let appUser: AuthUser | null = null;

          if (email) {
            const merkezQuery = query(collection(db, "merkez-personnel"), where("email", "==", email));
            const tasraQuery = query(collection(db, "tasra-personnel"), where("email", "==", email));

            const [merkezSnapshot, tasraSnapshot] = await Promise.all([
              getDocs(merkezQuery),
              getDocs(tasraQuery)
            ]);
            
            if (!merkezSnapshot.empty) {
              const appUserData = merkezSnapshot.docs[0].data() as Omit<Personnel, 'id'>;
              appUser = {
                registryNumber: appUserData.registryNumber,
                firstName: appUserData.firstName,
                lastName: appUserData.lastName,
                email: appUserData.email || '',
              };
            } else if (!tasraSnapshot.empty) {
              const appUserData = tasraSnapshot.docs[0].data() as Omit<Personnel, 'id'>;
              appUser = {
                registryNumber: appUserData.registryNumber,
                firstName: appUserData.firstName,
                lastName: appUserData.lastName,
                email: appUserData.email || '',
              };
            }
          }

          if (appUser) {
            setUser(appUser);
          } else {
            await signOut(auth);
            setUser(null);
          }
        } catch (error) {
          console.error("Error restoring session:", error);
          if (auth) await signOut(auth);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login';

    if (!user && !isAuthPage) {
      router.push('/login');
    } else if (user && isAuthPage) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const login = useCallback(async (email: string, password: string): Promise<{success: boolean, message?: string}> => {
    if (!auth || !db) return { success: false, message: "Kimlik doğrulama sistemi başlatılamadı." };
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest: fetching profile, setting state, and triggering the redirect effect.
      return { success: true };
    } catch (error: any) {
      console.error("Login process error:", error);
      let message = "Beklenmedik bir hata oluştu.";
       if (error.code) {
          switch (error.code) {
              case 'auth/invalid-credential':
                  message = "E-posta veya şifre hatalı. Lütfen kontrol edin.";
                  break;
              default:
                  message = "Giriş sırasında bir hata oluştu: " + error.message;
          }
      }
      return { success: false, message };
    }
  }, []);

  const signup = useCallback(async (data: SignUpData): Promise<{success: boolean, message?: string}> => {
    if (!auth || !db) {
      const message = "Auth/DB servisi mevcut değil. Firebase yapılandırmasını kontrol edin.";
      console.error(message);
      return { success: false, message };
    }
    
    try {
      const merkezRegQuery = query(collection(db, "merkez-personnel"), where("registryNumber", "==", data.registryNumber));
      const tasraRegQuery = query(collection(db, "tasra-personnel"), where("registryNumber", "==", data.registryNumber));
      
      const [merkezRegSnapshot, tasraRegSnapshot] = await Promise.all([
          getDocs(merkezRegQuery),
          getDocs(tasraRegQuery)
      ]);

      if (!merkezRegSnapshot.empty || !tasraRegSnapshot.empty) {
          return { success: false, message: "Bu sicil numarası zaten sistemde kayıtlı." };
      }

      await createUserWithEmailAndPassword(auth, data.email, data.password);
      
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

    } catch (error: any)
    {
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
      console.error("Auth servisi mevcut değil.");
      return;
    }
    try {
      await signOut(auth);
      // onAuthStateChanged will set user to null. The redirect useEffect will then handle pushing to /login.
    } catch (error) {
      console.error("Firebase çıkış hatası:", error);
    }
  }, []);

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
