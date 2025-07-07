
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { KanbanCard, DepposhFile, DepposhFileCategory } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  writeBatch,
  Timestamp,
  setDoc,
  query,
  orderBy,
  where,
  getDocs
} from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';

export function useDepposh() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [files, setFiles] = useState<DepposhFile[]>([]);
  const [isDepposhInitialized, setIsDepposhInitialized] = useState(false);

  useEffect(() => {
    if (!user || !db) {
      setCards([]);
      setFiles([]);
      setIsDepposhInitialized(!db);
      return;
    }
    
    let initializedCount = 0;
    const markInitialized = () => {
        initializedCount++;
        if (initializedCount === 2) {
            setIsDepposhInitialized(true);
        }
    }

    const cardsQuery = query(collection(db, "talimatlar"), orderBy("order", "asc"));
    const cardsUnsubscribe = onSnapshot(cardsQuery, (snapshot) => {
      const fetchedCards = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              ...data,
              lastModifiedAt: data.lastModifiedAt?.toDate ? data.lastModifiedAt.toDate() : data.lastModifiedAt,
            } as KanbanCard;
        });
      setCards(fetchedCards);
      markInitialized();
    }, (error) => {
      console.error("Error fetching talimatlar:", error);
      markInitialized();
    });

    const filesQuery = query(collection(db, "depposh-files"), orderBy("order", "asc"));
    const filesUnsubscribe = onSnapshot(filesQuery, (snapshot) => {
      const fetchedFiles = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            lastModifiedAt: data.lastModifiedAt?.toDate ? data.lastModifiedAt.toDate() : data.lastModifiedAt,
          } as DepposhFile;
        });
      setFiles(fetchedFiles);
      markInitialized();
    }, (error) => {
        console.error("Error fetching depposh files:", error);
        markInitialized();
    });

    return () => {
      cardsUnsubscribe();
      filesUnsubscribe();
    };
  }, [user]);

  // Kanban Card operations
  const addCard = useCallback(async (cardData: Omit<KanbanCard, 'id' | 'order' | 'lastModifiedBy' | 'lastModifiedAt'>) => {
    if (!user || !db) return;
    const cardsInStatus = cards.filter(c => c.status === cardData.status);
    const maxOrder = cardsInStatus.reduce((max, card) => Math.max(card.order, max), -1);

    await addDoc(collection(db, 'talimatlar'), {
      ...cardData,
      order: maxOrder + 1,
      lastModifiedBy: user.registryNumber,
      lastModifiedAt: Timestamp.now(),
    });
  }, [user, cards]);

  const updateCard = useCallback(async (updatedCard: KanbanCard) => {
    if (!user || !db) return;
    const { id, ...data } = updatedCard;
    await setDoc(doc(db, 'talimatlar', id), {
      ...data,
      lastModifiedBy: user.registryNumber,
      lastModifiedAt: Timestamp.now(),
    }, { merge: true });
  }, [user]);

  const deleteCard = useCallback(async (cardId: string) => {
    if (!user || !db) return;
    await deleteDoc(doc(db, 'talimatlar', cardId));
  }, [user]);

  // Depposh File operations
  const addFile = useCallback(async (fileData: Omit<DepposhFile, 'id' | 'order' | 'downloadUrl'>) => {
    if (!user || !db) return;
    // Here you would normally upload the file to Firebase Storage and get a downloadURL
    // For now, we'll use a placeholder.
    const downloadUrl = "placeholder/url"; 
    
    const filesInCategory = files.filter(f => f.category === fileData.category);
    const maxOrder = filesInCategory.reduce((max, file) => Math.max(file.order, max), -1);

    await addDoc(collection(db, 'depposh-files'), {
      ...fileData,
      downloadUrl,
      order: maxOrder + 1,
      lastModifiedBy: user.registryNumber,
      lastModifiedAt: Timestamp.now(),
    });
  }, [user, files]);

  const deleteFile = useCallback(async (fileId: string) => {
    if (!user || !db) return;
    // In a real app, you'd also delete the file from Firebase Storage
    await deleteDoc(doc(db, 'depposh-files', fileId));
  }, [user]);

  const updateFileOrder = useCallback(async (fileToMove: DepposhFile, direction: 'up' | 'down') => {
    if (!user || !db) return;

    const categoryFiles = files.filter(f => f.category === fileToMove.category).sort((a, b) => a.order - b.order);
    const currentIndex = categoryFiles.findIndex(f => f.id === fileToMove.id);

    if (direction === 'up' && currentIndex > 0) {
      const otherFile = categoryFiles[currentIndex - 1];
      const batch = writeBatch(db);
      batch.update(doc(db, 'depposh-files', fileToMove.id), { order: otherFile.order });
      batch.update(doc(db, 'depposh-files', otherFile.id), { order: fileToMove.order });
      await batch.commit();
    } else if (direction === 'down' && currentIndex < categoryFiles.length - 1) {
      const otherFile = categoryFiles[currentIndex + 1];
      const batch = writeBatch(db);
      batch.update(doc(db, 'depposh-files', fileToMove.id), { order: otherFile.order });
      batch.update(doc(db, 'depposh-files', otherFile.id), { order: fileToMove.order });
      await batch.commit();
    }
  }, [user, files]);

  return { 
    cards, 
    addCard, 
    updateCard, 
    deleteCard,
    files,
    addFile,
    deleteFile,
    updateFileOrder,
    isDepposhInitialized,
  };
}
