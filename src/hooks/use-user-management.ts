
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
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !db) {
      setUsers([]);
      setIsInitialized(true);
      return;
    }

    // Listener for user profiles from Firestore
    const unsubscribeFirestore = onSnapshot(collection(db, "users"), (snapshot) => {
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
      
      // Update state, potentially merging with existing presence data
      setUsers(currentUsers => {
          const presenceMap = new Map(currentUsers.map(u => [u.uid, u.presence]));
          return fetchedUsers.map(u => ({ ...u, presence: presenceMap.get(u.uid) || 'offline' }));
      });
      setIsInitialized(true);
    }, (error) => {
      console.error("Error fetching users:", error);
      setIsInitialized(true);
    });

    // Listener for presence status from RTDB
    let unsubscribeRtdb = () => {};
    if (rtdb) {
        const statusRef = rtdbRef(rtdb, 'status');
        unsubscribeRtdb = onValue(statusRef, (snapshot) => {
            const statuses = snapshot.val() || {};
            setUsers(currentUsers => {
                if (currentUsers.length === 0 && !isInitialized) return []; 
                return currentUsers.map(u => ({
                    ...u,
                    presence: statuses[u.uid]?.state === 'online' ? 'online' : 'offline',
                }));
            });
        });
    }

    return () => {
      unsubscribeFirestore();
      unsubscribeRtdb();
    };

  }, [user, toast, isInitialized]);

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
