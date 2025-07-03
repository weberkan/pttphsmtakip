
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
  setDoc
} from "firebase/firestore";
import { initialPositionsData, initialPersonnelData } from '@/lib/initial-data';
import { useToast } from '@/hooks/use-toast';

const MIGRATION_KEY = 'positionTrackerApp_firestoreMigrationComplete_v2';

export function usePositions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const performOneTimeMigration = useCallback(async () => {
    if (!db || localStorage.getItem(MIGRATION_KEY)) {
      return;
    }

    console.log("Checking if merkez-positions migration is needed...");

    try {
      const positionsCollectionRef = collection(db, 'merkez-positions');
      const personnelCollectionRef = collection(db, 'merkez-personnel');

      const positionsSnapshot = await getDocs(positionsCollectionRef);
      const personnelSnapshot = await getDocs(personnelCollectionRef);

      if (positionsSnapshot.empty && personnelSnapshot.empty) {
        const localPositionsStr = localStorage.getItem('positionTrackerApp_positions'); // Old key
        const localPersonnelStr = localStorage.getItem('positionTrackerApp_personnel'); // Old key
        
        const localPositions = localPositionsStr ? JSON.parse(localPositionsStr) : initialPositionsData;
        const localPersonnel = localPersonnelStr ? JSON.parse(localPersonnelStr) : initialPersonnelData;
        
        if (localPositions.length > 0 || localPersonnel.length > 0) {
          console.log("Performing one-time data migration for merkez from localStorage to Firestore...");
          const batch = writeBatch(db);

          localPositions.forEach((p: any) => {
            const docRef = doc(positionsCollectionRef, p.id); // Use existing ID
            batch.set(docRef, {
                ...p,
                startDate: p.startDate ? Timestamp.fromDate(new Date(p.startDate)) : null,
            });
          });

          localPersonnel.forEach((p: any) => {
            const docRef = doc(personnelCollectionRef, p.id); // Use existing ID
            batch.set(docRef, {
                ...p,
                status: p.status || 'İHS',
                dateOfBirth: p.dateOfBirth ? Timestamp.fromDate(new Date(p.dateOfBirth)) : null
            });
          });

          await batch.commit();
          console.log("Merkez migration successful.");
        }
      }
      
      localStorage.setItem(MIGRATION_KEY, 'true');
      localStorage.removeItem('positionTrackerApp_positions');
      localStorage.removeItem('positionTrackerApp_personnel');

    } catch (error) {
      console.error("Merkez migration check failed. This could be due to Firestore security rules. The app will proceed, but old data might not be migrated.", error);
    }
  }, []);

  useEffect(() => {
    if (user && db) {
      performOneTimeMigration().then(() => {
        const positionsUnsubscribe = onSnapshot(collection(db, "merkez-positions"), (snapshot) => {
          const fetchedPositions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              startDate: data.startDate?.toDate(),
              lastModifiedAt: data.lastModifiedAt?.toDate ? data.lastModifiedAt.toDate() : data.lastModifiedAt,
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
              dateOfBirth: data.dateOfBirth?.toDate(),
              lastModifiedAt: data.lastModifiedAt?.toDate ? data.lastModifiedAt.toDate() : data.lastModifiedAt,
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
      });
    } else {
      setPositions([]);
      setPersonnel([]);
      if (!db) setIsInitialized(true);
      else setIsInitialized(false);
    }
  }, [user, performOneTimeMigration]);

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

    // Optimistic UI Update
    const originalPositions = positions;
    const childPositionsToUpdate = positions.filter(p => p.reportsTo === positionId);
    setPositions(prev => {
        const withoutDeleted = prev.filter(p => p.id !== positionId);
        return withoutDeleted.map(p => 
            p.reportsTo === positionId ? { ...p, reportsTo: null } : p
        );
    });

    try {
      const batch = writeBatch(db);
      
      const positionRef = doc(db, 'merkez-positions', positionId);
      batch.delete(positionRef);
      
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
      setPositions(originalPositions); // Revert on error
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Pozisyon silinirken bir hata oluştu.",
      });
    }
  }, [user, positions, db, toast]);


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
    
    // Optimistic UI Update
    const originalPersonnel = personnel;
    const originalPositions = positions;
    setPersonnel(prev => prev.filter(p => p.id !== personnelId));
    setPositions(prev => prev.map(p => 
        p.assignedPersonnelId === personnelId ? { ...p, assignedPersonnelId: null } : p
    ));

    try {
      const batch = writeBatch(db);
      
      const personnelRef = doc(db, 'merkez-personnel', personnelId);
      batch.delete(personnelRef);
      
      const assignedPositions = originalPositions.filter(p => p.assignedPersonnelId === personnelId);
      assignedPositions.forEach(pos => {
        const posRef = doc(db, 'merkez-positions', pos.id);
        batch.set(posRef, {
          assignedPersonnelId: null,
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
      setPersonnel(originalPersonnel); // Revert on error
      setPositions(originalPositions);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Personel silinirken bir hata oluştu.",
      });
    }
  }, [user, personnel, positions, db, toast]);

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
