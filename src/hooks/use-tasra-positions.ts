
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { TasraPosition, Personnel } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';

const LOCAL_STORAGE_POSITIONS_KEY = 'tasraTrackerApp_positions';
const LOCAL_STORAGE_PERSONNEL_KEY = 'tasraTrackerApp_personnel';

const initialPersonnelData: Personnel[] = [];
const initialPositionsData: TasraPosition[] = [];

export function useTasraPositions() {
  const { user } = useAuth();
  const [tasraPositions, setTasraPositions] = useState<TasraPosition[]>([]);
  const [tasraPersonnel, setTasraPersonnel] = useState<Personnel[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedPositions = localStorage.getItem(LOCAL_STORAGE_POSITIONS_KEY);
        if (storedPositions) {
          const parsedPositions = JSON.parse(storedPositions).map((p: TasraPosition) => ({
            ...p,
            startDate: p.startDate ? new Date(p.startDate) : null,
            lastModifiedAt: p.lastModifiedAt ? new Date(p.lastModifiedAt) : null,
          }));
          setTasraPositions(parsedPositions);
        } else {
          setTasraPositions(initialPositionsData);
          localStorage.setItem(LOCAL_STORAGE_POSITIONS_KEY, JSON.stringify(initialPositionsData));
        }

        const storedPersonnel = localStorage.getItem(LOCAL_STORAGE_PERSONNEL_KEY);
        if (storedPersonnel) {
          const parsedPersonnel = JSON.parse(storedPersonnel).map((p: Personnel) => ({
            ...p,
            status: p.status || 'İHS',
            dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
            lastModifiedAt: p.lastModifiedAt ? new Date(p.lastModifiedAt) : null,
          }));
          setTasraPersonnel(parsedPersonnel);
        } else {
          setTasraPersonnel(initialPersonnelData);
          localStorage.setItem(LOCAL_STORAGE_PERSONNEL_KEY, JSON.stringify(initialPersonnelData));
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error);
        setTasraPositions(initialPositionsData); 
        setTasraPersonnel(initialPersonnelData);
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      try {
        localStorage.setItem(LOCAL_STORAGE_POSITIONS_KEY, JSON.stringify(tasraPositions));
      } catch (error) {
        console.error("Error saving tasra positions to localStorage:", error);
      }
    }
  }, [tasraPositions, isInitialized]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      try {
        localStorage.setItem(LOCAL_STORAGE_PERSONNEL_KEY, JSON.stringify(tasraPersonnel));
      } catch (error) {
        console.error("Error saving tasra personnel to localStorage:", error);
      }
    }
  }, [tasraPersonnel, isInitialized]);

  const addTasraPosition = useCallback((positionData: Omit<TasraPosition, 'id'>) => {
    const newPosition = { 
      ...positionData, 
      id: crypto.randomUUID(),
      lastModifiedBy: user?.registryNumber,
      lastModifiedAt: new Date(),
    };
    setTasraPositions(prev => [...prev, newPosition]);
  }, [user]);

  const updateTasraPosition = useCallback((updatedPosition: TasraPosition) => {
    const positionWithAudit = {
      ...updatedPosition,
      lastModifiedBy: user?.registryNumber,
      lastModifiedAt: new Date(),
    };
    setTasraPositions(prev => prev.map(p => p.id === updatedPosition.id ? positionWithAudit : p));
  }, [user]);

  const deleteTasraPosition = useCallback((positionId: string) => {
    setTasraPositions(prev => prev.filter(p => p.id !== positionId));
  }, []);

  const addTasraPersonnel = useCallback((personnelData: Omit<Personnel, 'id'>) => {
    const newPersonnel = { 
      ...personnelData, 
      id: crypto.randomUUID(),
      lastModifiedBy: user?.registryNumber,
      lastModifiedAt: new Date(),
    };
    setTasraPersonnel(prev => [...prev, newPersonnel]);
  }, [user]);

  const updateTasraPersonnel = useCallback((updatedPersonnel: Personnel) => {
    const personnelWithAudit = {
      ...updatedPersonnel,
      lastModifiedBy: user?.registryNumber,
      lastModifiedAt: new Date(),
    };
    setTasraPersonnel(prev => prev.map(p => p.id === updatedPersonnel.id ? personnelWithAudit : p));
  }, [user]);

  const deleteTasraPersonnel = useCallback((personnelId: string) => {
    setTasraPersonnel(prevPersonnel => prevPersonnel.filter(p => p.id !== personnelId));
    setTasraPositions(prevPositions => 
      prevPositions.map(pos => 
        pos.assignedPersonnelId === personnelId 
          ? { 
              ...pos, 
              assignedPersonnelId: null, 
              lastModifiedBy: user?.registryNumber,
              lastModifiedAt: new Date(),
            } 
          : pos
      )
    );
  }, [user]);

  return { 
    tasraPositions, 
    tasraPersonnel,
    addTasraPosition, 
    updateTasraPosition, 
    deleteTasraPosition, 
    addTasraPersonnel,
    updateTasraPersonnel,
    deleteTasraPersonnel,
    isInitialized 
  };
}
