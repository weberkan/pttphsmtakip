
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db, rtdb } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { ref as rtdbRef, onValue } from 'firebase/database';
import type { AppUser } from '@/lib/types';

export function useUserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [firestoreUsers, setFirestoreUsers] = useState<Omit<AppUser, 'presence'>[]>([]);
  const [presenceData, setPresenceData] = useState<{[uid: string]: 'online' | 'offline'}>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Step 1: Listen to Firestore for the base user data.
  useEffect(() => {
    if (!user || !db) {
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
        } as Omit<AppUser, 'presence'>;
      });
      setFirestoreUsers(fetchedUsers);
      setIsInitialized(true); // Mark as initialized after the first successful fetch.
    }, (error) => {
        console.error("Error fetching users collection:", error);
        setIsInitialized(true); // Also initialize on error to not block UI.
    });

    return () => unsubscribe();
  }, [user]);

  // Step 2: Listen to Realtime Database for presence statuses.
  useEffect(() => {
    if (!user || !rtdb) {
        return;
    }

    const statusRef = rtdbRef(rtdb, 'status');
    const unsubscribe = onValue(statusRef, (snapshot) => {
        const data = snapshot.val() || {};
        const newPresenceData: {[uid: string]: 'online' | 'offline'} = {};
        for (const uid in data) {
            newPresenceData[uid] = data[uid].state;
        }
        setPresenceData(newPresenceData);
    });

    return () => unsubscribe();
  }, [user]);

  // Step 3: Merge the two data sources into the final `users` state whenever one of them changes.
  useEffect(() => {
      const mergedUsers = firestoreUsers.map(fsUser => ({
          ...fsUser,
          presence: presenceData[fsUser.uid] || 'offline'
      }));
      setUsers(mergedUsers);
  }, [firestoreUsers, presenceData]);

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
