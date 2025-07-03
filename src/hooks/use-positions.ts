
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Position, Personnel } from '@/lib/types';
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
  Timestamp,
  setDoc
} from "firebase/firestore";
import { initialPositionsData, initialPersonnelData } from '@/lib/initial-data';

const LOCAL_STORAGE_POSITIONS_KEY = 'positionTrackerApp_positions';
const LOCAL_STORAGE_PERSONNEL_KEY = 'positionTrackerApp_personnel';
const MIGRATION_KEY = 'positionTrackerApp_firestoreMigrationComplete';

export function usePositions() {
  const { user } = useAuth();
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
        const localPositionsStr = localStorage.getItem(LOCAL_STORAGE_POSITIONS_KEY);
        const localPersonnelStr = localStorage.getItem(LOCAL_STORAGE_PERSONNEL_KEY);
        
        const localPositions = localPositionsStr ? JSON.parse(localPositionsStr) : initialPositionsData;
        const localPersonnel = localPersonnelStr ? JSON.parse(localPersonnelStr) : initialPersonnelData;
        
        if (localPositions.length > 0 || localPersonnel.length > 0) {
          console.log("Performing one-time data migration for merkez from localStorage to Firestore...");
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
          console.log("Merkez migration successful.");
        }
      }
      
      localStorage.setItem(MIGRATION_KEY, 'true');
      localStorage.removeItem(LOCAL_STORAGE_POSITIONS_KEY);
      localStorage.removeItem(LOCAL_STORAGE_PERSONNEL_KEY);

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
          setPositions(fetchedPositions);
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
          setPersonnel(fetchedPersonnel);
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
    const batch = writeBatch(db);
    
    // Delete the position
    const positionRef = doc(db, 'merkez-positions', positionId);
    batch.delete(positionRef);
    
    // Update children positions
    const childPositions = positions.filter(p => p.reportsTo === positionId);
    childPositions.forEach(child => {
        const childRef = doc(db, 'merkez-positions', child.id);
        batch.update(childRef, { 
            reportsTo: null,
            lastModifiedBy: user.registryNumber,
            lastModifiedAt: Timestamp.now(),
        });
    });

    await batch.commit();
  }, [user, positions]);


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
    
    const batch = writeBatch(db);
    
    // Delete the personnel
    const personnelRef = doc(db, 'merkez-personnel', personnelId);
    batch.delete(personnelRef);
    
    // Unassign this person from any positions
    const assignedPositions = positions.filter(p => p.assignedPersonnelId === personnelId);
    assignedPositions.forEach(pos => {
      const posRef = doc(db, 'merkez-positions', pos.id);
      batch.update(posRef, {
        assignedPersonnelId: null,
        lastModifiedBy: user.registryNumber,
        lastModifiedAt: Timestamp.now(),
      });
    });

    await batch.commit();
  }, [user, positions]);

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
