
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db, rtdb } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import type { AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ref as rtdbRef, onValue } from 'firebase/database';

export function useUserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // States for raw data from sources, initialized to null to track loading
  const [firestoreUsers, setFirestoreUsers] = useState<Omit<AppUser, 'presence'>[] | null>(null);
  const [presenceData, setPresenceData] = useState<{[uid: string]: { state: 'online' | 'offline' }} | null>(null);

  // Listener for user profiles from Firestore
  useEffect(() => {
    if (!user || !db) {
      setFirestoreUsers([]); // Set to empty array to indicate loading is done but no user/db
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
        } as Omit<AppUser, 'presence'>;
      });
      setFirestoreUsers(fetchedUsers);
    }, (error) => {
      console.error("Error fetching users:", error);
      setFirestoreUsers([]); // Set to empty array on error to unblock combination
    });

    return () => unsubscribe();
  }, [user]);

  // Listener for presence status from RTDB
  useEffect(() => {
    if (!user || !rtdb) {
        setPresenceData({});
        return;
    }

    const statusRef = rtdbRef(rtdb, 'status');
    const unsubscribe = onValue(statusRef, (snapshot) => {
        setPresenceData(snapshot.val() || {});
    });

    return () => unsubscribe();
  }, [user]);

  // Effect to combine data from both sources into the final `users` state
  useEffect(() => {
    // We can only combine when both data sources have returned something (even empty)
    if (firestoreUsers === null || presenceData === null) {
      return;
    }

    const combinedUsers = firestoreUsers.map(u => ({
        ...u,
        presence: presenceData[u.uid]?.state === 'online' ? 'online' : 'offline',
    }));

    setUsers(combinedUsers);
    
    // The hook is initialized once we have successfully combined data for the first time.
    if (!isInitialized) {
        setIsInitialized(true);
    }
  }, [firestoreUsers, presenceData, isInitialized]);

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
