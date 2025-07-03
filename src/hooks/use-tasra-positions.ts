
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { TasraPosition, Personnel } from '@/lib/types';
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
  setDoc
} from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';

const MIGRATION_KEY = 'tasraTrackerApp_firestoreMigrationComplete_v4_tasra_delete_all';

export function useTasraPositions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasraPositions, setTasraPositions] = useState<TasraPosition[]>([]);
  const [tasraPersonnel, setTasraPersonnel] = useState<Personnel[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const performOneTimeMigration = useCallback(async () => {
    if (!db || localStorage.getItem(MIGRATION_KEY)) {
      return; 
    }

    console.log("Performing one-time data DELETION for tasra...");
    toast({
      title: "Veri Temizleme",
      description: "Taşra teşkilatı için mevcut tüm pozisyon ve personel verileri temizleniyor...",
    });

    try {
      const positionsCollectionRef = collection(db, 'tasra-positions');
      const personnelCollectionRef = collection(db, 'tasra-personnel');

      const positionsSnapshot = await getDocs(positionsCollectionRef);
      const personnelSnapshot = await getDocs(personnelCollectionRef);
      
      if (positionsSnapshot.empty && personnelSnapshot.empty) {
          console.log("Tasra data is already empty. No deletion needed.");
      } else {
        const batch = writeBatch(db);
        positionsSnapshot.forEach(doc => batch.delete(doc.ref));
        personnelSnapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log("Successfully deleted all Tasra data.");
        toast({
          title: "Taşra Verileri Temizlendi",
          description: "Tüm taşra pozisyon ve personel kayıtları kalıcı olarak silindi.",
        });
      }
      
      localStorage.setItem(MIGRATION_KEY, 'true');
      console.log("Tasra data deletion complete. Migration key set.");
      
    } catch(error) {
      console.error("Tasra data deletion failed:", error);
       toast({
        variant: "destructive",
        title: "Hata",
        description: "Taşra verileri temizlenirken bir sorun oluştu.",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (!user || !db) {
      setTasraPositions([]);
      setTasraPersonnel([]);
      setIsInitialized(!db);
      return;
    }

    performOneTimeMigration();

    const positionsUnsubscribe = onSnapshot(collection(db, "tasra-positions"), (snapshot) => {
      const fetchedPositions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate ? data.startDate.toDate() : data.startDate,
          lastModifiedAt: data.lastModifiedAt?.toDate ? data.lastModifiedAt.toDate() : data.lastModifiedAt,
        } as TasraPosition;
      });
      const uniquePositions = Array.from(new Map(fetchedPositions.map(p => [p.id, p])).values());
      setTasraPositions(uniquePositions);
      setIsInitialized(true);
    }, (error) => {
        console.error("Error fetching tasra positions:", error);
        setIsInitialized(true);
    });

    const personnelUnsubscribe = onSnapshot(collection(db, "tasra-personnel"), (snapshot) => {
      const fetchedPersonnel = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : data.dateOfBirth,
          lastModifiedAt: data.lastModifiedAt?.toDate ? data.lastModifiedAt.toDate() : data.lastModifiedAt,
        } as Personnel;
      });
      const uniquePersonnel = Array.from(new Map(fetchedPersonnel.map(p => [p.id, p])).values());
      setTasraPersonnel(uniquePersonnel);
      setIsInitialized(true);
    }, (error) => {
        console.error("Error fetching tasra personnel:", error);
        setIsInitialized(true);
    });

    return () => {
      positionsUnsubscribe();
      personnelUnsubscribe();
    };
  }, [user, db, performOneTimeMigration]);

  const addTasraPosition = useCallback(async (positionData: Omit<TasraPosition, 'id'>) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'tasra-positions'), {
      ...positionData,
      lastModifiedBy: user.registryNumber,
      lastModifiedAt: Timestamp.now(),
    });
  }, [user]);

  const batchAddTasraPosition = useCallback(async (positionList: Omit<TasraPosition, 'id'>[]) => {
    if (!user || !db) return;
    const batch = writeBatch(db);
    positionList.forEach(positionData => {
      const docRef = doc(collection(db, 'tasra-positions'));
      batch.set(docRef, {
        ...positionData,
        lastModifiedBy: user.registryNumber,
        lastModifiedAt: Timestamp.now(),
      });
    });
    await batch.commit();
  }, [user]);

  const updateTasraPosition = useCallback(async (updatedPosition: TasraPosition) => {
    if (!user || !db) return;
    const { id, ...data } = updatedPosition;
    await setDoc(doc(db, 'tasra-positions', id), {
      ...data,
      lastModifiedBy: user.registryNumber,
      lastModifiedAt: Timestamp.now(),
    }, { merge: true });
  }, [user]);

  const batchUpdateTasraPosition = useCallback(async (positionList: TasraPosition[]) => {
    if (!user || !db) return;
    const batch = writeBatch(db);
    positionList.forEach(position => {
      const { id, ...data } = position;
      const docRef = doc(db, 'tasra-positions', id);
      batch.set(docRef, {
        ...data,
        lastModifiedBy: user.registryNumber,
        lastModifiedAt: Timestamp.now(),
      }, { merge: true });
    });
    await batch.commit();
  }, [user]);

  const deleteTasraPosition = useCallback(async (positionId: string) => {
    if (!user || !db) return;
    
    try {
      await deleteDoc(doc(db, 'tasra-positions', positionId));
      toast({
        title: "Pozisyon Silindi",
        description: "Taşra pozisyonu başarıyla silindi.",
      });
    } catch (error) {
      console.error("Error deleting Tasra position:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Pozisyon silinirken bir hata oluştu.",
      });
    }
  }, [user, db, toast]);


  const addTasraPersonnel = useCallback(async (personnelData: Omit<Personnel, 'id'>) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'tasra-personnel'), {
      ...personnelData,
      lastModifiedBy: user.registryNumber,
      lastModifiedAt: Timestamp.now(),
    });
  }, [user]);

  const batchAddTasraPersonnel = useCallback(async (personnelList: Omit<Personnel, 'id'>[]) => {
    if (!user || !db) return;
    const batch = writeBatch(db);
    personnelList.forEach(personnelData => {
      const docRef = doc(collection(db, 'tasra-personnel'));
      batch.set(docRef, {
        ...personnelData,
        lastModifiedBy: user.registryNumber,
        lastModifiedAt: Timestamp.now(),
      });
    });
    await batch.commit();
  }, [user]);

  const updateTasraPersonnel = useCallback(async (updatedPersonnel: Personnel) => {
    if (!user || !db) return;
    const { id, ...data } = updatedPersonnel;
    await setDoc(doc(db, 'tasra-personnel', id), {
      ...data,
      lastModifiedBy: user.registryNumber,
      lastModifiedAt: Timestamp.now(),
    }, { merge: true });
  }, [user]);

  const deleteTasraPersonnel = useCallback(async (personnelId: string) => {
    if (!user || !db) return;

    try {
      const batch = writeBatch(db);
      
      const personnelRef = doc(db, 'tasra-personnel', personnelId);
      batch.delete(personnelRef);
      
      const assignedPositions = tasraPositions.filter(p => p.assignedPersonnelId === personnelId);
      assignedPositions.forEach(pos => {
        const posRef = doc(db, 'tasra-positions', pos.id);
        batch.set(posRef, {
          assignedPersonnelId: null,
          status: 'Boş' as const,
          lastModifiedBy: user.registryNumber,
          lastModifiedAt: Timestamp.now(),
        }, { merge: true });
      });
      
      await batch.commit();
  
      toast({
        title: "Personel Silindi",
        description: "Taşra personeli başarıyla silindi ve atamaları kaldırıldı.",
      });
    } catch (error) {
      console.error("Error deleting Tasra personnel:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Personel silinirken bir hata oluştu.",
      });
    }
  }, [user, db, toast, tasraPositions]);

  return { 
    tasraPositions, 
    tasraPersonnel,
    addTasraPosition, 
    batchAddTasraPosition,
    updateTasraPosition, 
    batchUpdateTasraPosition,
    deleteTasraPosition, 
    addTasraPersonnel,
    batchAddTasraPersonnel,
    updateTasraPersonnel,
    deleteTasraPersonnel,
    isInitialized 
  };
}
