
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import type { AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useUserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Any authenticated user should be able to see the list of other users for messaging.
    // The admin check is now only relevant for specific actions like 'approveUser'.
    if (!user || !db) {
      setUsers([]);
      setIsInitialized(true);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          registryNumber: data.registryNumber,
          isApproved: data.isApproved || false,
          role: data.role,
          photoUrl: data.photoUrl,
        } as AppUser;
      });
      setUsers(fetchedUsers);
      setIsInitialized(true);
    }, (error) => {
      console.error("Error fetching users:", error);
      if (error.code === 'permission-denied') {
          toast({
              variant: "destructive",
              title: "İzin Hatası",
              description: "Kullanıcı listesini çekerken bir sorun oluştu. Lütfen Firestore güvenlik kurallarınızı kontrol edin.",
              duration: 9000,
          });
      }
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const approveUser = useCallback(async (uid: string) => {
    if (!user || user.role !== 'admin' || !db) {
      throw new Error("Yetkiniz yok veya sistem başlatılamadı.");
    }
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      isApproved: true
    });
  }, [user]);

  return { users, approveUser, isInitialized };
}
