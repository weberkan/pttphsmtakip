
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, query, where, getDocs, limit } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  registryNumber: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password:string) => Promise<{success: boolean, message?: string}>;
  signup: (data: SignUpData) => Promise<{success: boolean, message?: string}>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserProfile = useCallback(async (firebaseUser: FirebaseUser): Promise<AppUser | null> => {
    if (!db || !firebaseUser) return null;
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // This is the approval check.
        if (!userData.isApproved) {
          return null; 
        }
        
        // Fetch photoUrl from personnel collections
        let photoUrl: string | null = null;
        if (userData.registryNumber) {
          try {
            const merkezPersonnelQuery = query(collection(db, "merkez-personnel"), where("registryNumber", "==", userData.registryNumber), limit(1));
            const tasraPersonnelQuery = query(collection(db, "tasra-personnel"), where("registryNumber", "==", userData.registryNumber), limit(1));

            const [merkezSnapshot, tasraSnapshot] = await Promise.all([
              getDocs(merkezPersonnelQuery),
              getDocs(tasraPersonnelQuery)
            ]);
            
            if (!merkezSnapshot.empty) {
              photoUrl = merkezSnapshot.docs[0].data().photoUrl || null;
            } else if (!tasraSnapshot.empty) {
              photoUrl = tasraSnapshot.docs[0].data().photoUrl || null;
            }
          } catch (e) {
            console.error("Could not fetch personnel photo for user", e);
          }
        }

        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          firstName: userData.firstName,
          lastName: userData.lastName,
          registryNumber: userData.registryNumber,
          isApproved: userData.isApproved,
          role: userData.role,
          photoUrl: photoUrl
        };
      }
      console.warn(`No profile document found in 'users' for UID: ${firebaseUser.uid}.`);
      return null;
    } catch (error) {
      console.error("Error fetching user profile from Firestore:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userProfile = await fetchUserProfile(firebaseUser);
          if (userProfile) {
            setUser(userProfile);
          } else {
            // User exists in Auth but not in Firestore or is not approved.
            setUser(null);
            await signOut(auth); // Sign out if profile is not valid or not approved
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Critical error in onAuthStateChanged:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);
  
  useEffect(() => {
    if (loading) {
      return;
    }

    const isAuthPage = pathname === '/login';

    if (user && isAuthPage) {
      router.push('/');
    } else if (!user && !isAuthPage) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);


  const login = async (email: string, password: string): Promise<{success: boolean, message?: string}> => {
    if (!auth || !db) return { success: false, message: "Firebase yapılandırması eksik. Lütfen ortam değişkenlerini ayarlayın." };
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await fetchUserProfile(userCredential.user);

      if (profile) {
        return { success: true };
      } else {
        await signOut(auth);
        return { success: false, message: "Hesabınız yönetici onayı bekliyor veya askıya alınmış." };
      }

    } catch (error: any) {
      let message = "Beklenmedik bir hata oluştu.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          message = "E-posta veya şifre hatalı.";
      }
      return { success: false, message };
    }
  };
  
  const signup = async (data: SignUpData): Promise<{success: boolean, message?: string}> => {
    if (!auth || !db) return { success: false, message: "Firebase yapılandırması eksik olduğu için kayıt yapılamıyor." };
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      
      const newUserProfile = {
        firstName: data.firstName,
        lastName: data.lastName,
        registryNumber: data.registryNumber,
        email: data.email,
        isApproved: false, // Default to not approved
        createdAt: new Date(),
      };
      
      await setDoc(doc(db, "users", firebaseUser.uid), newUserProfile);
      
      // The onAuthStateChanged listener will handle signing out the user if they are not approved.
      // Signing out here creates a race condition.
      // await signOut(auth);

      return { success: true };

    } catch (error: any) {
      let message = "Kayıt sırasında bir hata oluştu.";
      if (error.code === 'auth/email-already-in-use') {
        message = "Bu e-posta adresi zaten kullanılıyor.";
      } else if (error.code === 'auth/weak-password') {
          message = "Şifre en az 6 karakter olmalıdır.";
      }
      return { success: false, message };
    }
  };

  const logout = async () => {
    if (!auth || !user) return;
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out: ", error);
    }
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
