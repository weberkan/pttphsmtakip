
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { TasraPosition, Personnel } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch,
  getDocs,
  Timestamp
} from "firebase/firestore";

const LOCAL_STORAGE_POSITIONS_KEY = 'tasraTrackerApp_positions';
const LOCAL_STORAGE_PERSONNEL_KEY = 'tasraTrackerApp_personnel';
const MIGRATION_KEY = 'tasraTrackerApp_firestoreMigrationComplete';

export function useTasraPositions() {
  const { user } = useAuth();
  const [tasraPositions, setTasraPositions] = useState<TasraPosition[]>([]);
  const [tasraPersonnel, setTasraPersonnel] = useState<Personnel[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const performOneTimeMigration = useCallback(async () => {
    if (localStorage.getItem(MIGRATION_KEY)) {
      return; // Migration already done
    }
    
    console.log("Checking if tasra migration is needed...");

    const positionsCollectionRef = collection(db, 'tasra-positions');
    const personnelCollectionRef = collection(db, 'tasra-personnel');

    const positionsSnapshot = await getDocs(positionsCollectionRef);
    const personnelSnapshot = await getDocs(personnelCollectionRef);

    if (positionsSnapshot.empty && personnelSnapshot.empty) {
      const localPositionsStr = localStorage.getItem(LOCAL_STORAGE_POSITIONS_KEY);
      const localPersonnelStr = localStorage.getItem(LOCAL_STORAGE_PERSONNEL_KEY);

      const localPositions = localPositionsStr ? JSON.parse(localPositionsStr) : [];
      const localPersonnel = localPersonnelStr ? JSON.parse(localPersonnelStr) : [];
      
      if (localPositions.length > 0 || localPersonnel.length > 0) {
        console.log("Performing one-time data migration for tasra from localStorage to Firestore...");
        const batch = writeBatch(db);

        localPositions.forEach((p: any) => {
          const docRef = doc(positionsCollectionRef);
          batch.set(docRef, {
            ...p,
            startDate: p.startDate ? Timestamp.fromDate(new Date(p.startDate)) : null,
          });
        });

        localPersonnel.forEach((p: any) => {
          const docRef = doc(personnelCollectionRef);
          batch.set(docRef, {
            ...p,
            status: p.status || 'İHS',
            dateOfBirth: p.dateOfBirth ? Timestamp.fromDate(new Date(p.dateOfBirth)) : null
          });
        });

        await batch.commit();
        console.log("Tasra migration successful.");
      }
    }
    
    localStorage.setItem(MIGRATION_KEY, 'true');
    localStorage.removeItem(LOCAL_STORAGE_POSITIONS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_PERSONNEL_KEY);

  }, []);

  useEffect(() => {
    if (user) {
      performOneTimeMigration().then(() => {
        const positionsUnsubscribe = onSnapshot(collection(db, "tasra-positions"), (snapshot) => {
          const fetchedPositions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              startDate: data.startDate?.toDate(),
              lastModifiedAt: data.lastModifiedAt?.toDate(),
            } as TasraPosition;
          });
          setTasraPositions(fetchedPositions);
          setIsInitialized(true);
        });

        const personnelUnsubscribe = onSnapshot(collection(db, "tasra-personnel"), (snapshot) => {
          const fetchedPersonnel = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              dateOfBirth: data.dateOfBirth?.toDate(),
              lastModifiedAt: data.lastModifiedAt?.toDate(),
            } as Personnel;
          });
          setTasraPersonnel(fetchedPersonnel);
          setIsInitialized(true);
        });

        return () => {
          positionsUnsubscribe();
          personnelUnsubscribe();
        };
      });
    } else {
      setTasraPositions([]);
      setTasraPersonnel([]);
      setIsInitialized(false);
    }
  }, [user, performOneTimeMigration]);

  const addTasraPosition = useCallback(async (positionData: Omit<TasraPosition, 'id'>) => {
    if (!user) return;
    await addDoc(collection(db, 'tasra-positions'), {
      ...positionData,
      lastModifiedBy: user.registryNumber,
      lastModifiedAt: Timestamp.now(),
    });
  }, [user]);

  const batchAddTasraPosition = useCallback(async (positionList: Omit<TasraPosition, 'id'>[]) => {
    if (!user) return;
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
    if (!user) return;
    const { id, ...data } = updatedPosition;
    await updateDoc(doc(db, 'tasra-positions', id), {
      ...data,
      lastModifiedBy: user.registryNumber,
      lastModifiedAt: Timestamp.now(),
    });
  }, [user]);

  const batchUpdateTasraPosition = useCallback(async (positionList: TasraPosition[]) => {
    if (!user) return;
    const batch = writeBatch(db);
    positionList.forEach(position => {
      const { id, ...data } = position;
      const docRef = doc(db, 'tasra-positions', id);
      batch.update(docRef, {
        ...data,
        lastModifiedBy: user.registryNumber,
        lastModifiedAt: Timestamp.now(),
      });
    });
    await batch.commit();
  }, [user]);

  const deleteTasraPosition = useCallback(async (positionId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'tasra-positions', positionId));
  }, [user]);

  const addTasraPersonnel = useCallback(async (personnelData: Omit<Personnel, 'id'>) => {
    if (!user) return;
    await addDoc(collection(db, 'tasra-personnel'), {
      ...personnelData,
      lastModifiedBy: user.registryNumber,
      lastModifiedAt: Timestamp.now(),
    });
  }, [user]);

  const batchAddTasraPersonnel = useCallback(async (personnelList: Omit<Personnel, 'id'>[]) => {
    if (!user) return;
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
    if (!user) return;
    const { id, ...data } = updatedPersonnel;
    await updateDoc(doc(db, 'tasra-personnel', id), {
      ...data,
      lastModifiedBy: user.registryNumber,
      lastModifiedAt: Timestamp.now(),
    });
  }, [user]);

  const deleteTasraPersonnel = useCallback(async (personnelId: string) => {
    if (!user) return;
    const batch = writeBatch(db);

    // Delete the personnel
    const personnelRef = doc(db, 'tasra-personnel', personnelId);
    batch.delete(personnelRef);

    // Unassign from positions
    const assignedPositions = tasraPositions.filter(p => p.assignedPersonnelId === personnelId);
    assignedPositions.forEach(pos => {
      const posRef = doc(db, 'tasra-positions', pos.id);
      batch.update(posRef, {
        assignedPersonnelId: null,
        lastModifiedBy: user.registryNumber,
        lastModifiedAt: Timestamp.now(),
      });
    });
    
    await batch.commit();
  }, [user, tasraPositions]);

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
