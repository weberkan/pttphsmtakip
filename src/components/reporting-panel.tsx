
"use client";

import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download } from 'lucide-react';
import type { Position, Personnel, TasraPosition } from '@/lib/types';
import { format } from 'date-fns';

interface ReportingPanelProps {
  positions: Position[];
  personnel: Personnel[];
  tasraPositions: TasraPosition[];
  tasraPersonnel: Personnel[];
}

type DataSource = 'merkez_pozisyon' | 'tasra_pozisyon';
const ALL_STATUSES: ('Asıl' | 'Vekalet' | 'Yürütme' | 'Boş')[] = ['Asıl', 'Vekalet', 'Yürütme', 'Boş'];

export function ReportingPanel({ positions, personnel, tasraPositions, tasraPersonnel }: ReportingPanelProps) {
  const [dataSource, setDataSource] = useState<DataSource>('merkez_pozisyon');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [locationFilters, setLocationFilters] = useState<string[]>([]);

  const uniqueTasraLocations = useMemo(() => {
    const locations = new Set(tasraPositions.map(p => p.dutyLocation));
    return Array.from(locations).sort();
  }, [tasraPositions]);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };
  
  const handleLocationFilterChange = (location: string) => {
    setLocationFilters(prev => 
      prev.includes(location) ? prev.filter(l => l !== location) : [...prev, location]
    );
  };

  const filteredData = useMemo(() => {
    let data: (Position | TasraPosition)[] = [];
    if (dataSource === 'merkez_pozisyon') {
      data = positions;
      if (statusFilters.length > 0) {
        data = data.filter(p => statusFilters.includes(p.status));
      }
    } else if (dataSource === 'tasra_pozisyon') {
      data = tasraPositions;
      if (statusFilters.length > 0) {
        data = data.filter(p => statusFilters.includes(p.status));
      }
      if (locationFilters.length > 0) {
        data = data.filter(p => locationFilters.includes((p as TasraPosition).dutyLocation));
      }
    }
    return data;
  }, [dataSource, statusFilters, locationFilters, positions, tasraPositions]);

  const handleExportToExcel = () => {
    const dataToExport = filteredData.map(item => {
      if (dataSource === 'merkez_pozisyon') {
        const p = item as Position;
        const assignedPerson = personnel.find(per => per.id === p.assignedPersonnelId);
        const reportsToPosition = positions.find(pos => pos.id === p.reportsTo);
        const reportsToPerson = reportsToPosition ? personnel.find(per => per.id === reportsToPosition.assignedPersonnelId) : null;
        return {
          'Birim': p.department,
          'Görev Yeri': p.dutyLocation || '',
          'Ünvan': p.name,
          'Personel': assignedPerson ? `${assignedPerson.firstName} ${assignedPerson.lastName}` : 'Atanmamış',
          'Sicil': assignedPerson?.registryNumber || '',
          'Personel Statü': assignedPerson?.status || '',
          'Durum': p.status,
          'Asıl Ünvan': p.originalTitle || '',
          'Başlama Tarihi': p.startDate ? format(p.startDate, 'dd.MM.yyyy') : '',
          'Bağlı Olduğu Pozisyon': reportsToPosition ? `${reportsToPosition.department} - ${reportsToPosition.name}` : 'Yok',
          'Bağlı Olduğu Yönetici': reportsToPerson ? `${reportsToPerson.firstName} ${reportsToPerson.lastName}` : (reportsToPosition ? 'Boş' : 'Yok'),
        };
      } else { // tasra_pozisyon
        const p = item as TasraPosition;
        const assignedPerson = tasraPersonnel.find(per => per.id === p.assignedPersonnelId);
        return {
          'Ünite': p.unit,
          'Görev Yeri': p.dutyLocation,
          'Personel': assignedPerson ? `${assignedPerson.firstName} ${assignedPerson.lastName}` : 'Atanmamış',
          'Sicil': assignedPerson?.registryNumber || '',
          'Personel Statü': assignedPerson?.status || '',
          'Asıl Ünvan': (p.status === 'Asıl' && assignedPerson?.unvan) ? assignedPerson.unvan : p.originalTitle || '',
          'Durum': p.status,
          'Görevi Veren Makam': p.actingAuthority || '',
          'Başlama Tarihi': p.startDate ? format(p.startDate, 'dd.MM.yyyy') : '',
          'Vekalet Ücreti Alıyor Mu?': p.receivesProxyPay ? 'Evet' : 'Hayır',
          'Yetki Devri Var Mı?': p.hasDelegatedAuthority ? 'Evet' : 'Hayır',
        };
      }
    });

    if (dataToExport.length === 0) {
      alert("Dışa aktarılacak veri bulunamadı. Lütfen filtrelerinizi kontrol edin.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapor');
    XLSX.writeFile(workbook, `PozisyonRaporu_${new Date().toLocaleDateString()}.xlsx`);
  };

  const renderTable = () => {
    if(filteredData.length === 0) {
        return <p className="p-4 text-center text-muted-foreground">Filtre kriterlerine uygun veri bulunamadı.</p>;
    }
    
    if (dataSource === 'merkez_pozisyon') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Birim</TableHead>
              <TableHead>Ünvan</TableHead>
              <TableHead>Personel</TableHead>
              <TableHead>Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(filteredData as Position[]).map(p => {
              const person = personnel.find(per => per.id === p.assignedPersonnelId);
              return (
                <TableRow key={p.id}>
                  <TableCell>{p.department}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{person ? `${person.firstName} ${person.lastName}` : 'Atanmamış'}</TableCell>
                  <TableCell>{p.status}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      );
    }

    if (dataSource === 'tasra_pozisyon') {
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ünite</TableHead>
                <TableHead>Görev Yeri</TableHead>
                <TableHead>Personel</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(filteredData as TasraPosition[]).map(p => {
                 const person = tasraPersonnel.find(per => per.id === p.assignedPersonnelId);
                 return (
                    <TableRow key={p.id}>
                        <TableCell>{p.unit}</TableCell>
                        <TableCell>{p.dutyLocation}</TableCell>
                        <TableCell>{person ? `${person.firstName} ${person.lastName}` : 'Atanmamış'}</TableCell>
                        <TableCell>{p.status}</TableCell>
                    </TableRow>
                 )
              })}
            </TableBody>
          </Table>
        );
      }

    return null;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Raporlama ve Dışa Aktarma</CardTitle>
        <CardDescription>Verilerinizi filtreleyerek özel raporlar oluşturun ve Excel formatında indirin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data-source">Veri Kaynağı</Label>
              <Select value={dataSource} onValueChange={(val) => {
                  setDataSource(val as DataSource);
                  setStatusFilters([]);
                  setLocationFilters([]);
              }}>
                <SelectTrigger id="data-source">
                  <SelectValue placeholder="Veri kaynağı seçin..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merkez_pozisyon">Merkez Pozisyonları</SelectItem>
                  <SelectItem value="tasra_pozisyon">Taşra Pozisyonları</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label>Pozisyon Durumu</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ALL_STATUSES.map(status => (
                        <div key={status} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`status-${status}`}
                                checked={statusFilters.includes(status)}
                                onCheckedChange={() => handleStatusFilterChange(status)}
                            />
                            <Label htmlFor={`status-${status}`} className="font-normal">{status}</Label>
                        </div>
                    ))}
                </div>
            </div>
            {dataSource === 'tasra_pozisyon' && (
                <div className="space-y-2">
                    <Label>Görev Yeri (İl)</Label>
                    <ScrollArea className="h-32 w-full rounded-md border p-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {uniqueTasraLocations.map(location => (
                             <div key={location} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`loc-${location}`}
                                    checked={locationFilters.includes(location)}
                                    onCheckedChange={() => handleLocationFilterChange(location)}
                                />
                                <Label htmlFor={`loc-${location}`} className="font-normal">{location}</Label>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
                <span className="font-bold">{filteredData.length}</span> sonuç bulundu.
            </p>
            <Button onClick={handleExportToExcel} disabled={filteredData.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Excel'e Aktar
            </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-28rem)]">
             <div className="rounded-md border">
                {renderTable()}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
