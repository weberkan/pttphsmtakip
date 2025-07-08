
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { KanbanCard, DepposhFile, DepposhFileCategory, AppUser } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { db, storage } from '@/lib/firebase';
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
  getDocs,
  getDoc,
  updateDoc
} from "firebase/firestore";
import { 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

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
              startDate: data.startDate ? (data.startDate as Timestamp).toDate() : null,
              dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate() : null,
              lastModifiedAt: data.lastModifiedAt ? (data.lastModifiedAt as Timestamp).toDate() : null,
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
            lastModifiedAt: (data.lastModifiedAt as Timestamp)?.toDate() || null
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

  const createAssignmentNotification = useCallback(async (assigneeUid: string, cardTitle: string) => {
    if (!db) return;
    await addDoc(collection(db, 'notifications'), {
        recipientUid: assigneeUid,
        senderInfo: 'Depposh Sistemi',
        message: `Müdür tarafından size "${cardTitle}" görevi atandı.`,
        link: '/?view=depposh-talimatlar',
        isRead: false,
        createdAt: Timestamp.now(),
    });
  }, []);

  // Kanban Card operations
  const addCard = useCallback(async (cardData: Omit<KanbanCard, 'id' | 'order' | 'lastModifiedBy' | 'lastModifiedAt'>) => {
    if (!user || !db) return;
    const cardsInStatus = cards.filter(c => c.status === cardData.status);
    const maxOrder = cardsInStatus.reduce((max, card) => Math.max(card.order, max), -1);

    const newCardData = {
      ...cardData,
      order: maxOrder + 1,
      lastModifiedBy: user.uid,
      lastModifiedAt: Timestamp.now(),
    };

    const newDocRef = await addDoc(collection(db, 'talimatlar'), newCardData);

    // Send notifications to new assignees
    if (newCardData.assignedUids) {
        for (const uid of newCardData.assignedUids) {
            await createAssignmentNotification(uid, newCardData.title);
        }
    }

  }, [user, cards, createAssignmentNotification]);

  const updateCard = useCallback(async (updatedCard: KanbanCard) => {
    if (!user || !db) return;
    const { id, ...data } = updatedCard;
    const cardRef = doc(db, 'talimatlar', id);

    const originalCardDoc = await getDoc(cardRef);
    const originalCardData = originalCardDoc.data() as KanbanCard;
    const oldUids = new Set(originalCardData.assignedUids || []);
    const newUids = new Set(data.assignedUids || []);

    await setDoc(cardRef, {
      ...data,
      lastModifiedBy: user.uid,
      lastModifiedAt: Timestamp.now(),
    }, { merge: true });

    // Find newly added users and send them notifications
    for (const uid of newUids) {
        if (!oldUids.has(uid)) {
            await createAssignmentNotification(uid, data.title);
        }
    }

  }, [user, createAssignmentNotification]);

  const deleteCard = useCallback(async (cardId: string) => {
    if (!user || !db) return;
    await deleteDoc(doc(db, 'talimatlar', cardId));
  }, [user]);

  const updateCardBatch = useCallback(async (cardsToUpdate: (Partial<KanbanCard> & { id: string })[]) => {
    if (!user || !db || cardsToUpdate.length === 0) return;
    const batch = writeBatch(db);
  
    cardsToUpdate.forEach(cardUpdate => {
      const { id, ...data } = cardUpdate;
      const cardRef = doc(db, 'talimatlar', id);
      batch.update(cardRef, {
        ...data,
        lastModifiedBy: user.uid,
        lastModifiedAt: Timestamp.now(),
      });
    });
  
    try {
      await batch.commit();
      toast({ title: 'Pano Güncellendi' });
    } catch (e) {
      console.error("Error updating board", e);
      toast({ variant: 'destructive', title: "Hata", description: "Pano güncellenirken bir sorun oluştu." });
    }
  }, [user, db, toast]);


  // Depposh File operations
  const addFile = useCallback(async (file: File, category: DepposhFileCategory) => {
    if (!user || !db || !storage) return;
    
    const fileId = uuidv4();
    const filePath = `depposh-files/${category}/${fileId}-${file.name}`;
    const fileStorageRef = storageRef(storage, filePath);
    
    await uploadBytes(fileStorageRef, file);
    const downloadUrl = await getDownloadURL(fileStorageRef);
    
    const filesInCategory = files.filter(f => f.category === category);
    const maxOrder = filesInCategory.reduce((max, f) => Math.max(f.order, max), -1);

    const fileData: Omit<DepposhFile, 'id'> = {
        name: file.name,
        type: file.type,
        size: file.size,
        category: category,
        downloadUrl,
        storagePath: filePath, // Store path for easy deletion
        order: maxOrder + 1,
        lastModifiedBy: user.uid,
        lastModifiedAt: Timestamp.now(),
    }

    await addDoc(collection(db, 'depposh-files'), fileData);

  }, [user, files, storage, db]);

  const deleteFile = useCallback(async (fileId: string) => {
    if (!user || !db || !storage) return;

    const fileDocRef = doc(db, 'depposh-files', fileId);
    const fileDoc = await getDoc(fileDocRef);

    if (fileDoc.exists()) {
        const fileData = fileDoc.data() as DepposhFile;
        // Delete from Storage first
        if (fileData.storagePath) {
            const fileStorageRef = storageRef(storage, fileData.storagePath);
            await deleteObject(fileStorageRef).catch(err => console.error("Could not delete file from storage", err));
        }
        // Then delete from Firestore
        await deleteDoc(fileDocRef);
        toast({ title: "Dosya Silindi", description: `${fileData.name} başarıyla silindi.` });
    } else {
        toast({ variant: "destructive", title: "Hata", description: "Silinecek dosya bulunamadı." });
    }

  }, [user, storage, db, toast]);

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
  }, [user, files, db]);

  return { 
    cards, 
    addCard, 
    updateCard, 
    deleteCard,
    updateCardBatch,
    files,
    addFile,
    deleteFile,
    updateFileOrder,
    isDepposhInitialized,
  };
}

    