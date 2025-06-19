
"use client";

import { useState, useMemo, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { AddEditPositionDialog } from "@/components/add-edit-position-dialog";
import { AddEditPersonnelDialog } from "@/components/add-edit-personnel-dialog";
import { PositionFilter, type PositionFilterType } from "@/components/position-filter";
import { PositionList } from "@/components/position-list";
import { PersonnelList } from "@/components/personnel-list";
import { OrgChart } from "@/components/org-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePositions } from "@/hooks/use-positions";
import type { Position, Personnel } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  const { 
    positions, 
    personnel,
    addPosition, 
    updatePosition, 
    deletePosition, 
    addPersonnel,
    updatePersonnel,
    deletePersonnel,
    isInitialized 
  } = usePositions();

  const [filter, setFilter] = useState<PositionFilterType>("all");
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  
  const [isPersonnelDialogOpen, setIsPersonnelDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);

  const handleAddPositionClick = () => {
    setEditingPosition(null);
    setIsPositionDialogOpen(true);
  };

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
    setIsPositionDialogOpen(true);
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
    setIsPositionDialogOpen(false);
    setEditingPosition(null);
  };

  const handleAddPersonnelClick = () => {
    setEditingPersonnel(null);
    setIsPersonnelDialogOpen(true);
  };

  const handleEditPersonnel = (person: Personnel) => {
    setEditingPersonnel(person);
    setIsPersonnelDialogOpen(true);
  };

  const handleDeletePersonnel = (personnelId: string) => {
    deletePersonnel(personnelId);
  };

  const handleSavePersonnel = (data: Omit<Personnel, 'id'> | Personnel) => {
    if ('id' in data) {
      updatePersonnel(data as Personnel);
    } else {
      addPersonnel(data as Omit<Personnel, 'id'>);
    }
    setIsPersonnelDialogOpen(false);
    setEditingPersonnel(null);
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
        <AppHeader onAddPosition={() => {}} onAddPersonnel={() => {}} />
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
      <AppHeader onAddPosition={handleAddPositionClick} onAddPersonnel={handleAddPersonnelClick} />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <Tabs defaultValue="positions" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="positions">Pozisyon Yönetimi</TabsTrigger>
            <TabsTrigger value="personnel">Personel Yönetimi</TabsTrigger>
            <TabsTrigger value="org-chart">Organizasyon Şeması</TabsTrigger>
          </TabsList>
          <TabsContent value="positions">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle id="positions-heading">Şirket Pozisyonları</CardTitle>
                <CardDescription>Şirket içindeki tüm pozisyonları yönetin ve görüntüleyin.</CardDescription>
              </CardHeader>
              <CardContent>
                <PositionFilter currentFilter={filter} onFilterChange={setFilter} />
                <PositionList 
                  positions={filteredPositions} 
                  allPersonnel={personnel}
                  onEdit={handleEditPosition}
                  onDelete={handleDeletePosition}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="personnel">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Personel Listesi</CardTitle>
                <CardDescription>Şirket personelini yönetin.</CardDescription>
              </CardHeader>
              <CardContent>
                <PersonnelList
                  personnel={personnel}
                  onEdit={handleEditPersonnel}
                  onDelete={handleDeletePersonnel}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="org-chart">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle id="org-chart-heading">Organizasyon Şeması</CardTitle>
                <CardDescription>Şirketin raporlama yapısının görsel özeti.</CardDescription>
              </CardHeader>
              <CardContent>
                <OrgChart positions={positions} allPersonnel={personnel} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AddEditPositionDialog
        isOpen={isPositionDialogOpen}
        onOpenChange={setIsPositionDialogOpen}
        positionToEdit={editingPosition}
        allPositions={positions}
        allPersonnel={personnel}
        onSave={handleSavePosition}
        updatePersonnel={updatePersonnel} 
      />

      <AddEditPersonnelDialog
        isOpen={isPersonnelDialogOpen}
        onOpenChange={setIsPersonnelDialogOpen}
        personnelToEdit={editingPersonnel}
        onSave={handleSavePersonnel}
      />
    </div>
  );
}
