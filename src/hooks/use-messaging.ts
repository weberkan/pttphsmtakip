
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  orderBy,
  Timestamp,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import type { AppUser, Conversation, Message } from '@/lib/types';
import { useToast } from './use-toast';

export function useMessaging() {
  const { user: currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Fetch all conversations for the current user
  useEffect(() => {
    if (!currentUser || !db) {
        setLoadingConversations(false);
        return;
    };

    const q = query(
      collection(db, 'conversations'),
      where('participantUids', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedConversations: Conversation[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Conversation));
      setConversations(fetchedConversations);
      setLoadingConversations(false);
    }, (error) => {
        console.error("Error fetching conversations: ", error);
        setLoadingConversations(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch messages for a specific conversation
  const listenToMessages = useCallback((conversationId: string) => {
    setLoadingMessages(true);
    setMessages([]); // Clear previous messages
    if (!db) return () => {};

    const messagesQuery = query(
      collection(db, `conversations/${conversationId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      const fetchedMessages = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: (data.timestamp as Timestamp)?.toDate() ?? new Date(),
          } as Message
      });
      setMessages(fetchedMessages);
      setLoadingMessages(false);
    }, (error) => {
        console.error(`Error fetching messages for ${conversationId}:`, error);
        setLoadingMessages(false);
    });

    return unsubscribe;
  }, []);

  const sendMessage = useCallback(async (conversationId: string, text: string) => {
    if (!currentUser || !db || !text.trim()) return;

    const messagesColRef = collection(db, `conversations/${conversationId}/messages`);
    const conversationDocRef = doc(db, 'conversations', conversationId);

    const newMessageData = {
      senderId: currentUser.uid,
      text: text.trim(),
      timestamp: serverTimestamp(),
    };

    try {
        await addDoc(messagesColRef, newMessageData);

        await updateDoc(conversationDocRef, {
            lastMessage: {
                text: text.trim(),
                senderId: currentUser.uid,
                timestamp: serverTimestamp()
            }
        });
    } catch(error) {
        console.error("Error sending message: ", error);
    }

  }, [currentUser]);

  const startConversation = useCallback(async (otherUser: AppUser): Promise<string> => {
    if (!currentUser || !db) throw new Error("User not authenticated");
    
    // Sort UIDs to create a predictable conversation ID
    const participantUids = [currentUser.uid, otherUser.uid].sort();

    const conversationQuery = query(
        collection(db, 'conversations'),
        where('participantUids', '==', participantUids)
    );

    const querySnapshot = await getDocs(conversationQuery);

    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
    } else {
        const newConversationRef = doc(collection(db, 'conversations'));
        const newConversationData = {
            participantUids,
            participants: {
                [currentUser.uid]: {
                    firstName: currentUser.firstName,
                    lastName: currentUser.lastName,
                    photoUrl: currentUser.photoUrl || null,
                },
                [otherUser.uid]: {
                    firstName: otherUser.firstName,
                    lastName: otherUser.lastName,
                    photoUrl: otherUser.photoUrl || null,
                }
            },
            lastMessage: null
        };
        await setDoc(newConversationRef, newConversationData);
        return newConversationRef.id;
    }
  }, [currentUser]);


  return { conversations, messages, loadingConversations, loadingMessages, listenToMessages, sendMessage, startConversation };
}
