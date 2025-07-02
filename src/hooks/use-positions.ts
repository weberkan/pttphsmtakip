
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Position, Personnel } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { initialPositionsData, initialPersonnelData } from '@/lib/initial-data';

const LOCAL_STORAGE_POSITIONS_KEY = 'positionTrackerApp_positions';
const LOCAL_STORAGE_PERSONNEL_KEY = 'positionTrackerApp_personnel';


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
            dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
            lastModifiedAt: p.lastModifiedAt ? new Date(p.lastModifiedAt) : null,
          }));
          setPersonnel(parsedPersonnel);
        } else {
          setPersonnel(initialPersonnelData.map(p => ({...p, status: p.status || 'İHS', dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null })));
          localStorage.setItem(LOCAL_STORAGE_PERSONNEL_KEY, JSON.stringify(initialPersonnelData));
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error);
        setPositions(initialPositionsData.map(p => ({...p, startDate: p.startDate ? new Date(p.startDate) : null }))); 
        setPersonnel(initialPersonnelData.map(p => ({...p, status: p.status || 'İHS', dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null })));
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      const positionMap = new Map(positions.map(p => [p.id, p]));
      const updatedPositions = positions.map(p => {
        if (p.reportsTo && !positionMap.has(p.reportsTo)) {
          console.warn(`Position "${p.name}" (${p.id}) has an invalid reportsTo ID: ${p.reportsTo}. Setting to null.`);
          return { ...p, reportsTo: null };
        }
        return p;
      });

      try {
        localStorage.setItem(LOCAL_STORAGE_POSITIONS_KEY, JSON.stringify(updatedPositions));
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

  const batchAddPositions = useCallback((positionList: Omit<Position, 'id'>[]) => {
      const newPositions = positionList.map(p => ({
          ...p,
          id: crypto.randomUUID(),
          lastModifiedBy: user?.registryNumber,
          lastModifiedAt: new Date(),
      }));
      setPositions(prev => [...prev, ...newPositions]);
  }, [user]);

  const updatePosition = useCallback((updatedPosition: Position) => {
    const positionWithAudit = {
      ...updatedPosition,
      lastModifiedBy: user?.registryNumber,
      lastModifiedAt: new Date(),
    };
    setPositions(prev => prev.map(p => p.id === updatedPosition.id ? positionWithAudit : p));
  }, [user]);

  const batchUpdatePositions = useCallback((positionList: Position[]) => {
      const updatesWithAudit = positionList.map(p => ({
          ...p,
          lastModifiedBy: user?.registryNumber,
          lastModifiedAt: new Date(),
      }));
      
      const positionMap = new Map(positions.map(p => [p.id, p]));
      
      updatesWithAudit.forEach(update => {
          positionMap.set(update.id, update);
      });

      setPositions(Array.from(positionMap.values()));

  }, [user, positions]);

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

  const batchAddPersonnel = useCallback((personnelList: Omit<Personnel, 'id'>[]) => {
    const newPersonnelList = personnelList.map(p => ({
      ...p,
      id: crypto.randomUUID(),
      lastModifiedBy: user?.registryNumber,
      lastModifiedAt: new Date(),
    }));
    setPersonnel(prev => [...prev, ...newPersonnelList]);
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
