
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Position, Personnel } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';

const LOCAL_STORAGE_POSITIONS_KEY = 'positionTrackerApp_positions';
const LOCAL_STORAGE_PERSONNEL_KEY = 'positionTrackerApp_personnel';

const initialPersonnelData: Personnel[] = [];
const initialPositionsData: Position[] = [];

export function usePositions() {
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedPositions = localStorage.getItem(LOCAL_STORAGE_POSITIONS_KEY);
        if (storedPositions) {
          const parsedPositions = JSON.parse(storedPositions).map((p: Position) => ({
            ...p,
            startDate: p.startDate ? new Date(p.startDate) : null,
            lastModifiedAt: p.lastModifiedAt ? new Date(p.lastModifiedAt) : null,
          }));
          setPositions(parsedPositions);
        } else {
          setPositions(initialPositionsData.map(p => ({...p, startDate: p.startDate ? new Date(p.startDate) : null })));
          localStorage.setItem(LOCAL_STORAGE_POSITIONS_KEY, JSON.stringify(initialPositionsData));
        }

        const storedPersonnel = localStorage.getItem(LOCAL_STORAGE_PERSONNEL_KEY);
        if (storedPersonnel) {
          const parsedPersonnel = JSON.parse(storedPersonnel).map((p: Personnel) => ({
            ...p,
            status: p.status || 'İHS',
            lastModifiedAt: p.lastModifiedAt ? new Date(p.lastModifiedAt) : null,
          }));
          setPersonnel(parsedPersonnel);
        } else {
          setPersonnel(initialPersonnelData.map(p => ({...p, status: p.status || 'İHS'})));
          localStorage.setItem(LOCAL_STORAGE_PERSONNEL_KEY, JSON.stringify(initialPersonnelData));
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error);
        setPositions(initialPositionsData.map(p => ({...p, startDate: p.startDate ? new Date(p.startDate) : null }))); 
        setPersonnel(initialPersonnelData.map(p => ({...p, status: p.status || 'İHS'})));
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      try {
        localStorage.setItem(LOCAL_STORAGE_POSITIONS_KEY, JSON.stringify(positions));
      } catch (error) {
        console.error("Error saving positions to localStorage:", error);
      }
    }
  }, [positions, isInitialized]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      try {
        localStorage.setItem(LOCAL_STORAGE_PERSONNEL_KEY, JSON.stringify(personnel));
      } catch (error) {
        console.error("Error saving personnel to localStorage:", error);
      }
    }
  }, [personnel, isInitialized]);

  const addPosition = useCallback((positionData: Omit<Position, 'id'>) => {
    const newPosition = { 
      ...positionData, 
      id: crypto.randomUUID(),
      lastModifiedBy: user?.registryNumber,
      lastModifiedAt: new Date(),
    };
    setPositions(prev => [...prev, newPosition]);
  }, [user]);

  const updatePosition = useCallback((updatedPosition: Position) => {
    const positionWithAudit = {
      ...updatedPosition,
      lastModifiedBy: user?.registryNumber,
      lastModifiedAt: new Date(),
    };
    setPositions(prev => prev.map(p => p.id === updatedPosition.id ? positionWithAudit : p));
  }, [user]);

  const deletePosition = useCallback((positionId: string) => {
    setPositions(prev => {
      const itemToDelete = prev.find(p => p.id === positionId);
      if (itemToDelete) {
         // Optionally log deletion, but for now we just remove it
      }
      return prev.filter(p => p.id !== positionId)
                 .map(p => p.reportsTo === positionId ? { ...p, reportsTo: null } : p);
    });
  }, []);

  const addPersonnel = useCallback((personnelData: Omit<Personnel, 'id' | 'status'> & { status: 'İHS' | '399' }) => {
    const newPersonnel = { 
      ...personnelData, 
      id: crypto.randomUUID(),
      lastModifiedBy: user?.registryNumber,
      lastModifiedAt: new Date(),
    };
    setPersonnel(prev => [...prev, newPersonnel]);
  }, [user]);

  const updatePersonnel = useCallback((updatedPersonnel: Personnel) => {
    const personnelWithAudit = {
      ...updatedPersonnel,
      lastModifiedBy: user?.registryNumber,
      lastModifiedAt: new Date(),
    };
    setPersonnel(prev => prev.map(p => p.id === updatedPersonnel.id ? personnelWithAudit : p));
  }, [user]);

  const deletePersonnel = useCallback((personnelId: string) => {
    setPersonnel(prevPersonnel => prevPersonnel.filter(p => p.id !== personnelId));
    setPositions(prevPositions => 
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
    positions, 
    personnel,
    addPosition, 
    updatePosition, 
    deletePosition, 
    addPersonnel,
    updatePersonnel,
    deletePersonnel,
    isInitialized 
  };
}
