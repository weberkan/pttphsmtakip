
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

  // This useEffect handles session persistence on page reloads
  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && !user) { // Check !user to avoid re-fetching on login/signup
        try {
          const email = firebaseUser.email;
          if (email) {
            // Check merkez-personnel
            const merkezQuery = query(collection(db, "merkez-personnel"), where("email", "==", email));
            const merkezSnapshot = await getDocs(merkezQuery);
            if (!merkezSnapshot.empty) {
              const appUserData = merkezSnapshot.docs[0].data() as Omit<Personnel, 'id'>;
              setUser({
                registryNumber: appUserData.registryNumber,
                firstName: appUserData.firstName,
                lastName: appUserData.lastName,
                email: appUserData.email || '',
              });
              setLoading(false);
              return;
            }

            // Check tasra-personnel
            const tasraQuery = query(collection(db, "tasra-personnel"), where("email", "==", email));
            const tasraSnapshot = await getDocs(tasraQuery);
            if (!tasraSnapshot.empty) {
              const appUserData = tasraSnapshot.docs[0].data() as Omit<Personnel, 'id'>;
              setUser({
                registryNumber: appUserData.registryNumber,
                firstName: appUserData.firstName,
                lastName: appUserData.lastName,
                email: appUserData.email || '',
              });
              setLoading(false);
              return;
            }
          }
          // If user exists in Firebase Auth but not in our DB, or has no email
          await signOut(auth);
          setUser(null);
        } catch (error) {
          console.error("Error restoring session:", error);
          if (auth) await signOut(auth);
          setUser(null);
        }
      } else if (!firebaseUser) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Run only once on mount to check initial auth state

  // This useEffect handles redirection logic
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
    if (!auth || !db) return { success: false, message: "Sistem başlatılamadı." };
    
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const emailToSearch = userCredential.user.email;
      if (!emailToSearch) {
        throw new Error("Kullanıcının e-posta adresi bulunamadı.");
      }

      // Look for user in Firestore
      const merkezQuery = query(collection(db, "merkez-personnel"), where("email", "==", emailToSearch));
      const merkezSnapshot = await getDocs(merkezQuery);
      if (!merkezSnapshot.empty) {
        const appUserData = merkezSnapshot.docs[0].data() as Omit<Personnel, 'id'>;
        setUser({
          registryNumber: appUserData.registryNumber,
          firstName: appUserData.firstName,
          lastName: appUserData.lastName,
          email: appUserData.email || '',
        });
        return { success: true };
      }

      const tasraQuery = query(collection(db, "tasra-personnel"), where("email", "==", emailToSearch));
      const tasraSnapshot = await getDocs(tasraQuery);
      if (!tasraSnapshot.empty) {
        const appUserData = tasraSnapshot.docs[0].data() as Omit<Personnel, 'id'>;
        setUser({
          registryNumber: appUserData.registryNumber,
          firstName: appUserData.firstName,
          lastName: appUserData.lastName,
          email: appUserData.email || '',
        });
        return { success: true };
      }

      // If we are here, user is in Auth but not in our DB.
      await signOut(auth);
      return { success: false, message: "Giriş bilgileri doğrulandı fakat personel kaydı sistemde bulunamadı." };

    } catch (error: any) {
      console.error("Login process error:", error);
      let message = "Beklenmedik bir hata oluştu.";
      if (error.code) {
          switch (error.code) {
              case 'auth/invalid-credential':
                  message = "E-posta veya şifre hatalı.";
                  break;
              case 'permission-denied':
                  message = "Veritabanına erişim izni yok. Lütfen Firestore güvenlik kurallarınızı kontrol edin.";
                  break;
              default:
                  message = "Giriş sırasında bir hata oluştu: " + error.message;
          }
      }
      return { success: false, message };
    } finally {
        setLoading(false);
    }
  }, []);

  const signup = useCallback(async (data: SignUpData): Promise<{success: boolean, message?: string}> => {
    if (!auth || !db) {
      const message = "Auth/DB servisi mevcut değil. Firebase yapılandırmasını kontrol edin.";
      console.error(message);
      return { success: false, message };
    }
    
    setLoading(true);
    try {
      // Check for duplicate registry number in both collections
      const merkezRegQuery = query(collection(db, "merkez-personnel"), where("registryNumber", "==", data.registryNumber));
      const tasraRegQuery = query(collection(db, "tasra-personnel"), where("registryNumber", "==", data.registryNumber));
      
      const [merkezRegSnapshot, tasraRegSnapshot] = await Promise.all([
          getDocs(merkezRegQuery),
          getDocs(tasraRegQuery)
      ]);

      if (!merkezRegSnapshot.empty || !tasraRegSnapshot.empty) {
          return { success: false, message: "Bu sicil numarası zaten sistemde kayıtlı." };
      }

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

      setUser({
        registryNumber: data.registryNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
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
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (!auth) {
      console.error("Auth servisi mevcut değil.");
      return;
    }
    try {
      await signOut(auth);
      setUser(null);
      setLoading(false);
      router.push('/login');
    } catch (error) {
      console.error("Firebase çıkış hatası:", error);
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
