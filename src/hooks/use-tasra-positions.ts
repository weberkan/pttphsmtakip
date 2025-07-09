
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

  // Paginated data
  const [tasraPositions, setTasraPositions] = useState<TasraPosition[]>([]);
  const [tasraPersonnel, setTasraPersonnel] = useState<Personnel[]>([]);
  
  // All data
  const [allTasraPositions, setAllTasraPositions] = useState<TasraPosition[]>([]);
  const [allPersonnel, setAllPersonnel] = useState<Personnel[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Loading and pagination state
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState({ positions: 0, personnel: 0 });

  // Pagination state for Positions
  const [positionsPageNumber, setPositionsPageNumber] = useState(1);
  const [positionsFirstVisible, setPositionsFirstVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [positionsLastVisible, setPositionsLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [positionsIsLastPage, setPositionsIsLastPage] = useState(false);
  
  // Pagination state for Personnel
  const [personnelPageNumber, setPersonnelPageNumber] = useState(1);
  const [personnelFirstVisible, setPersonnelFirstVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [personnelLastVisible, setPersonnelLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [personnelIsLastPage, setPersonnelIsLastPage] = useState(false);

  const positionsPageInfo = {
    start: (positionsPageNumber - 1) * PAGE_SIZE + 1,
    end: positionsIsLastPage ? totalCount.positions : positionsPageNumber * PAGE_SIZE,
    isFirst: positionsPageNumber === 1,
    isLast: positionsIsLastPage,
  };

  const personnelPageInfo = {
    start: (personnelPageNumber - 1) * PAGE_SIZE + 1,
    end: personnelIsLastPage ? totalCount.personnel : personnelPageNumber * PAGE_SIZE,
    isFirst: personnelPageNumber === 1,
    isLast: personnelIsLastPage,
  };
  
  const fetchPage = useCallback(async (collectionName: 'positions' | 'personnel', constraint?: any, pageNum = 1) => {
    if (!user || !db) return;
    setLoading(true);

    const isPositions = collectionName === 'positions';
    const collRef = collection(db, isPositions ? 'tasra-positions' : 'tasra-personnel');
    const q = query(
        collRef,
        isPositions ? orderBy("unit") : orderBy("registryNumber"),
        ...(isPositions ? [orderBy("dutyLocation")] : []),
        ... (constraint ? [constraint] : []),
        limit(PAGE_SIZE)
    );

    try {
        const documentSnapshots = await getDocs(q);
        const fetchedData = documentSnapshots.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startDate: data.startDate ? (data.startDate as Timestamp).toDate() : null,
                dateOfBirth: data.dateOfBirth ? (data.dateOfBirth as Timestamp).toDate() : null,
                lastModifiedAt: data.lastModifiedAt ? (data.lastModifiedAt as Timestamp).toDate() : null,
            } as any;
        });

        const isLast = documentSnapshots.docs.length < PAGE_SIZE;

        if (isPositions) {
            setTasraPositions(fetchedData);
            setPositionsIsLastPage(isLast);
            setPositionsFirstVisible(documentSnapshots.docs[0] ?? null);
            setPositionsLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1] ?? null);
            setPositionsPageNumber(pageNum);
        } else {
            setTasraPersonnel(fetchedData);
            setPersonnelIsLastPage(isLast);
            setPersonnelFirstVisible(documentSnapshots.docs[0] ?? null);
            setPersonnelLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1] ?? null);
            setPersonnelPageNumber(pageNum);
        }

    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        toast({ title: 'Veri Yükleme Hatası', description: `Veriler yüklenirken bir sorun oluştu: ${error}`, variant: 'destructive'});
    } finally {
        setLoading(false);
    }
  }, [user, db, toast]);
  
  const fetchNextPage = (collectionName: 'positions' | 'personnel') => {
      if (collectionName === 'positions' && positionsLastVisible) {
          fetchPage('positions', startAfter(positionsLastVisible), positionsPageNumber + 1);
      } else if (collectionName === 'personnel' && personnelLastVisible) {
          fetchPage('personnel', startAfter(personnelLastVisible), personnelPageNumber + 1);
      }
  };

  const fetchPrevPage = (collectionName: 'positions' | 'personnel') => {
      if (collectionName === 'positions' && positionsFirstVisible) {
          fetchPage('positions', endBefore(positionsFirstVisible), positionsPageNumber - 1);
      } else if (collectionName === 'personnel' && personnelFirstVisible) {
          fetchPage('personnel', endBefore(personnelFirstVisible), personnelPageNumber - 1);
      }
  };

  useEffect(() => {
    fetchPage('positions');
    fetchPage('personnel');
  }, []);

  useEffect(() => {
    if (!user || !db) {
        setAllPersonnel([]);
        setAllTasraPositions([]);
        setIsInitialized(true);
        return;
    }

    let initCount = 0;
    const checkInitialized = () => {
        initCount++;
        if (initCount === 2) {
            setIsInitialized(true);
        }
    };

    const personnelUnsubscribe = onSnapshot(query(collection(db, "tasra-personnel"), orderBy("registryNumber")), (snapshot) => {
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
        setTotalCount(prev => ({...prev, personnel: snapshot.size}));
        checkInitialized();
    });

    const positionsUnsubscribe = onSnapshot(query(collection(db, "tasra-positions"), orderBy("unit"), orderBy("dutyLocation")), (snapshot) => {
        const allFetchedPositions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startDate: data.startDate ? (data.startDate as Timestamp).toDate() : null,
                lastModifiedAt: data.lastModifiedAt ? (data.lastModifiedAt as Timestamp).toDate() : null,
            } as TasraPosition;
        });
        setAllTasraPositions(allFetchedPositions);
        setTotalCount(prev => ({...prev, positions: snapshot.size}));
        checkInitialized();
    });

    return () => {
        personnelUnsubscribe();
        positionsUnsubscribe();
    };
  }, [user, db]);

  const addTasraPosition = useCallback(async (positionData: Omit<TasraPosition, 'id'>) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'tasra-positions'), {
      ...positionData,
      lastModifiedBy: user.uid,
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
        lastModifiedBy: user.uid,
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
      lastModifiedBy: user.uid,
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
        lastModifiedBy: user.uid,
        lastModifiedAt: Timestamp.now(),
      }, { merge: true });
    });
    await batch.commit();
  }, [user]);

  const deleteTasraPosition = useCallback(async (positionId: string) => {
    if (!user || !db) return;
    
    try {
      await deleteDoc(doc(db, 'tasra-positions', positionId));
      toast({ title: "Pozisyon Silindi", description: "Taşra pozisyonu başarıyla silindi." });
    } catch (error) {
      console.error("Error deleting Tasra position:", error);
      toast({ variant: "destructive", title: "Hata", description: "Pozisyon silinirken bir hata oluştu." });
    }
  }, [user, db, toast]);


  const addTasraPersonnel = useCallback(async (personnelData: Omit<Personnel, 'id'>) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'tasra-personnel'), {
      ...personnelData,
      lastModifiedBy: user.uid,
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
        lastModifiedBy: user.uid,
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
      lastModifiedBy: user.uid,
      lastModifiedAt: Timestamp.now(),
    }, { merge: true });
  }, [user]);

  const deleteTasraPersonnel = useCallback(async (personnelId: string) => {
    if (!user || !db) return;

    try {
      const batch = writeBatch(db);
      
      const personnelRef = doc(db, 'tasra-personnel', personnelId);
      batch.delete(personnelRef);
      
      const assignedPositions = allTasraPositions.filter(p => p.assignedPersonnelId === personnelId);
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
    } catch (error) {
      console.error("Error deleting Tasra personnel:", error);
      toast({ variant: "destructive", title: "Hata", description: "Personel silinirken bir hata oluştu." });
    }
  }, [user, db, toast, allTasraPositions]);

  return { 
    tasraPositions, 
    tasraPersonnel,
    allTasraPositions,
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
    isInitialized,
    totalCount,
    positionsPageInfo,
    personnelPageInfo,
    fetchNextPage,
    fetchPrevPage,
  };
}
