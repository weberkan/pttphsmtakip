
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
import { Download, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
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
const ALL_MAKAMLAR: ('Başmüdürlük' | 'Genel Müdürlük')[] = ['Başmüdürlük', 'Genel Müdürlük'];

export function ReportingPanel({ positions, personnel, tasraPositions, tasraPersonnel }: ReportingPanelProps) {
  const [dataSource, setDataSource] = useState<DataSource>('merkez_pozisyon');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  
  // Merkez Filters
  const [birimFilters, setBirimFilters] = useState<string[]>([]);
  const [gorevYeriFilters, setGorevYeriFilters] = useState<string[]>([]);
  const [unvanFilters, setUnvanFilters] = useState<string[]>([]);
  const [merkezDateRange, setMerkezDateRange] = useState<DateRange | undefined>();

  // Tasra Filters
  const [uniteFilters, setUniteFilters] = useState<string[]>([]);
  const [tasraGorevYeriFilters, setTasraGorevYeriFilters] = useState<string[]>([]);
  const [asilUnvanFilters, setAsilUnvanFilters] = useState<string[]>([]);
  const [makamFilters, setMakamFilters] = useState<string[]>([]);
  const [vekaletUcretiFilter, setVekaletUcretiFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [yetkiDevriFilter, setYetkiDevriFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [tasraDateRange, setTasraDateRange] = useState<DateRange | undefined>();

  // Filter Options Data
  const uniqueMerkezBirimler = useMemo(() => Array.from(new Set(positions.map(p => p.department))).sort(), [positions]);
  const uniqueMerkezGorevYerleri = useMemo(() => Array.from(new Set(positions.map(p => p.dutyLocation).filter(Boolean) as string[])).sort(), [positions]);
  const uniqueMerkezUnvanlar = useMemo(() => Array.from(new Set(positions.map(p => p.name))).sort(), [positions]);
  
  const uniqueTasraUniteler = useMemo(() => Array.from(new Set(tasraPositions.map(p => p.unit))).sort(), [tasraPositions]);
  const uniqueTasraGorevYerleri = useMemo(() => Array.from(new Set(tasraPositions.map(p => p.dutyLocation))).sort(), [tasraPositions]);
  const uniqueTasraAsilUnvanlar = useMemo(() => Array.from(new Set(tasraPositions.map(p => p.originalTitle).filter(Boolean) as string[])).sort(), [tasraPositions]);


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
      if (merkezDateRange?.from) {
        const fromDate = merkezDateRange.from;
        fromDate.setHours(0, 0, 0, 0);
        merkezData = merkezData.filter(p => p.startDate && new Date(p.startDate) >= fromDate);
      }
      if (merkezDateRange?.to) {
        const toDate = merkezDateRange.to;
        toDate.setHours(23, 59, 59, 999);
        merkezData = merkezData.filter(p => p.startDate && new Date(p.startDate) <= toDate);
      }
      data = merkezData;
    } else if (dataSource === 'tasra_pozisyon') {
      let tasraData = tasraPositions;

      if (statusFilters.length > 0) {
        tasraData = tasraData.filter(p => statusFilters.includes(p.status));
      }
      if (uniteFilters.length > 0) {
        tasraData = tasraData.filter(p => uniteFilters.includes(p.unit));
      }
      if (tasraGorevYeriFilters.length > 0) {
        tasraData = tasraData.filter(p => tasraGorevYeriFilters.includes(p.dutyLocation));
      }
      if (asilUnvanFilters.length > 0) {
        tasraData = tasraData.filter(p => p.originalTitle && asilUnvanFilters.includes(p.originalTitle));
      }
      if (makamFilters.length > 0) {
        tasraData = tasraData.filter(p => p.actingAuthority && makamFilters.includes(p.actingAuthority));
      }
      if (vekaletUcretiFilter !== 'all') {
        const filterValue = vekaletUcretiFilter === 'yes';
        tasraData = tasraData.filter(p => p.receivesProxyPay === filterValue);
      }
      if (yetkiDevriFilter !== 'all') {
        const filterValue = yetkiDevriFilter === 'yes';
        tasraData = tasraData.filter(p => p.hasDelegatedAuthority === filterValue);
      }
      if (tasraDateRange?.from) {
        const fromDate = tasraDateRange.from;
        fromDate.setHours(0, 0, 0, 0);
        tasraData = tasraData.filter(p => p.startDate && new Date(p.startDate) >= fromDate);
      }
      if (tasraDateRange?.to) {
        const toDate = tasraDateRange.to;
        toDate.setHours(23, 59, 59, 999);
        tasraData = tasraData.filter(p => p.startDate && new Date(p.startDate) <= toDate);
      }
      data = tasraData;
    }
    return data;
  }, [
    dataSource, statusFilters, birimFilters, gorevYeriFilters, unvanFilters, merkezDateRange, 
    uniteFilters, tasraGorevYeriFilters, asilUnvanFilters, makamFilters, vekaletUcretiFilter, yetkiDevriFilter, tasraDateRange,
    positions, tasraPositions
  ]);


  const handleResetFilters = () => {
    setStatusFilters([]);
    setBirimFilters([]);
    setGorevYeriFilters([]);
    setUnvanFilters([]);
    setMerkezDateRange(undefined);
    setUniteFilters([]);
    setTasraGorevYeriFilters([]);
    setAsilUnvanFilters([]);
    setMakamFilters([]);
    setVekaletUcretiFilter('all');
    setYetkiDevriFilter('all');
    setTasraDateRange(undefined);
  };

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
                handleResetFilters();
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
            <div className='flex items-center justify-between'>
                <Label>2. Adım: Filtreleri Uygulayın</Label>
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Filtreleri Temizle
                </Button>
            </div>
            {dataSource === 'merkez_pozisyon' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pt-2">
                <div className="space-y-2">
                    <Label className='text-xs font-semibold'>Pozisyon Durumu</Label>
                    <ScrollArea className="h-32 w-full rounded-md border p-2">
                        {ALL_STATUSES.map(status => (
                            <div key={status} className="flex items-center space-x-2 py-1">
                                <Checkbox id={`status-${status}`} checked={statusFilters.includes(status)} onCheckedChange={() => handleFilterChange(setStatusFilters)(status)} />
                                <Label htmlFor={`status-${status}`} className="font-normal text-sm">{status}</Label>
                            </div>
                        ))}
                    </ScrollArea>
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
                            className={cn("w-full justify-start text-left font-normal h-10", !merkezDateRange && "text-muted-foreground" )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {merkezDateRange?.from ? (
                                merkezDateRange.to ? ( <> {format(merkezDateRange.from, "dd.MM.y")} - {format(merkezDateRange.to, "dd.MM.y")} </> ) 
                                : ( format(merkezDateRange.from, "dd.MM.y") )
                            ) : ( <span>Tarih aralığı seçin</span> )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar initialFocus mode="range" defaultMonth={merkezDateRange?.from} selected={merkezDateRange} onSelect={setMerkezDateRange} numberOfMonths={2} />
                        </PopoverContent>
                    </Popover>
                </div>
              </div>
            )}
            {dataSource === 'tasra_pozisyon' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-2">
                        <Label className='text-xs font-semibold'>Pozisyon Durumu</Label>
                        <ScrollArea className="h-32 w-full rounded-md border p-2">
                            {ALL_STATUSES.map(status => (
                                <div key={`tasra-status-${status}`} className="flex items-center space-x-2 py-1">
                                    <Checkbox id={`tasra-status-${status}`} checked={statusFilters.includes(status)} onCheckedChange={() => handleFilterChange(setStatusFilters)(status)} />
                                    <Label htmlFor={`tasra-status-${status}`} className="font-normal text-sm">{status}</Label>
                                </div>
                            ))}
                        </ScrollArea>
                    </div>
                    <div className="space-y-2">
                        <Label className='text-xs font-semibold'>Ünite</Label>
                        <ScrollArea className="h-32 w-full rounded-md border p-2">
                            {uniqueTasraUniteler.map(item => (
                                <div key={`unite-${item}`} className="flex items-center space-x-2 py-1">
                                    <Checkbox id={`unite-${item}`} checked={uniteFilters.includes(item)} onCheckedChange={() => handleFilterChange(setUniteFilters)(item)} />
                                    <Label htmlFor={`unite-${item}`} className="font-normal text-sm">{item}</Label>
                                </div>
                            ))}
                        </ScrollArea>
                    </div>
                    <div className="space-y-2">
                        <Label className='text-xs font-semibold'>Görev Yeri</Label>
                        <ScrollArea className="h-32 w-full rounded-md border p-2">
                            {uniqueTasraGorevYerleri.map(item => (
                                <div key={`tasra-gorev-${item}`} className="flex items-center space-x-2 py-1">
                                    <Checkbox id={`tasra-gorev-${item}`} checked={tasraGorevYeriFilters.includes(item)} onCheckedChange={() => handleFilterChange(setTasraGorevYeriFilters)(item)} />
                                    <Label htmlFor={`tasra-gorev-${item}`} className="font-normal text-sm">{item}</Label>
                                </div>
                            ))}
                        </ScrollArea>
                    </div>
                    <div className="space-y-2">
                        <Label className='text-xs font-semibold'>Asıl Ünvan</Label>
                        <ScrollArea className="h-32 w-full rounded-md border p-2">
                            {uniqueTasraAsilUnvanlar.map(item => (
                                <div key={`asil-unvan-${item}`} className="flex items-center space-x-2 py-1">
                                    <Checkbox id={`asil-unvan-${item}`} checked={asilUnvanFilters.includes(item)} onCheckedChange={() => handleFilterChange(setAsilUnvanFilters)(item)} />
                                    <Label htmlFor={`asil-unvan-${item}`} className="font-normal text-sm">{item}</Label>
                                </div>
                            ))}
                        </ScrollArea>
                    </div>
                    <div className="space-y-2">
                        <Label className='text-xs font-semibold'>Görevi Veren Makam</Label>
                        <ScrollArea className="h-32 w-full rounded-md border p-2">
                            {ALL_MAKAMLAR.map(makam => (
                                <div key={`makam-${makam}`} className="flex items-center space-x-2 py-1">
                                    <Checkbox id={`makam-${makam}`} checked={makamFilters.includes(makam)} onCheckedChange={() => handleFilterChange(setMakamFilters)(makam)} />
                                    <Label htmlFor={`makam-${makam}`} className="font-normal text-sm">{makam}</Label>
                                </div>
                            ))}
                        </ScrollArea>
                    </div>
                    <div className="flex flex-col space-y-4">
                        <div className="space-y-2">
                            <Label className='text-xs font-semibold'>Vekalet Ücreti</Label>
                            <Select value={vekaletUcretiFilter} onValueChange={(val) => setVekaletUcretiFilter(val as any)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tümü</SelectItem>
                                    <SelectItem value="yes">Alıyor</SelectItem>
                                    <SelectItem value="no">Almıyor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className='text-xs font-semibold'>Yetki Devri</Label>
                            <Select value={yetkiDevriFilter} onValueChange={(val) => setYetkiDevriFilter(val as any)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tümü</SelectItem>
                                    <SelectItem value="yes">Var</SelectItem>
                                    <SelectItem value="no">Yok</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
                        <Label className='text-xs font-semibold'>Başlama Tarihi Aralığı</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="tasra-date" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-10", !tasraDateRange && "text-muted-foreground" )}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {tasraDateRange?.from ? (
                                        tasraDateRange.to ? ( <> {format(tasraDateRange.from, "dd.MM.y")} - {format(tasraDateRange.to, "dd.MM.y")} </> ) 
                                        : ( format(tasraDateRange.from, "dd.MM.y") )
                                    ) : ( <span>Tarih aralığı seçin</span> )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar initialFocus mode="range" defaultMonth={tasraDateRange?.from} selected={tasraDateRange} onSelect={setTasraDateRange} numberOfMonths={2} />
                            </PopoverContent>
                        </Popover>
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

        <ScrollArea className="h-[calc(100vh-42rem)]">
             <div className="rounded-md border">
                {renderTable()}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
