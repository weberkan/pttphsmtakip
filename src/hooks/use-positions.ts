
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
  
  // State for all data (for search, filter, and dashboard)
  const [allPositions, setAllPositions] = useState<Position[]>([]);
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
    const collRef = collection(db, isPositions ? 'merkez-positions' : 'merkez-personnel');
    const q = query(
        collRef,
        isPositions ? orderBy("department") : orderBy("registryNumber"),
        ...(isPositions ? [orderBy("name")] : []),
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
            setPositions(fetchedData);
            setPositionsIsLastPage(isLast);
            setPositionsFirstVisible(documentSnapshots.docs[0] ?? null);
            setPositionsLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1] ?? null);
            setPositionsPageNumber(pageNum);
        } else {
            setPersonnel(fetchedData);
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
        setAllPositions([]);
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

    const personnelUnsubscribe = onSnapshot(query(collection(db, "merkez-personnel"), orderBy("registryNumber")), (snapshot) => {
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
    
    const positionsUnsubscribe = onSnapshot(query(collection(db, "merkez-positions"), orderBy("department"), orderBy("name")), (snapshot) => {
        const allFetchedPositions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startDate: data.startDate ? (data.startDate as Timestamp).toDate() : null,
                lastModifiedAt: data.lastModifiedAt ? (data.lastModifiedAt as Timestamp).toDate() : null,
            } as Position;
        });
        setAllPositions(allFetchedPositions);
        setTotalCount(prev => ({...prev, positions: snapshot.size}));
        checkInitialized();
    });

    return () => {
        personnelUnsubscribe();
        positionsUnsubscribe();
    };
  }, [user, db]);

  const addPosition = useCallback(async (positionData: Omit<Position, 'id'>) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'merkez-positions'), {
      ...positionData,
      lastModifiedBy: user.uid,
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
        lastModifiedBy: user.uid,
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
      lastModifiedBy: user.uid,
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
        lastModifiedBy: user.uid,
        lastModifiedAt: Timestamp.now(),
      }, { merge: true });
    });
    await batch.commit();
  }, [user]);

  const deletePosition = useCallback(async (positionId: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'merkez-positions', positionId));
      toast({ title: "Pozisyon Silindi", description: "Merkez pozisyonu başarıyla silindi." });
    } catch (error) {
      console.error("Error deleting Merkez position:", error);
      toast({ variant: "destructive", title: "Hata", description: "Pozisyon silinirken bir hata oluştu." });
    }
  }, [user, db, toast]);


  const addPersonnel = useCallback(async (personnelData: Omit<Personnel, 'id' | 'status'> & { status: 'İHS' | '399' }) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'merkez-personnel'), {
      ...personnelData,
      lastModifiedBy: user.uid,
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
        lastModifiedBy: user.uid,
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
      lastModifiedBy: user.uid,
      lastModifiedAt: Timestamp.now(),
    }, { merge: true });
  }, [user]);

  const deletePersonnel = useCallback(async (personnelId: string) => {
    if (!user || !db) return;
    
    try {
      const batch = writeBatch(db);
      
      const personnelRef = doc(db, 'merkez-personnel', personnelId);
      batch.delete(personnelRef);
      
      const assignedPositions = allPositions.filter(p => p.assignedPersonnelId === personnelId);
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
    } catch (error) {
      console.error("Error deleting Merkez personnel:", error);
      toast({ variant: "destructive", title: "Hata", description: "Personel silinirken bir hata oluştu." });
    }
  }, [user, db, toast, allPositions]);

  return { 
    positions, 
    personnel,
    allPositions,
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
    isInitialized,
    totalCount,
    positionsPageInfo,
    personnelPageInfo,
    fetchNextPage,
    fetchPrevPage,
  };
}
