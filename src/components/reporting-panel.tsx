
"use client";

import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Calendar as CalendarIcon, RotateCcw, Mail, Phone } from 'lucide-react';
import type { Position, Personnel, TasraPosition } from '@/lib/types';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { tr } from 'date-fns/locale';

interface ReportingPanelProps {
  positions: Position[];
  personnel: Personnel[];
  tasraPositions: TasraPosition[];
  tasraPersonnel: Personnel[];
}

type DataSource = 'merkez_pozisyon' | 'tasra_pozisyon';
const ALL_STATUSES: ('Asıl' | 'Vekalet' | 'Yürütme' | 'Boş')[] = ['Asıl', 'Vekalet', 'Yürütme', 'Boş'];
const ALL_PERSONNEL_STATUSES: ('İHS' | '399')[] = ['İHS', '399'];
const ALL_MAKAMLAR: ('Başmüdürlük' | 'Genel Müdürlük')[] = ['Başmüdürlük', 'Genel Müdürlük'];

export function ReportingPanel({ positions: initialPositions, personnel: initialPersonnel, tasraPositions: initialTasraPositions, tasraPersonnel: initialTasraPersonnel }: ReportingPanelProps) {
  const [dataSource, setDataSource] = useState<DataSource>('merkez_pozisyon');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  
  // Merkez Filters
  const [birimFilters, setBirimFilters] = useState<string[]>([]);
  const [gorevYeriFilters, setGorevYeriFilters] = useState<string[]>([]);
  const [unvanFilters, setUnvanFilters] = useState<string[]>([]);
  const [merkezPersonelStatusFilters, setMerkezPersonelStatusFilters] = useState<string[]>([]);
  const [merkezRaporlayanYoneticiFilters, setMerkezRaporlayanYoneticiFilters] = useState<string[]>([]);
  const [merkezDateRange, setMerkezDateRange] = useState<DateRange | undefined>();

  // Tasra Filters
  const [uniteFilters, setUniteFilters] = useState<string[]>([]);
  const [tasraGorevYeriFilters, setTasraGorevYeriFilters] = useState<string[]>([]);
  const [kadroUnvaniFilters, setKadroUnvaniFilters] = useState<string[]>([]);
  const [asilUnvanFilters, setAsilUnvanFilters] = useState<string[]>([]);
  const [makamFilters, setMakamFilters] = useState<string[]>([]);
  const [tasraPersonelStatusFilters, setTasraPersonelStatusFilters] = useState<string[]>([]);
  const [vekaletUcretiFilter, setVekaletUcretiFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [yetkiDevriFilter, setYetkiDevriFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [tasraDateRange, setTasraDateRange] = useState<DateRange | undefined>();

  const [positions, setPositions] = useState(initialPositions);
  const [personnel, setPersonnel] = useState(initialPersonnel);
  const [tasraPositions, setTasraPositions] = useState(initialTasraPositions);
  const [tasraPersonnel, setTasraPersonnel] = useState(initialTasraPersonnel);

  useEffect(() => { setPositions(initialPositions) }, [initialPositions]);
  useEffect(() => { setPersonnel(initialPersonnel) }, [initialPersonnel]);
  useEffect(() => { setTasraPositions(initialTasraPositions) }, [initialTasraPositions]);
  useEffect(() => { setTasraPersonnel(initialTasraPersonnel) }, [initialTasraPersonnel]);

  const uniqueMerkezBirimler = useMemo(() => Array.from(new Set(positions.map(p => p.department))).sort((a,b) => a.localeCompare(b, 'tr')), [positions]);
  const uniqueMerkezGorevYerleri = useMemo(() => Array.from(new Set(positions.map(p => p.dutyLocation).filter(Boolean) as string[])).sort((a,b) => a.localeCompare(b, 'tr')), [positions]);
  const uniqueMerkezUnvanlar = useMemo(() => Array.from(new Set(positions.map(p => p.name))).sort((a,b) => a.localeCompare(b, 'tr')), [positions]);
  
  const allMerkezYoneticiOptions = useMemo(() => {
    const yoneticiMap = new Map<string, { label: string, value: string }>();
    const allPersonnelMap = new Map(personnel.map(p => [p.id, p]));
    positions.forEach(p => {
        if (p.assignedPersonnelId) {
            const person = allPersonnelMap.get(p.assignedPersonnelId);
            if (person) {
                yoneticiMap.set(p.id, {
                    label: `${person.firstName} ${person.lastName} (${p.name})`,
                    value: p.id
                });
            }
        }
    });
    return Array.from(yoneticiMap.values()).sort((a,b) => a.label.localeCompare(b.label, 'tr'));
  }, [positions, personnel]);

  const uniqueTasraUniteler = useMemo(() => Array.from(new Set(tasraPositions.map(p => p.unit))).sort((a,b) => a.localeCompare(b, 'tr')), [tasraPositions]);
  const uniqueTasraGorevYerleri = useMemo(() => Array.from(new Set(tasraPositions.map(p => p.dutyLocation))).sort((a,b) => a.localeCompare(b, 'tr')), [tasraPositions]);
  const uniqueTasraKadroUnvanlari = useMemo(() => Array.from(new Set(tasraPositions.map(p => p.kadroUnvani).filter(Boolean) as string[])).sort((a,b) => a.localeCompare(b, 'tr')), [tasraPositions]);
  
  const uniqueTasraAsilUnvanlar = useMemo(() => {
    const titles = new Set<string>();
    tasraPositions.forEach(p => {
      // For proxy/acting, get the position's original title
      if ((p.status === 'Vekalet' || p.status === 'Yürütme') && p.originalTitle) {
        titles.add(p.originalTitle);
      } 
    });
    // Also include all personnel cadre titles
    tasraPersonnel.forEach(p => {
        if (p.unvan) titles.add(p.unvan);
    });
    return Array.from(titles).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [tasraPositions, tasraPersonnel]);

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (item: string) => {
    setter(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };
  
  const filteredData = useMemo(() => {
    const allMerkezPersonnelMap = new Map(personnel.map(p => [p.id, p]));
    const allMerkezPositionsMap = new Map(positions.map(p => [p.id, p]));
    const allTasraPersonnelMap = new Map(tasraPersonnel.map(p => [p.id, p]));

    if (dataSource === 'merkez_pozisyon') {
        let enrichedData = positions.map(p => {
            const reportsToPosition = p.reportsTo ? allMerkezPositionsMap.get(p.reportsTo) : null;
            return {
                ...p,
                assignedPerson: p.assignedPersonnelId ? allMerkezPersonnelMap.get(p.assignedPersonnelId) : null,
                reportsToPosition: reportsToPosition,
                reportsToPerson: reportsToPosition?.assignedPersonnelId ? allMerkezPersonnelMap.get(reportsToPosition.assignedPersonnelId) : null,
            };
        });

        if (statusFilters.length > 0) {
            enrichedData = enrichedData.filter(p => statusFilters.includes(p.status));
        }
        if (birimFilters.length > 0) {
            enrichedData = enrichedData.filter(p => birimFilters.includes(p.department));
        }
        if (gorevYeriFilters.length > 0) {
            enrichedData = enrichedData.filter(p => p.dutyLocation && gorevYeriFilters.includes(p.dutyLocation));
        }
        if (unvanFilters.length > 0) {
            enrichedData = enrichedData.filter(p => unvanFilters.includes(p.name));
        }
        if (merkezPersonelStatusFilters.length > 0) {
            enrichedData = enrichedData.filter(p => p.assignedPerson && merkezPersonelStatusFilters.includes(p.assignedPerson.status));
        }
        if (merkezRaporlayanYoneticiFilters.length > 0) {
            enrichedData = enrichedData.filter(p => p.reportsTo && merkezRaporlayanYoneticiFilters.includes(p.reportsTo));
        }
        if (merkezDateRange?.from) {
            const fromDate = merkezDateRange.from;
            fromDate.setHours(0, 0, 0, 0);
            enrichedData = enrichedData.filter(p => p.startDate && new Date(p.startDate) >= fromDate);
        }
        if (merkezDateRange?.to) {
            const toDate = merkezDateRange.to;
            toDate.setHours(23, 59, 59, 999);
            enrichedData = enrichedData.filter(p => p.startDate && new Date(p.startDate) <= toDate);
        }
        return enrichedData;
    } 
    
    if (dataSource === 'tasra_pozisyon') {
        let enrichedData = tasraPositions.map(p => ({
            ...p,
            assignedPerson: p.assignedPersonnelId ? allTasraPersonnelMap.get(p.assignedPersonnelId) : null,
        }));

        if (statusFilters.length > 0) {
            enrichedData = enrichedData.filter(p => statusFilters.includes(p.status));
        }
        if (uniteFilters.length > 0) {
            enrichedData = enrichedData.filter(p => uniteFilters.includes(p.unit));
        }
        if (tasraGorevYeriFilters.length > 0) {
            enrichedData = enrichedData.filter(p => tasraGorevYeriFilters.includes(p.dutyLocation));
        }
        if (kadroUnvaniFilters.length > 0) {
            enrichedData = enrichedData.filter(p => p.kadroUnvani && kadroUnvaniFilters.includes(p.kadroUnvani));
        }
        if (asilUnvanFilters.length > 0) {
             enrichedData = enrichedData.filter(p => {
                let conceptualAsilUnvan: string | null | undefined = null;
                if (p.status === 'Vekalet' || p.status === 'Yürütme') {
                    conceptualAsilUnvan = p.originalTitle;
                } else if (p.status === 'Asıl') {
                    conceptualAsilUnvan = p.assignedPerson?.unvan;
                }
                
                return conceptualAsilUnvan && asilUnvanFilters.includes(conceptualAsilUnvan);
            });
        }
        if (makamFilters.length > 0) {
            enrichedData = enrichedData.filter(p => p.actingAuthority && makamFilters.includes(p.actingAuthority));
        }
        if (tasraPersonelStatusFilters.length > 0) {
            enrichedData = enrichedData.filter(p => p.assignedPerson && tasraPersonelStatusFilters.includes(p.assignedPerson.status));
        }
        if (vekaletUcretiFilter !== 'all') {
            const filterValue = vekaletUcretiFilter === 'yes';
            enrichedData = enrichedData.filter(p => p.receivesProxyPay === filterValue);
        }
        if (yetkiDevriFilter !== 'all') {
            const filterValue = yetkiDevriFilter === 'yes';
            enrichedData = enrichedData.filter(p => p.hasDelegatedAuthority === filterValue);
        }
        if (tasraDateRange?.from) {
            const fromDate = tasraDateRange.from;
            fromDate.setHours(0, 0, 0, 0);
            enrichedData = enrichedData.filter(p => p.startDate && new Date(p.startDate) >= fromDate);
        }
        if (tasraDateRange?.to) {
            const toDate = tasraDateRange.to;
            toDate.setHours(23, 59, 59, 999);
            enrichedData = enrichedData.filter(p => p.startDate && new Date(p.startDate) <= toDate);
        }
        return enrichedData;
    }
    return [];
  }, [
    dataSource, statusFilters, 
    positions, personnel, birimFilters, gorevYeriFilters, unvanFilters, merkezDateRange, merkezPersonelStatusFilters, merkezRaporlayanYoneticiFilters,
    tasraPositions, tasraPersonnel, uniteFilters, tasraGorevYeriFilters, kadroUnvaniFilters, asilUnvanFilters, makamFilters, vekaletUcretiFilter, yetkiDevriFilter, tasraDateRange, tasraPersonelStatusFilters
  ]);


  const handleResetFilters = () => {
    setStatusFilters([]);
    // Merkez
    setBirimFilters([]);
    setGorevYeriFilters([]);
    setUnvanFilters([]);
    setMerkezPersonelStatusFilters([]);
    setMerkezRaporlayanYoneticiFilters([]);
    setMerkezDateRange(undefined);
    // Tasra
    setUniteFilters([]);
    setTasraGorevYeriFilters([]);
    setKadroUnvaniFilters([]);
    setAsilUnvanFilters([]);
    setMakamFilters([]);
    setTasraPersonelStatusFilters([]);
    setVekaletUcretiFilter('all');
    setYetkiDevriFilter('all');
    setTasraDateRange(undefined);
  };

  const handleExportToExcel = () => {
    const dataToExport = filteredData.map(item => {
      if (dataSource === 'merkez_pozisyon') {
        const p = item as (Position & { assignedPerson: Personnel | null, reportsToPerson: Personnel | null, reportsToPosition: Position | null });
        
        return {
          'Birim': p.department,
          'Görev Yeri': p.dutyLocation || '',
          'Ünvan': p.name,
          'Durum': p.status,
          'Başlama Tarihi': p.startDate ? format(new Date(p.startDate), 'dd.MM.yyyy') : '',
          'Asıl Ünvan (Vekalet/Yürütme)': p.originalTitle || '',
          'Bağlı Olduğu Pozisyon': p.reportsToPosition ? `${p.reportsToPosition.department} - ${p.reportsToPosition.name}` : 'Yok',
          'Bağlı Olduğu Yönetici': p.reportsToPerson ? `${p.reportsToPerson.firstName} ${p.reportsToPerson.lastName}` : (p.reportsToPosition ? 'Boş' : 'Yok'),
          'Atanan Personel': p.assignedPerson ? `${p.assignedPerson.firstName} ${p.assignedPerson.lastName}` : 'Atanmamış',
          'Personel Sicil': p.assignedPerson?.registryNumber || '',
          'Personel Statü': p.assignedPerson?.status || '',
          'Personel Kadro Ünvanı': p.assignedPerson?.unvan || '',
          'Personel E-posta': p.assignedPerson?.email || '',
          'Personel Telefon': p.assignedPerson?.phone || '',
          'Personel Doğum Tarihi': p.assignedPerson?.dateOfBirth ? format(new Date(p.assignedPerson.dateOfBirth), 'dd.MM.yyyy') : '',
          'Pozisyon Son Değişiklik Yapan Sicil': p.lastModifiedBy || '',
          'Pozisyon Son Değişiklik Tarihi': p.lastModifiedAt ? format(new Date(p.lastModifiedAt as Date), 'dd.MM.yyyy HH:mm') : '',
        };
      } else { // tasra_pozisyon
        const p = item as (TasraPosition & { assignedPerson: Personnel | null });
        
        return {
          'Ünite': p.unit,
          'Görev Yeri': p.dutyLocation,
          'Kadro Ünvanı': p.kadroUnvani || '',
          'Durum': p.status,
          'Başlama Tarihi': p.startDate ? format(new Date(p.startDate), 'dd.MM.yyyy') : '',
          'Asıl Ünvan (Vekalet/Yürütme)': p.originalTitle || '',
          'Görevi Veren Makam': p.actingAuthority || '',
          'Vekalet Ücreti Alıyor Mu?': p.receivesProxyPay ? 'Evet' : 'Hayır',
          'Yetki Devri Var Mı?': p.hasDelegatedAuthority ? 'Evet' : 'Hayır',
          'Atanan Personel': p.assignedPerson ? `${p.assignedPerson.firstName} ${p.assignedPerson.lastName}` : 'Atanmamış',
          'Personel Sicil': p.assignedPerson?.registryNumber || '',
          'Personel Statü': p.assignedPerson?.status || '',
          'Personel Kadro Ünvanı': p.assignedPerson?.unvan || '',
          'Personel E-posta': p.assignedPerson?.email || '',
          'Personel Telefon': p.assignedPerson?.phone || '',
          'Personel Doğum Tarihi': p.assignedPerson?.dateOfBirth ? format(new Date(p.assignedPerson.dateOfBirth), 'dd.MM.yyyy') : '',
          'Pozisyon Son Değişiklik Yapan Sicil': p.lastModifiedBy || '',
          'Pozisyon Son Değişiklik Tarihi': p.lastModifiedAt ? format(new Date(p.lastModifiedAt as Date), 'dd.MM.yyyy HH:mm') : '',
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
              <TableHead>İletişim</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(filteredData as (Position & { assignedPerson: Personnel | null })[]).map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.department}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.assignedPerson ? `${p.assignedPerson.firstName} ${p.assignedPerson.lastName}` : 'Atanmamış'}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      {p.assignedPerson?.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3 shrink-0 text-muted-foreground"/>{p.assignedPerson.phone}</div>}
                      {p.assignedPerson?.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3 shrink-0 text-muted-foreground"/>{p.assignedPerson.email}</div>}
                      {!p.assignedPerson?.phone && !p.assignedPerson?.email && <span className="text-muted-foreground italic">Yok</span>}
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}
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
                <TableHead>Kadro Ünvanı</TableHead>
                <TableHead>Personel</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>İletişim</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(filteredData as (TasraPosition & { assignedPerson: Personnel | null })[]).map(p => (
                    <TableRow key={p.id}>
                        <TableCell>{p.unit}</TableCell>
                        <TableCell>{p.dutyLocation}</TableCell>
                        <TableCell>{p.kadroUnvani || '-'}</TableCell>
                        <TableCell>{p.assignedPerson ? `${p.assignedPerson.firstName} ${p.assignedPerson.lastName}` : 'Atanmamış'}</TableCell>
                        <TableCell>{p.status}</TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1 text-xs">
                            {p.assignedPerson?.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3 shrink-0 text-muted-foreground"/>{p.assignedPerson.phone}</div>}
                            {p.assignedPerson?.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3 shrink-0 text-muted-foreground"/>{p.assignedPerson.email}</div>}
                            {!p.assignedPerson?.phone && !p.assignedPerson?.email && <span className="text-muted-foreground italic">N/A</span>}
                            </div>
                        </TableCell>
                    </TableRow>
                 )
              )}
            </TableBody>
          </Table>
        );
      }

    return null;
  };
  
  const FilterCheckboxGroup = ({ title, items, selectedItems, onFilterChange }: { title: string, items: {label: string, value: string}[], selectedItems: string[], onFilterChange: (item: string) => void }) => (
    <div className="space-y-2">
      <Label className='text-xs font-semibold'>{title}</Label>
      <ScrollArea className="h-32 w-full rounded-md border p-2">
        {items.map(item => (
          <div key={item.value} className="flex items-center space-x-2 py-1">
            <Checkbox id={`${title}-${item.value}`} checked={selectedItems.includes(item.value)} onCheckedChange={() => onFilterChange(item.value)} />
            <Label htmlFor={`${title}-${item.value}`} className="font-normal text-sm">{item.label}</Label>
          </div>
        ))}
      </ScrollArea>
    </div>
  );

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle>Raporlama ve Dışa Aktarma</CardTitle>
        <CardDescription>Verilerinizi filtreleyerek özel raporlar oluşturun ve Excel formatında indirin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col min-h-0">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 pt-2">
                 <FilterCheckboxGroup title="Pozisyon Durumu" items={ALL_STATUSES.map(s => ({label: s, value: s}))} selectedItems={statusFilters} onFilterChange={handleFilterChange(setStatusFilters)} />
                 <FilterCheckboxGroup title="Birim" items={uniqueMerkezBirimler.map(s => ({label: s, value: s}))} selectedItems={birimFilters} onFilterChange={handleFilterChange(setBirimFilters)} />
                 <FilterCheckboxGroup title="Görev Yeri" items={uniqueMerkezGorevYerleri.map(s => ({label: s, value: s}))} selectedItems={gorevYeriFilters} onFilterChange={handleFilterChange(setGorevYeriFilters)} />
                 <FilterCheckboxGroup title="Ünvan" items={uniqueMerkezUnvanlar.map(s => ({label: s, value: s}))} selectedItems={unvanFilters} onFilterChange={handleFilterChange(setUnvanFilters)} />
                 <FilterCheckboxGroup title="Personel Statüsü" items={ALL_PERSONNEL_STATUSES.map(s => ({label: s, value: s}))} selectedItems={merkezPersonelStatusFilters} onFilterChange={handleFilterChange(setMerkezPersonelStatusFilters)} />
                 <FilterCheckboxGroup title="Bağlı Olduğu Yönetici" items={allMerkezYoneticiOptions} selectedItems={merkezRaporlayanYoneticiFilters} onFilterChange={handleFilterChange(setMerkezRaporlayanYoneticiFilters)} />
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
                                merkezDateRange.to ? ( <> {format(merkezDateRange.from, "dd.MM.y", {locale: tr})} - {format(merkezDateRange.to, "dd.MM.y", {locale: tr})} </> ) 
                                : ( format(merkezDateRange.from, "dd.MM.y", {locale: tr}) )
                            ) : ( <span>Tarih aralığı seçin</span> )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar locale={tr} initialFocus mode="range" defaultMonth={merkezDateRange?.from} selected={merkezDateRange} onSelect={setMerkezDateRange} numberOfMonths={2} />
                        </PopoverContent>
                    </Popover>
                </div>
              </div>
            )}
            {dataSource === 'tasra_pozisyon' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 pt-2">
                    <FilterCheckboxGroup title="Pozisyon Durumu" items={ALL_STATUSES.map(s => ({label: s, value: s}))} selectedItems={statusFilters} onFilterChange={handleFilterChange(setStatusFilters)} />
                    <FilterCheckboxGroup title="Ünite" items={uniqueTasraUniteler.map(s => ({label: s, value: s}))} selectedItems={uniteFilters} onFilterChange={handleFilterChange(setUniteFilters)} />
                    <FilterCheckboxGroup title="Görev Yeri" items={uniqueTasraGorevYerleri.map(s => ({label: s, value: s}))} selectedItems={tasraGorevYeriFilters} onFilterChange={handleFilterChange(setTasraGorevYeriFilters)} />
                    <FilterCheckboxGroup title="Kadro Ünvanı" items={uniqueTasraKadroUnvanlari.map(s => ({label: s, value: s}))} selectedItems={kadroUnvaniFilters} onFilterChange={handleFilterChange(setKadroUnvaniFilters)} />
                    <FilterCheckboxGroup title="Asıl Ünvan" items={uniqueTasraAsilUnvanlar.map(s => ({label: s, value: s}))} selectedItems={asilUnvanFilters} onFilterChange={handleFilterChange(setAsilUnvanFilters)} />
                    <FilterCheckboxGroup title="Görevi Veren Makam" items={ALL_MAKAMLAR.map(s => ({label: s, value: s}))} selectedItems={makamFilters} onFilterChange={handleFilterChange(setMakamFilters)} />
                    <FilterCheckboxGroup title="Personel Statüsü" items={ALL_PERSONNEL_STATUSES.map(s => ({label: s, value: s}))} selectedItems={tasraPersonelStatusFilters} onFilterChange={handleFilterChange(setTasraPersonelStatusFilters)} />
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
                    <div className="space-y-2">
                        <Label className='text-xs font-semibold'>Başlama Tarihi Aralığı</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="tasra-date" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-10", !tasraDateRange && "text-muted-foreground" )}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {tasraDateRange?.from ? (
                                        tasraDateRange.to ? ( <> {format(tasraDateRange.from, "dd.MM.y", {locale: tr})} - {format(tasraDateRange.to, "dd.MM.y", {locale: tr})} </> ) 
                                        : ( format(tasraDateRange.from, "dd.MM.y", {locale: tr}) )
                                    ) : ( <span>Tarih aralığı seçin</span> )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar locale={tr} initialFocus mode="range" defaultMonth={tasraDateRange?.from} selected={tasraDateRange} onSelect={setTasraDateRange} numberOfMonths={2} />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-4">
            <p className="text-sm text-muted-foreground">
                <span className="font-bold">{filteredData.length}</span> sonuç bulundu.
            </p>
            <Button onClick={handleExportToExcel} disabled={filteredData.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Excel'e Aktar
            </Button>
        </div>

        <div className="rounded-md border flex-1 min-h-0">
          <ScrollArea className="h-full">
            {renderTable()}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
