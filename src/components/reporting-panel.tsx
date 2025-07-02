
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
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import type { Position, Personnel, TasraPosition } from '@/lib/types';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';

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
  
  // Tasra Filters
  const [locationFilters, setLocationFilters] = useState<string[]>([]);

  // Merkez Filters
  const [birimFilters, setBirimFilters] = useState<string[]>([]);
  const [gorevYeriFilters, setGorevYeriFilters] = useState<string[]>([]);
  const [unvanFilters, setUnvanFilters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const uniqueTasraLocations = useMemo(() => {
    const locations = new Set(tasraPositions.map(p => p.dutyLocation));
    return Array.from(locations).sort();
  }, [tasraPositions]);
  
  const uniqueMerkezBirimler = useMemo(() => Array.from(new Set(positions.map(p => p.department))).sort(), [positions]);
  const uniqueMerkezGorevYerleri = useMemo(() => Array.from(new Set(positions.map(p => p.dutyLocation).filter(Boolean) as string[])).sort(), [positions]);
  const uniqueMerkezUnvanlar = useMemo(() => Array.from(new Set(positions.map(p => p.name))).sort(), [positions]);

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (item: string) => {
    setter(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const filteredData = useMemo(() => {
    let data: (Position | TasraPosition)[] = [];

    if (dataSource === 'merkez_pozisyon') {
      let merkezData = positions;

      if (statusFilters.length > 0) {
        merkezData = merkezData.filter(p => statusFilters.includes(p.status));
      }
      if (birimFilters.length > 0) {
        merkezData = merkezData.filter(p => birimFilters.includes(p.department));
      }
      if (gorevYeriFilters.length > 0) {
        merkezData = merkezData.filter(p => p.dutyLocation && gorevYeriFilters.includes(p.dutyLocation));
      }
      if (unvanFilters.length > 0) {
        merkezData = merkezData.filter(p => unvanFilters.includes(p.name));
      }
      if (dateRange?.from) {
        const fromDate = dateRange.from;
        fromDate.setHours(0, 0, 0, 0);
        merkezData = merkezData.filter(p => p.startDate && new Date(p.startDate) >= fromDate);
      }
      if (dateRange?.to) {
        const toDate = dateRange.to;
        toDate.setHours(23, 59, 59, 999);
        merkezData = merkezData.filter(p => p.startDate && new Date(p.startDate) <= toDate);
      }
      data = merkezData;
    } else if (dataSource === 'tasra_pozisyon') {
      let tasraData = tasraPositions;
      if (statusFilters.length > 0) {
        tasraData = tasraData.filter(p => statusFilters.includes(p.status));
      }
      if (locationFilters.length > 0) {
        tasraData = tasraData.filter(p => locationFilters.includes(p.dutyLocation));
      }
      data = tasraData;
    }
    return data;
  }, [dataSource, statusFilters, locationFilters, birimFilters, gorevYeriFilters, unvanFilters, dateRange, positions, tasraPositions]);


  const handleExportToExcel = () => {
    const dataToExport = filteredData.map(item => {
      if (dataSource === 'merkez_pozisyon') {
        const p = item as Position;
        const assignedPerson = p.assignedPersonnelId ? personnel.find(per => per.id === p.assignedPersonnelId) : null;
        const reportsToPosition = p.reportsTo ? positions.find(pos => pos.id === p.reportsTo) : null;
        const reportsToPerson = reportsToPosition?.assignedPersonnelId ? personnel.find(per => per.id === reportsToPosition.assignedPersonnelId) : null;
        
        return {
          'Birim': p.department,
          'Görev Yeri': p.dutyLocation || '',
          'Ünvan': p.name,
          'Durum': p.status,
          'Başlama Tarihi': p.startDate ? format(new Date(p.startDate), 'dd.MM.yyyy') : '',
          'Asıl Ünvan (Vekalet/Yürütme)': p.originalTitle || '',
          'Bağlı Olduğu Pozisyon': reportsToPosition ? `${reportsToPosition.department} - ${reportsToPosition.name}` : 'Yok',
          'Bağlı Olduğu Yönetici': reportsToPerson ? `${reportsToPerson.firstName} ${reportsToPerson.lastName}` : (reportsToPosition ? 'Boş' : 'Yok'),
          'Atanan Personel': assignedPerson ? `${assignedPerson.firstName} ${assignedPerson.lastName}` : 'Atanmamış',
          'Personel Sicil': assignedPerson?.registryNumber || '',
          'Personel Statü': assignedPerson?.status || '',
          'Personel Kadro Ünvanı': assignedPerson?.unvan || '',
          'Personel E-posta': assignedPerson?.email || '',
          'Personel Telefon': assignedPerson?.phone || '',
          'Personel Doğum Tarihi': assignedPerson?.dateOfBirth ? format(new Date(assignedPerson.dateOfBirth), 'dd.MM.yyyy') : '',
          'Pozisyon Son Değişiklik Yapan Sicil': p.lastModifiedBy || '',
          'Pozisyon Son Değişiklik Tarihi': p.lastModifiedAt ? format(new Date(p.lastModifiedAt), 'dd.MM.yyyy HH:mm') : '',
        };
      } else { // tasra_pozisyon
        const p = item as TasraPosition;
        const assignedPerson = p.assignedPersonnelId ? tasraPersonnel.find(per => per.id === p.assignedPersonnelId) : null;

        return {
          'Ünite': p.unit,
          'Görev Yeri': p.dutyLocation,
          'Durum': p.status,
          'Başlama Tarihi': p.startDate ? format(new Date(p.startDate), 'dd.MM.yyyy') : '',
          'Asıl Ünvan (Vekalet/Yürütme)': p.originalTitle || '',
          'Görevi Veren Makam': p.actingAuthority || '',
          'Vekalet Ücreti Alıyor Mu?': p.receivesProxyPay ? 'Evet' : 'Hayır',
          'Yetki Devri Var Mı?': p.hasDelegatedAuthority ? 'Evet' : 'Hayır',
          'Atanan Personel': assignedPerson ? `${assignedPerson.firstName} ${assignedPerson.lastName}` : 'Atanmamış',
          'Personel Sicil': assignedPerson?.registryNumber || '',
          'Personel Statü': assignedPerson?.status || '',
          'Personel Kadro Ünvanı': assignedPerson?.unvan || '',
          'Personel E-posta': assignedPerson?.email || '',
          'Personel Telefon': assignedPerson?.phone || '',
          'Personel Doğum Tarihi': assignedPerson?.dateOfBirth ? format(new Date(assignedPerson.dateOfBirth), 'dd.MM.yyyy') : '',
          'Pozisyon Son Değişiklik Yapan Sicil': p.lastModifiedBy || '',
          'Pozisyon Son Değişiklik Tarihi': p.lastModifiedAt ? format(new Date(p.lastModifiedAt), 'dd.MM.yyyy HH:mm') : '',
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
    XLSX.writeFile(workbook, `Rapor_${dataSource}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
          <div>
            <Label htmlFor="data-source">1. Adım: Veri Kaynağı Seçin</Label>
            <Select value={dataSource} onValueChange={(val) => {
                setDataSource(val as DataSource);
                setStatusFilters([]);
                setLocationFilters([]);
                setBirimFilters([]);
                setGorevYeriFilters([]);
                setUnvanFilters([]);
                setDateRange(undefined);
            }}>
              <SelectTrigger id="data-source" className="mt-2">
                <SelectValue placeholder="Veri kaynağı seçin..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merkez_pozisyon">Merkez Pozisyonları</SelectItem>
                <SelectItem value="tasra_pozisyon">Taşra Pozisyonları</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className='space-y-2'>
            <Label>2. Adım: Filtreleri Uygulayın</Label>
            {dataSource === 'merkez_pozisyon' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pt-2">
                <div className="space-y-2">
                    <Label className='text-xs font-semibold'>Pozisyon Durumu</Label>
                    <div className="flex flex-col space-y-2">
                        {ALL_STATUSES.map(status => (
                            <div key={status} className="flex items-center space-x-2">
                                <Checkbox id={`status-${status}`} checked={statusFilters.includes(status)} onCheckedChange={() => handleFilterChange(setStatusFilters)(status)} />
                                <Label htmlFor={`status-${status}`} className="font-normal">{status}</Label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className='text-xs font-semibold'>Birim</Label>
                    <ScrollArea className="h-32 w-full rounded-md border p-2">
                        {uniqueMerkezBirimler.map(item => (
                             <div key={item} className="flex items-center space-x-2 py-1">
                                <Checkbox id={`birim-${item}`} checked={birimFilters.includes(item)} onCheckedChange={() => handleFilterChange(setBirimFilters)(item)} />
                                <Label htmlFor={`birim-${item}`} className="font-normal text-sm">{item}</Label>
                            </div>
                        ))}
                    </ScrollArea>
                </div>
                <div className="space-y-2">
                    <Label className='text-xs font-semibold'>Görev Yeri</Label>
                     <ScrollArea className="h-32 w-full rounded-md border p-2">
                        {uniqueMerkezGorevYerleri.map(item => (
                             <div key={item} className="flex items-center space-x-2 py-1">
                                <Checkbox id={`merkez-gorev-${item}`} checked={gorevYeriFilters.includes(item)} onCheckedChange={() => handleFilterChange(setGorevYeriFilters)(item)} />
                                <Label htmlFor={`merkez-gorev-${item}`} className="font-normal text-sm">{item}</Label>
                            </div>
                        ))}
                    </ScrollArea>
                </div>
                <div className="space-y-2">
                    <Label className='text-xs font-semibold'>Ünvan</Label>
                     <ScrollArea className="h-32 w-full rounded-md border p-2">
                        {uniqueMerkezUnvanlar.map(item => (
                             <div key={item} className="flex items-center space-x-2 py-1">
                                <Checkbox id={`unvan-${item}`} checked={unvanFilters.includes(item)} onCheckedChange={() => handleFilterChange(setUnvanFilters)(item)} />
                                <Label htmlFor={`unvan-${item}`} className="font-normal text-sm">{item}</Label>
                            </div>
                        ))}
                    </ScrollArea>
                </div>
                 <div className="space-y-2">
                    <Label className='text-xs font-semibold'>Başlama Tarihi Aralığı</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal h-10", !dateRange && "text-muted-foreground" )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? ( <> {format(dateRange.from, "dd.MM.y")} - {format(dateRange.to, "dd.MM.y")} </> ) 
                                : ( format(dateRange.from, "dd.MM.y") )
                            ) : ( <span>Tarih aralığı seçin</span> )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                        </PopoverContent>
                    </Popover>
                </div>
              </div>
            )}
            {dataSource === 'tasra_pozisyon' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                        <Label className='text-xs font-semibold'>Pozisyon Durumu</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {ALL_STATUSES.map(status => (
                                <div key={status} className="flex items-center space-x-2">
                                    <Checkbox id={`status-${status}`} checked={statusFilters.includes(status)} onCheckedChange={() => handleFilterChange(setStatusFilters)(status)} />
                                    <Label htmlFor={`status-${status}`} className="font-normal">{status}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className='text-xs font-semibold'>Görev Yeri (İl)</Label>
                        <ScrollArea className="h-32 w-full rounded-md border p-2">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {uniqueTasraLocations.map(location => (
                                <div key={location} className="flex items-center space-x-2">
                                    <Checkbox id={`loc-${location}`} checked={locationFilters.includes(location)} onCheckedChange={() => handleFilterChange(setLocationFilters)(location)} />
                                    <Label htmlFor={`loc-${location}`} className="font-normal">{location}</Label>
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                    </div>
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

        <ScrollArea className="h-[calc(100vh-36rem)]">
             <div className="rounded-md border">
                {renderTable()}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
