
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Position, Personnel } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  writeBatch,
  getDocs,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';

export function usePositions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!user || !db) {
      setPositions([]);
      setPersonnel([]);
      setIsInitialized(!db);
      return;
    }

    const positionsUnsubscribe = onSnapshot(collection(db, "merkez-positions"), (snapshot) => {
      const fetchedPositions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: (data.startDate as Timestamp)?.toDate() || null,
          lastModifiedAt: (data.lastModifiedAt as Timestamp)?.toDate() || null,
        } as Position;
      });
      const uniquePositions = Array.from(new Map(fetchedPositions.map(p => [p.id, p])).values());
      setPositions(uniquePositions);
      setIsInitialized(true);
    }, (error) => {
      console.error("Error fetching merkez positions:", error);
      setIsInitialized(true);
    });

    const personnelUnsubscribe = onSnapshot(collection(db, "merkez-personnel"), (snapshot) => {
      const fetchedPersonnel = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dateOfBirth: (data.dateOfBirth as Timestamp)?.toDate() || null,
          lastModifiedAt: (data.lastModifiedAt as Timestamp)?.toDate() || null,
        } as Personnel;
      });
      const uniquePersonnel = Array.from(new Map(fetchedPersonnel.map(p => [p.id, p])).values());
      setPersonnel(uniquePersonnel);
      setIsInitialized(true);
    }, (error) => {
        console.error("Error fetching merkez personnel:", error);
        setIsInitialized(true);
    });

    return () => {
      positionsUnsubscribe();
      personnelUnsubscribe();
    };
  }, [user, db]);

  const addPosition = useCallback(async (positionData: Omit<Position, 'id'>) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'merkez-positions'), {
      ...positionData,
      lastModifiedBy: user.registryNumber,
      lastModifiedAt: Timestamp.now(),
    });
  }, [user]);

  const batchAddPositions = useCallback(async (positionList: Omit<Position, 'id'>[]) => {
    if (!user || !db) return;
    const batch = writeBatch(db);
    positionList.forEach(positionData => {
      const docRef = doc(collection(db, 'merkez-positions'));
      batch.set(docRef, {
        ...positionData,
        lastModifiedBy: user.registryNumber,
        lastModifiedAt: Timestamp.now(),
      });
    });
    await batch.commit();
  }, [user]);

  const updatePosition = useCallback(async (updatedPosition: Position) => {
    if (!user || !db) return;
    const { id, ...data } = updatedPosition;
    await setDoc(doc(db, 'merkez-positions', id), {
      ...data,
      lastModifiedBy: user.registryNumber,
      lastModifiedAt: Timestamp.now(),
    }, { merge: true });
  }, [user]);

  const batchUpdatePositions = useCallback(async (positionList: Position[]) => {
    if (!user || !db) return;
    const batch = writeBatch(db);
    positionList.forEach(position => {
      const { id, ...data } = position;
      const docRef = doc(db, 'merkez-positions', id);
      batch.set(docRef, {
        ...data,
        lastModifiedBy: user.registryNumber,
        lastModifiedAt: Timestamp.now(),
      }, { merge: true });
    });
    await batch.commit();
  }, [user]);

  const deletePosition = useCallback(async (positionId: string) => {
    if (!user || !db) return;
    try {
      const batch = writeBatch(db);
      
      const positionRef = doc(db, 'merkez-positions', positionId);
      batch.delete(positionRef);
      
      const childPositionsToUpdate = positions.filter(p => p.reportsTo === positionId);
      childPositionsToUpdate.forEach(child => {
          const childRef = doc(db, 'merkez-positions', child.id);
          batch.set(childRef, { 
              reportsTo: null,
              lastModifiedBy: user.registryNumber,
              lastModifiedAt: Timestamp.now(),
          }, { merge: true });
      });

      await batch.commit();
      toast({
        title: "Pozisyon Silindi",
        description: "Merkez pozisyonu ve alt bağlantıları başarıyla güncellendi.",
      });
    } catch (error) {
      console.error("Error deleting Merkez position:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Pozisyon silinirken bir hata oluştu.",
      });
    }
  }, [user, db, toast, positions]);


  const addPersonnel = useCallback(async (personnelData: Omit<Personnel, 'id' | 'status'> & { status: 'İHS' | '399' }) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'merkez-personnel'), {
      ...personnelData,
      lastModifiedBy: user.registryNumber,
      lastModifiedAt: Timestamp.now(),
    });
  }, [user]);

  const batchAddPersonnel = useCallback(async (personnelList: Omit<Personnel, 'id'>[]) => {
    if (!user || !db) return;
    const batch = writeBatch(db);
    personnelList.forEach(personnelData => {
      const docRef = doc(collection(db, 'merkez-personnel'));
      batch.set(docRef, {
        ...personnelData,
        lastModifiedBy: user.registryNumber,
        lastModifiedAt: Timestamp.now(),
      });
    });
    await batch.commit();
  }, [user]);

  const updatePersonnel = useCallback(async (updatedPersonnel: Personnel) => {
    if (!user || !db) return;
    const { id, ...data } = updatedPersonnel;
    await setDoc(doc(db, 'merkez-personnel', id), {
      ...data,
      lastModifiedBy: user.registryNumber,
      lastModifiedAt: Timestamp.now(),
    }, { merge: true });
  }, [user]);

  const deletePersonnel = useCallback(async (personnelId: string) => {
    if (!user || !db) return;
    
    try {
      const batch = writeBatch(db);
      
      const personnelRef = doc(db, 'merkez-personnel', personnelId);
      batch.delete(personnelRef);
      
      const assignedPositions = positions.filter(p => p.assignedPersonnelId === personnelId);
      assignedPositions.forEach(pos => {
        const posRef = doc(db, 'merkez-positions', pos.id);
        batch.set(posRef, {
          assignedPersonnelId: null,
          status: 'Boş',
          lastModifiedBy: user.registryNumber,
          lastModifiedAt: Timestamp.now(),
        }, { merge: true });
      });

      await batch.commit();
      toast({
        title: "Personel Silindi",
        description: "Merkez personeli başarıyla silindi ve atamaları kaldırıldı.",
      });
    } catch (error) {
      console.error("Error deleting Merkez personnel:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Personel silinirken bir hata oluştu.",
      });
    }
  }, [user, db, toast, positions]);

  return { 
    positions, 
    personnel,
    addPosition, 
    batchAddPositions,
    updatePosition, 
    batchUpdatePositions,
    deletePosition, 
    addPersonnel,
    batchAddPersonnel,
    updatePersonnel,
    deletePersonnel,
    isInitialized 
  };
}
