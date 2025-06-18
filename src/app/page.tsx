"use client";

import { useState, useMemo, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { AddEditPositionDialog } from "@/components/add-edit-position-dialog";
import { PositionFilter, type PositionFilterType } from "@/components/position-filter";
import { PositionList } from "@/components/position-list";
import { OrgChart } from "@/components/org-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePositions } from "@/hooks/use-positions";
import type { Position } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { positions, addPosition, updatePosition, deletePosition, isInitialized } = usePositions();
  const [filter, setFilter] = useState<PositionFilterType>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);

  const handleAddPositionClick = () => {
    setEditingPosition(null);
    setIsDialogOpen(true);
  };

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
    setIsDialogOpen(true);
  };

  const handleDeletePosition = (positionId: string) => {
    deletePosition(positionId);
  };

  const handleSavePosition = (data: Omit<Position, 'id'> | Position) => {
    if ('id' in data) {
      updatePosition(data as Position);
    } else {
      addPosition(data as Omit<Position, 'id'>);
    }
    setIsDialogOpen(false);
    setEditingPosition(null);
  };

  const filteredPositions = useMemo(() => {
    if (filter === "all") {
      return positions;
    }
    return positions.filter(p => p.status === filter);
  }, [positions, filter]);

  if (!isInitialized) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader onAddPosition={() => {}} /> {/* Placeholder action */}
        <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                   <Skeleton className="h-4 w-3/5" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader onAddPosition={handleAddPositionClick} />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <section aria-labelledby="positions-heading" className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle id="positions-heading">Company Positions</CardTitle>
                <CardDescription>Manage and view all positions within the company.</CardDescription>
              </CardHeader>
              <CardContent>
                <PositionFilter currentFilter={filter} onFilterChange={setFilter} />
                <PositionList 
                  positions={filteredPositions} 
                  onEdit={handleEditPosition}
                  onDelete={handleDeletePosition}
                />
              </CardContent>
            </Card>
          </section>
          
          <section aria-labelledby="org-chart-heading" className="lg:col-span-1 space-y-6 sticky top-20"> {/* Sticky for large screens */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle id="org-chart-heading">Organizational Chart</CardTitle>
                <CardDescription>Visual overview of the company's reporting structure.</CardDescription>
              </CardHeader>
              <CardContent>
                <OrgChart positions={positions} />
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <AddEditPositionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        positionToEdit={editingPosition}
        allPositions={positions}
        onSave={handleSavePosition}
      />
    </div>
  );
}
