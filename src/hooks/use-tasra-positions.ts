
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

export function useTasraPositions() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [tasraPositions, setTasraPositions] = useState<TasraPosition[]>([]);
  const [tasraPersonnel, setTasraPersonnel] = useState<Personnel[]>([]);
  
  const [allPersonnel, setAllPersonnel] = useState<Personnel[]>([]);

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
            getDocs(collection(db, 'tasra-positions')),
            getDocs(collection(db, 'tasra-personnel'))
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
    const collRef = collection(db, isPositions ? 'tasra-positions' : 'tasra-personnel');
    const q = query(
        collRef,
        isPositions ? orderBy("unit") : orderBy("registryNumber"),
        ...(isPositions ? [orderBy("dutyLocation")] : [orderBy("firstName")]),
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

        if (isPositions) setTasraPositions(fetchedData);
        else setTasraPersonnel(fetchedData);
        
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
    const personnelUnsubscribe = onSnapshot(collection(db, "tasra-personnel"), (snapshot) => {
        const allFetchedPersonnel = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Personnel));
        setAllPersonnel(allFetchedPersonnel);
    });
    return () => personnelUnsubscribe();
  }, [user, db]);

  const addTasraPosition = useCallback(async (positionData: Omit<TasraPosition, 'id'>) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'tasra-positions'), {
      ...positionData,
      lastModifiedBy: user.uid,
      lastModifiedAt: Timestamp.now(),
    });
    fetchPage('positions');
  }, [user, fetchPage]);

  const batchAddTasraPosition = useCallback(async (positionList: Omit<TasraPosition, 'id'>[]) => {
    if (!user || !db) return;
    const batch = writeBatch(db);
    positionList.forEach(positionData => {
      const docRef = doc(collection(db, 'tasra-positions'));
      batch.set(docRef, {
        ...positionData,
        lastModifiedBy: user.uid,
        lastModifiedAt: Timestamp.now(),
      });
    });
    await batch.commit();
    fetchPage('positions');
  }, [user, fetchPage]);

  const updateTasraPosition = useCallback(async (updatedPosition: TasraPosition) => {
    if (!user || !db) return;
    const { id, ...data } = updatedPosition;
    await setDoc(doc(db, 'tasra-positions', id), {
      ...data,
      lastModifiedBy: user.uid,
      lastModifiedAt: Timestamp.now(),
    }, { merge: true });
     fetchPage('positions');
  }, [user, fetchPage]);

  const batchUpdateTasraPosition = useCallback(async (positionList: TasraPosition[]) => {
    if (!user || !db) return;
    const batch = writeBatch(db);
    positionList.forEach(position => {
      const { id, ...data } = position;
      const docRef = doc(db, 'tasra-positions', id);
      batch.set(docRef, {
        ...data,
        lastModifiedBy: user.uid,
        lastModifiedAt: Timestamp.now(),
      }, { merge: true });
    });
    await batch.commit();
     fetchPage('positions');
  }, [user, fetchPage]);

  const deleteTasraPosition = useCallback(async (positionId: string) => {
    if (!user || !db) return;
    
    try {
      await deleteDoc(doc(db, 'tasra-positions', positionId));
      toast({ title: "Pozisyon Silindi", description: "Taşra pozisyonu başarıyla silindi." });
      fetchPage('positions');
    } catch (error) {
      console.error("Error deleting Tasra position:", error);
      toast({ variant: "destructive", title: "Hata", description: "Pozisyon silinirken bir hata oluştu." });
    }
  }, [user, db, toast, fetchPage]);


  const addTasraPersonnel = useCallback(async (personnelData: Omit<Personnel, 'id'>) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'tasra-personnel'), {
      ...personnelData,
      lastModifiedBy: user.uid,
      lastModifiedAt: Timestamp.now(),
    });
    fetchPage('personnel');
  }, [user, fetchPage]);

  const batchAddTasraPersonnel = useCallback(async (personnelList: Omit<Personnel, 'id'>[]) => {
    if (!user || !db) return;
    const batch = writeBatch(db);
    personnelList.forEach(personnelData => {
      const docRef = doc(collection(db, 'tasra-personnel'));
      batch.set(docRef, {
        ...personnelData,
        lastModifiedBy: user.uid,
        lastModifiedAt: Timestamp.now(),
      });
    });
    await batch.commit();
    fetchPage('personnel');
  }, [user, fetchPage]);

  const updateTasraPersonnel = useCallback(async (updatedPersonnel: Personnel) => {
    if (!user || !db) return;
    const { id, ...data } = updatedPersonnel;
    await setDoc(doc(db, 'tasra-personnel', id), {
      ...data,
      lastModifiedBy: user.uid,
      lastModifiedAt: Timestamp.now(),
    }, { merge: true });
    fetchPage('personnel');
  }, [user, fetchPage]);

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
          lastModifiedBy: user.uid,
          lastModifiedAt: Timestamp.now(),
        }, { merge: true });
      });
      
      await batch.commit();
  
      toast({ title: "Personel Silindi", description: "Taşra personeli başarıyla silindi ve atamaları kaldırıldı." });
      fetchPage('personnel');
      fetchPage('positions');
    } catch (error) {
      console.error("Error deleting Tasra personnel:", error);
      toast({ variant: "destructive", title: "Hata", description: "Personel silinirken bir hata oluştu." });
    }
  }, [user, db, toast, tasraPositions, fetchPage]);

  return { 
    tasraPositions, 
    tasraPersonnel,
    allPersonnel,
    addTasraPosition, 
    batchAddTasraPosition,
    updateTasraPosition, 
    batchUpdateTasraPosition,
    deleteTasraPosition, 
    addTasraPersonnel,
    batchAddTasraPersonnel,
    updateTasraPersonnel,
    deleteTasraPersonnel,
    loading,
    page: pageInfo,
    totalCount,
    fetchNextPage,
    fetchPrevPage,
  };
}

    
