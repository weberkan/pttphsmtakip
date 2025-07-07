
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  doc,
  updateDoc,
  Timestamp,
  writeBatch
} from "firebase/firestore";
import type { AppNotification } from '@/lib/types';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !db) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const thirtyMinutesAgo = Timestamp.fromMillis(Date.now() - 30 * 60 * 1000);

    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', user.uid),
      where('createdAt', '>=', thirtyMinutesAgo),
      orderBy('createdAt', 'desc'),
      limit(20) // Limit to last 20 notifications for performance
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
        } as AppNotification;
      });

      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user || !db) return;
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { isRead: true });
  }, [user, db]);
  
  const markAllAsRead = useCallback(async () => {
    if (!user || !db || unreadCount === 0) return;
    const unreadNotifications = notifications.filter(n => !n.isRead);
    const batch = writeBatch(db);
    unreadNotifications.forEach(notification => {
        const docRef = doc(db, 'notifications', notification.id);
        batch.update(docRef, { isRead: true });
    });
    try {
        await batch.commit();
    } catch(error) {
        console.error("Error marking all notifications as read:", error);
    }
  }, [user, db, notifications, unreadCount]);

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
