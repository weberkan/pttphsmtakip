
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Position, Personnel } from '@/lib/types';

const LOCAL_STORAGE_POSITIONS_KEY = 'positionTrackerApp_positions';
const LOCAL_STORAGE_PERSONNEL_KEY = 'positionTrackerApp_personnel';

const initialPersonnelData: Personnel[] = [];
const initialPositionsData: Position[] = [];

export function usePositions() {
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
          }));
          setPositions(parsedPositions);
        } else {
          setPositions(initialPositionsData.map(p => ({...p, startDate: p.startDate ? new Date(p.startDate) : null })));
          localStorage.setItem(LOCAL_STORAGE_POSITIONS_KEY, JSON.stringify(initialPositionsData));
        }

        const storedPersonnel = localStorage.getItem(LOCAL_STORAGE_PERSONNEL_KEY);
        if (storedPersonnel) {
          setPersonnel(JSON.parse(storedPersonnel));
        } else {
          setPersonnel(initialPersonnelData);
          localStorage.setItem(LOCAL_STORAGE_PERSONNEL_KEY, JSON.stringify(initialPersonnelData));
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error);
        setPositions(initialPositionsData.map(p => ({...p, startDate: p.startDate ? new Date(p.startDate) : null }))); 
        setPersonnel(initialPersonnelData);
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
    setPositions(prev => [...prev, { ...positionData, id: crypto.randomUUID() }]);
  }, []);

  const updatePosition = useCallback((updatedPosition: Position) => {
    setPositions(prev => prev.map(p => p.id === updatedPosition.id ? updatedPosition : p));
  }, []);

  const deletePosition = useCallback((positionId: string) => {
    setPositions(prev => {
      return prev.filter(p => p.id !== positionId)
                 .map(p => p.reportsTo === positionId ? { ...p, reportsTo: null } : p);
    });
  }, []);

  const addPersonnel = useCallback((personnelData: Omit<Personnel, 'id'>) => {
    setPersonnel(prev => [...prev, { ...personnelData, id: crypto.randomUUID() }]);
  }, []);

  const updatePersonnel = useCallback((updatedPersonnel: Personnel) => {
    setPersonnel(prev => prev.map(p => p.id === updatedPersonnel.id ? updatedPersonnel : p));
  }, []);

  const deletePersonnel = useCallback((personnelId: string) => {
    setPersonnel(prevPersonnel => prevPersonnel.filter(p => p.id !== personnelId));
    setPositions(prevPositions => 
      prevPositions.map(pos => 
        pos.assignedPersonnelId === personnelId 
          ? { ...pos, assignedPersonnelId: null } 
          : pos
      )
    );
  }, []);

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
