"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Position } from '@/lib/types';

const LOCAL_STORAGE_KEY = 'positionTrackerApp_positions';

const initialPositions: Position[] = [
  { id: '1', name: 'CEO', department: 'Executive', employeeName: 'Alice Wonderland', status: 'permanent', reportsTo: null },
  { id: '2', name: 'CTO', department: 'Technology', employeeName: 'Bob The Builder', status: 'permanent', reportsTo: '1' },
  { id: '3', name: 'Marketing Director', department: 'Marketing', employeeName: 'Carol Danvers', status: 'permanent', reportsTo: '1' },
  { id: '4', name: 'Lead Software Engineer', department: 'Engineering', employeeName: 'David Copperfield', status: 'permanent', reportsTo: '2' },
  { id: '5', name: 'Junior Software Engineer', department: 'Engineering', employeeName: 'Eve Harrington', status: 'acting', reportsTo: '4' },
  { id: '6', name: 'Marketing Manager', department: 'Marketing', employeeName: 'Frank Abagnale', status: 'permanent', reportsTo: '3' },
];

export function usePositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedPositions = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedPositions) {
          setPositions(JSON.parse(storedPositions));
        } else {
          setPositions(initialPositions);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialPositions));
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error);
        setPositions(initialPositions); // Fallback to initial if localStorage fails
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(positions));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    }
  }, [positions, isInitialized]);

  const addPosition = useCallback((position: Omit<Position, 'id'>) => {
    setPositions(prev => [...prev, { ...position, id: crypto.randomUUID() }]);
  }, []);

  const updatePosition = useCallback((updatedPosition: Position) => {
    setPositions(prev => prev.map(p => p.id === updatedPosition.id ? updatedPosition : p));
  }, []);

  const deletePosition = useCallback((positionId: string) => {
    setPositions(prev => {
      // Also update reportsTo for children of the deleted position
      return prev.filter(p => p.id !== positionId)
                 .map(p => p.reportsTo === positionId ? { ...p, reportsTo: null } : p);
    });
  }, []);

  return { positions, addPosition, updatePosition, deletePosition, isInitialized };
}
