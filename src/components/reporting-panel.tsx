
"use client";

import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Download, Calendar as CalendarIcon, RotateCcw, Mail, Phone } from 'lucide-react';
import type { Position, Personnel, TasraPosition } from '@/lib/types';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { tr } from 'date-fns/locale';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

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

const MultiSelectFilter = ({
  title,
  options,
  selected,
  onSelectedChange,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onSelectedChange: (selected: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    const isSelected = selected.includes(value);
    if (isSelected) {
      onSelectedChange(selected.filter((item) => item !== value));
    } else {
      onSelectedChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold">{title}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {selected.length === 0
                ? `Tüm ${title.toLowerCase()} seçenekleri`
                : selected.length === 1
                ? options.find(o => o.value === selected[0])?.label
                : `${selected.length} seçenek seçildi`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder={`${title} ara...`} />
            <CommandList>
              <CommandEmpty>Seçenek bulunamadı.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};


export function ReportingPanel({ 
  positions: initialPositions, 
  personnel: initialPersonnel, 
  tasraPositions: initialTasraPositions, 
  tasraPersonnel: initialTasraPersonnel 
}: ReportingPanelProps) {
  const [dataSource, setDataSource] = useState<DataSource>('merkez_pozisyon');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  
  // Merkez Filters
  const [birimFilters, setBirimFilters] = useState<string[]>([]);
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


  const filterOptions = useMemo(() => {
    return {
      merkezBirimler: Array.from(new Set(positions.map(p => p.department))).map(v => ({ value: v, label: v })),
      merkezGorevYerleri: Array.from(new Set(positions.map(p => p.dutyLocation).filter(Boolean) as string[])).map(v => ({ value: v, label: v })),
      merkezUnvanlar: Array.from(new Set(positions.map(p => p.name))).map(v => ({ value: v, label: v })),
      merkezYoneticiler: Array.from(new Map(positions.filter(p => p.assignedPersonnelId).map(p => {
        const person = personnel.find(per => per.id === p.assignedPersonnelId);
        return [p.id, { value: p.id, label: person ? `${person.firstName} ${person.lastName} (${p.name})` : p.name }];
      })).values()),
      
      tasraUniteler: Array.from(new Set(tasraPositions.map(p => p.unit))).map(v => ({ value: v, label: v })),
      tasraGorevYerleri: Array.from(new Set(tasraPositions.map(p => p.dutyLocation))).map(v => ({ value: v, label: v })),
      tasraKadroUnvanlari: Array.from(new Set(tasraPositions.map(p => p.kadroUnvani).filter(Boolean) as string[])).map(v => ({ value: v, label: v })),
      tasraAsilUnvanlar: Array.from(new Set([
        ...tasraPositions.map(p => {
          if ((p.status === 'Vekalet' || p.status === 'Yürütme') && p.originalTitle) return p.originalTitle;
          if (p.status === 'Asıl' && p.assignedPersonnelId) {
              const person = tasraPersonnel.find(per => per.id === p.assignedPersonnelId);
              if (person?.unvan) return person.unvan;
          }
          return null;
        }).filter(Boolean) as string[],
        ...tasraPersonnel.map(p => p.unvan).filter(Boolean) as string[]
      ])).map(v => ({ value: v, label: v })),
    };
  }, [positions, personnel, tasraPositions, tasraPersonnel]);

  const filteredData = useMemo(() => {
    const enrichedMerkezData = positions.map(p => {
      const assignedPerson = personnel.find(per => per.id === p.assignedPersonnelId);
      const reportsToPosition = positions.find(parent => parent.id === p.reportsTo);
      const reportsToPerson = reportsToPosition ? personnel.find(per => per.id === reportsToPosition.assignedPersonnelId) : null;
      return { ...p, assignedPerson, reportsToPosition, reportsToPerson };
    });

    const enrichedTasraData = tasraPositions.map(p => ({
        ...p,
        assignedPerson: tasraPersonnel.find(per => per.id === p.assignedPersonnelId),
    }));

    if (dataSource === 'merkez_pozisyon') {
        return enrichedMerkezData.filter(p => 
            (statusFilters.length === 0 || statusFilters.includes(p.status)) &&
            (birimFilters.length === 0 || birimFilters.includes(p.department)) &&
            (unvanFilters.length === 0 || unvanFilters.includes(p.name)) &&
            (merkezPersonelStatusFilters.length === 0 || (p.assignedPerson && merkezPersonelStatusFilters.includes(p.assignedPerson.status))) &&
            (merkezRaporlayanYoneticiFilters.length === 0 || (p.reportsTo && merkezRaporlayanYoneticiFilters.includes(p.reportsTo))) &&
            (!merkezDateRange?.from || (p.startDate && new Date(p.startDate) >= new Date(new Date(merkezDateRange.from).setHours(0,0,0,0)))) &&
            (!merkezDateRange?.to || (p.startDate && new Date(p.startDate) <= new Date(new Date(merkezDateRange.to).setHours(23,59,59,999))))
        );
    } 
    
    if (dataSource === 'tasra_pozisyon') {
      return enrichedTasraData.filter(p => {
        let asilUnvanMatch = true;
        if (asilUnvanFilters.length > 0) {
            let conceptualAsilUnvan: string | null | undefined = null;
            if (p.status === 'Vekalet' || p.status === 'Yürütme') {
                conceptualAsilUnvan = p.originalTitle;
            } else if (p.status === 'Asıl' && p.assignedPerson) {
                conceptualAsilUnvan = p.assignedPerson.unvan;
            }
            asilUnvanMatch = conceptualAsilUnvan ? asilUnvanFilters.includes(conceptualAsilUnvan) : false;
        }

        return (
            (statusFilters.length === 0 || statusFilters.includes(p.status)) &&
            (uniteFilters.length === 0 || uniteFilters.includes(p.unit)) &&
            (tasraGorevYeriFilters.length === 0 || tasraGorevYeriFilters.includes(p.dutyLocation)) &&
            (kadroUnvaniFilters.length === 0 || (p.kadroUnvani && kadroUnvaniFilters.includes(p.kadroUnvani))) &&
            asilUnvanMatch &&
            (makamFilters.length === 0 || (p.actingAuthority && makamFilters.includes(p.actingAuthority))) &&
            (tasraPersonelStatusFilters.length === 0 || (p.assignedPerson && tasraPersonelStatusFilters.includes(p.assignedPerson.status))) &&
            (vekaletUcretiFilter === 'all' || p.receivesProxyPay === (vekaletUcretiFilter === 'yes')) &&
            (yetkiDevriFilter === 'all' || p.hasDelegatedAuthority === (yetkiDevriFilter === 'yes')) &&
            (!tasraDateRange?.from || (p.startDate && new Date(p.startDate) >= new Date(new Date(tasraDateRange.from).setHours(0,0,0,0)))) &&
            (!tasraDateRange?.to || (p.startDate && new Date(p.startDate) <= new Date(new Date(tasraDateRange.to).setHours(23,59,59,999))))
        );
      });
    }
    return [];
  }, [
    dataSource, statusFilters, 
    positions, personnel, birimFilters, unvanFilters, merkezDateRange, merkezPersonelStatusFilters, merkezRaporlayanYoneticiFilters,
    tasraPositions, tasraPersonnel, uniteFilters, tasraGorevYeriFilters, kadroUnvaniFilters, asilUnvanFilters, makamFilters, vekaletUcretiFilter, yetkiDevriFilter, tasraDateRange, tasraPersonelStatusFilters
  ]);

  const handleResetFilters = () => {
    setStatusFilters([]);
    setBirimFilters([]);
    setUnvanFilters([]);
    setMerkezPersonelStatusFilters([]);
    setMerkezRaporlayanYoneticiFilters([]);
    setMerkezDateRange(undefined);
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
                 <MultiSelectFilter title="Pozisyon Durumu" options={ALL_STATUSES.map(s => ({label: s, value: s}))} selected={statusFilters} onSelectedChange={setStatusFilters} />
                 <MultiSelectFilter title="Birim" options={filterOptions.merkezBirimler} selected={birimFilters} onSelectedChange={setBirimFilters} />
                 <MultiSelectFilter title="Ünvan" options={filterOptions.merkezUnvanlar} selected={unvanFilters} onSelectedChange={setUnvanFilters} />
                 <MultiSelectFilter title="Personel Statüsü" options={ALL_PERSONNEL_STATUSES.map(s => ({label: s, value: s}))} selected={merkezPersonelStatusFilters} onSelectedChange={setMerkezPersonelStatusFilters} />
                 <MultiSelectFilter title="Bağlı Olduğu Yönetici" options={filterOptions.merkezYoneticiler} selected={merkezRaporlayanYoneticiFilters} onSelectedChange={setMerkezRaporlayanYoneticiFilters} />
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
                    <MultiSelectFilter title="Pozisyon Durumu" options={ALL_STATUSES.map(s => ({label: s, value: s}))} selected={statusFilters} onSelectedChange={setStatusFilters} />
                    <MultiSelectFilter title="Ünite" options={filterOptions.tasraUniteler} selected={uniteFilters} onSelectedChange={setUniteFilters} />
                    <MultiSelectFilter title="Görev Yeri" options={filterOptions.tasraGorevYerleri} selected={tasraGorevYeriFilters} onSelectedChange={setTasraGorevYeriFilters} />
                    <MultiSelectFilter title="Kadro Ünvanı" options={filterOptions.tasraKadroUnvanlari} selected={kadroUnvaniFilters} onSelectedChange={setKadroUnvaniFilters} />
                    <MultiSelectFilter title="Asıl Ünvan" options={filterOptions.tasraAsilUnvanlar} selected={asilUnvanFilters} onSelectedChange={setAsilUnvanFilters} />
                    <MultiSelectFilter title="Görevi Veren Makam" options={ALL_MAKAMLAR.map(s => ({label: s, value: s}))} selected={makamFilters} onSelectedChange={setMakamFilters} />
                    <MultiSelectFilter title="Personel Statüsü" options={ALL_PERSONNEL_STATUSES.map(s => ({label: s, value: s}))} selected={tasraPersonelStatusFilters} onSelectedChange={setTasraPersonelStatusFilters} />
                    
                    <div className="grid grid-cols-2 gap-4">
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

    