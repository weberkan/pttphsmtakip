
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
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
  QueryDocumentSnapshot,
  DocumentData
} from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 25;

export function usePositions() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for paginated data
  const [positions, setPositions] = useState<Position[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  
  // State for all personnel (needed for dropdowns, etc.)
  const [allPersonnel, setAllPersonnel] = useState<Personnel[]>([]);

  // Loading and pagination state
  const [loading, setLoading] = useState(true);
  const [firstVisible, setFirstVisible] = useState<Record<string, QueryDocumentSnapshot<DocumentData> | null>>({});
  const [lastVisible, setLastVisible] = useState<Record<string, QueryDocumentSnapshot<DocumentData> | null>>({});
  const [pageNumber, setPageNumber] = useState(1);
  const [isLastPage, setIsLastPage] = useState<Record<string, boolean>>({});
  const [totalCount, setTotalCount] = useState({ positions: 0, personnel: 0 });

  const pageInfo = {
    start: (pageNumber - 1) * PAGE_SIZE + 1,
    end: Math.min(pageNumber * PAGE_SIZE, totalCount.positions),
    isFirst: pageNumber === 1,
    isLast: isLastPage.positions,
  };

  const fetchTotalCounts = useCallback(async () => {
    if (!db) return;
    try {
        const [positionsSnapshot, personnelSnapshot] = await Promise.all([
            getDocs(collection(db, 'merkez-positions')),
            getDocs(collection(db, 'merkez-personnel'))
        ]);
        setTotalCount({
            positions: positionsSnapshot.size,
            personnel: personnelSnapshot.size
        });
    } catch (error) {
        console.error("Error fetching total counts: ", error);
    }
  }, [db]);

  useEffect(() => {
    fetchTotalCounts();
  }, [fetchTotalCounts]);


  const fetchPage = useCallback(async (collectionName: 'positions' | 'personnel', constraint?: any) => {
    if (!user || !db) return;
    setLoading(true);

    const isPositions = collectionName === 'positions';
    const collRef = collection(db, isPositions ? 'merkez-positions' : 'merkez-personnel');
    const q = query(
        collRef,
        isPositions ? orderBy("department") : orderBy("registryNumber"),
        orderBy("name"),
        ... (constraint ? [constraint] : []),
        limit(PAGE_SIZE + 1)
    );

    try {
        const documentSnapshots = await getDocs(q);
        const fetchedData = documentSnapshots.docs.slice(0, PAGE_SIZE).map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startDate: data.startDate ? (data.startDate as Timestamp).toDate() : null,
                dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : null,
                lastModifiedAt: data.lastModifiedAt ? (data.lastModifiedAt as Timestamp).toDate() : null,
            } as any;
        });

        if (isPositions) setPositions(fetchedData);
        else setPersonnel(fetchedData);
        
        setIsLastPage(prev => ({...prev, [collectionName]: documentSnapshots.docs.length <= PAGE_SIZE}));
        setFirstVisible(prev => ({ ...prev, [collectionName]: documentSnapshots.docs[0] ?? null }));
        setLastVisible(prev => ({ ...prev, [collectionName]: documentSnapshots.docs[documentSnapshots.docs.length > PAGE_SIZE ? PAGE_SIZE - 1 : documentSnapshots.docs.length -1] ?? null }));

    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        toast({ title: 'Veri Yükleme Hatası', description: `Veriler yüklenirken bir sorun oluştu: ${error}`, variant: 'destructive'});
    } finally {
        setLoading(false);
    }
  }, [user, db, toast]);
  
  const fetchNextPage = (collectionName: 'positions' | 'personnel') => {
      if (lastVisible[collectionName]) {
          fetchPage(collectionName, startAfter(lastVisible[collectionName]));
          setPageNumber(prev => prev + 1);
      }
  };

  const fetchPrevPage = (collectionName: 'positions' | 'personnel') => {
      if (firstVisible[collectionName]) {
          fetchPage(collectionName, endBefore(firstVisible[collectionName]));
           setPageNumber(prev => Math.max(1, prev - 1));
      }
  };
  
  useEffect(() => {
    fetchPage('positions');
    fetchPage('personnel');
  }, []);

  useEffect(() => {
    if (!user || !db) {
        setAllPersonnel([]);
        return;
    }
    const personnelUnsubscribe = onSnapshot(collection(db, "merkez-personnel"), (snapshot) => {
        const allFetchedPersonnel = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : null,
                lastModifiedAt: data.lastModifiedAt ? (data.lastModifiedAt as Timestamp).toDate() : null,
            } as Personnel;
        });
        setAllPersonnel(allFetchedPersonnel);
    });
    return () => personnelUnsubscribe();
  }, [user, db]);

  const addPosition = useCallback(async (positionData: Omit<Position, 'id'>) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'merkez-positions'), {
      ...positionData,
      lastModifiedBy: user.uid,
      lastModifiedAt: Timestamp.now(),
    });
    fetchPage('positions');
  }, [user, fetchPage]);

  const batchAddPositions = useCallback(async (positionList: Omit<Position, 'id'>[]) => {
    if (!user || !db) return;
    const batch = writeBatch(db);
    positionList.forEach(positionData => {
      const docRef = doc(collection(db, 'merkez-positions'));
      batch.set(docRef, {
        ...positionData,
        lastModifiedBy: user.uid,
        lastModifiedAt: Timestamp.now(),
      });
    });
    await batch.commit();
    fetchPage('positions');
  }, [user, fetchPage]);

  const updatePosition = useCallback(async (updatedPosition: Position) => {
    if (!user || !db) return;
    const { id, ...data } = updatedPosition;
    await setDoc(doc(db, 'merkez-positions', id), {
      ...data,
      lastModifiedBy: user.uid,
      lastModifiedAt: Timestamp.now(),
    }, { merge: true });
    fetchPage('positions');
  }, [user, fetchPage]);

  const batchUpdatePositions = useCallback(async (positionList: Position[]) => {
    if (!user || !db) return;
    const batch = writeBatch(db);
    positionList.forEach(position => {
      const { id, ...data } = position;
      const docRef = doc(db, 'merkez-positions', id);
      batch.set(docRef, {
        ...data,
        lastModifiedBy: user.uid,
        lastModifiedAt: Timestamp.now(),
      }, { merge: true });
    });
    await batch.commit();
    fetchPage('positions');
  }, [user, fetchPage]);

  const deletePosition = useCallback(async (positionId: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'merkez-positions', positionId));
      toast({ title: "Pozisyon Silindi", description: "Merkez pozisyonu başarıyla silindi." });
      fetchPage('positions');
    } catch (error) {
      console.error("Error deleting Merkez position:", error);
      toast({ variant: "destructive", title: "Hata", description: "Pozisyon silinirken bir hata oluştu." });
    }
  }, [user, db, toast, fetchPage]);


  const addPersonnel = useCallback(async (personnelData: Omit<Personnel, 'id' | 'status'> & { status: 'İHS' | '399' }) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'merkez-personnel'), {
      ...personnelData,
      lastModifiedBy: user.uid,
      lastModifiedAt: Timestamp.now(),
    });
    fetchPage('personnel');
  }, [user, fetchPage]);

  const batchAddPersonnel = useCallback(async (personnelList: Omit<Personnel, 'id'>[]) => {
    if (!user || !db) return;
    const batch = writeBatch(db);
    personnelList.forEach(personnelData => {
      const docRef = doc(collection(db, 'merkez-personnel'));
      batch.set(docRef, {
        ...personnelData,
        lastModifiedBy: user.uid,
        lastModifiedAt: Timestamp.now(),
      });
    });
    await batch.commit();
     fetchPage('personnel');
  }, [user, fetchPage]);

  const updatePersonnel = useCallback(async (updatedPersonnel: Personnel) => {
    if (!user || !db) return;
    const { id, ...data } = updatedPersonnel;
    await setDoc(doc(db, 'merkez-personnel', id), {
      ...data,
      lastModifiedBy: user.uid,
      lastModifiedAt: Timestamp.now(),
    }, { merge: true });
     fetchPage('personnel');
  }, [user, fetchPage]);

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
          lastModifiedBy: user.uid,
          lastModifiedAt: Timestamp.now(),
        }, { merge: true });
      });

      await batch.commit();
      toast({ title: "Personel Silindi", description: "Merkez personeli başarıyla silindi ve atamaları kaldırıldı." });
      fetchPage('personnel');
      fetchPage('positions');
    } catch (error) {
      console.error("Error deleting Merkez personnel:", error);
      toast({ variant: "destructive", title: "Hata", description: "Personel silinirken bir hata oluştu." });
    }
  }, [user, db, toast, positions, fetchPage]);

  return { 
    positions, 
    personnel,
    allPersonnel,
    addPosition, 
    batchAddPositions,
    updatePosition, 
    batchUpdatePositions,
    deletePosition, 
    addPersonnel,
    batchAddPersonnel,
    updatePersonnel,
    deletePersonnel,
    loading,
    page: pageInfo,
    totalCount,
    fetchNextPage,
    fetchPrevPage,
  };
}

    
