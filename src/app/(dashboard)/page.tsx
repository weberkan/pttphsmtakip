
"use client";

import { useState, useMemo, useRef, Suspense } from "react";
import * as XLSX from 'xlsx';
import * as z from "zod";
import { AddEditPositionDialog } from "@/components/add-edit-position-dialog";
import { AddEditPersonnelDialog } from "@/components/add-edit-personnel-dialog";
import { PositionFilter, type PositionFilterType } from "@/components/position-filter";
import { PositionList } from "@/components/position-list";
import { PersonnelList } from "@/components/personnel-list";
import { OrgChart } from "@/components/org-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePositions } from "@/hooks/use-positions";
import { useTasraPositions } from "@/hooks/use-tasra-positions";
import type { Position, Personnel, TasraPosition, KanbanCard } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { TasraPositionList } from "@/components/tasra-position-list";
import { AddEditTasraPositionDialog } from "@/components/add-edit-tasra-position-dialog";
import { ReportingPanel } from "@/components/reporting-panel";
import { useSearchParams } from "next/navigation";
import { DashboardHome } from "@/components/dashboard-home";
import { useAuth } from "@/contexts/auth-context";
import { UserApprovalPanel } from "@/components/user-approval-panel";
import { useUserManagement } from "@/hooks/use-user-management";
import { useDepposh } from "@/hooks/use-depposh";
import { TalimatlarBoard } from "@/components/depposh/talimatlar-board";
import { FileListView } from "@/components/depposh/file-list-view";
import { AddEditTalimatDialog } from "@/components/depposh/add-edit-talimat-dialog";

const importPersonnelSchema = z.object({
  firstName: z.string().min(1, "Adı boş olamaz."),
  lastName: z.string().min(1, "Soyadı boş olamaz."),
  unvan: z.string().optional().nullable().or(z.literal('')),
  registryNumber: z.string().min(1, "Sicil Numarası boş olamaz."),
  status: z.enum(["İHS", "399"], { errorMap: () => ({ message: "Statü 'İHS' veya '399' olmalıdır." }) }),
  photoUrl: z.string().url("Geçerli bir URL girin.").optional().nullable().or(z.literal('')),
  email: z.string().email("Geçerli bir e-posta adresi girin.").optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable().or(z.literal('')),
  dateOfBirth: z.date().optional().nullable(),
});

const importPositionSchema = z.object({
  name: z.string().min(1, "Ünvan boş olamaz."),
  department: z.string().min(1, "Birim boş olamaz."),
  dutyLocation: z.string().optional().nullable().or(z.literal('')),
  originalTitle: z.string().optional().nullable().or(z.literal('')),
  status: z.enum(["Asıl", "Vekalet", "Yürütme", "Boş"], { 
    errorMap: () => ({ message: "Durum 'Asıl', 'Vekalet', 'Yürütme' veya 'Boş' olmalıdır." }) 
  }),
  reportsToPersonnelRegistryNumber: z.string().optional().nullable().or(z.literal('')),
  assignedPersonnelRegistryNumber: z.string().optional().nullable().or(z.literal('')),
  startDate: z.date().optional().nullable(),
});

const importTasraPositionSchema = z.object({
  unit: z.string().min(1, "Ünite boş olamaz."),
  dutyLocation: z.string().min(1, "Görev Yeri boş olamaz."),
  kadroUnvani: z.string().optional().nullable().or(z.literal('')),
  status: z.enum(["Asıl", "Vekalet", "Yürütme", "Boş"], { 
    errorMap: () => ({ message: "Durum 'Asıl', 'Vekalet', 'Yürütme' veya 'Boş' olmalıdır." }) 
  }),
  originalTitle: z.string().optional().nullable().or(z.literal('')),
  assignedPersonnelRegistryNumber: z.string().optional().nullable().or(z.literal('')),
  startDate: z.date().optional().nullable(),
  actingAuthority: z.enum(["Başmüdürlük", "Genel Müdürlük"]).optional().nullable(),
  receivesProxyPay: z.any().optional().nullable(),
  hasDelegatedAuthority: z.any().optional().nullable(),
}).superRefine((data, ctx) => {
    const isProxyOrActing = data.status === "Vekalet" || data.status === "Yürütme";
    
    if (isProxyOrActing) {
        if (!data.originalTitle || data.originalTitle.trim() === "") {
          ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["originalTitle"],
              message: "Durum 'Vekalet' veya 'Yürütme' ise Asıl Ünvan zorunludur.",
          });
        }
    }
});


function DashboardPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const activeView = searchParams.get('view') || 'dashboard';
  
  // Merkez Teşkilatı Data
  const { 
    positions, 
    personnel,
    allPersonnel: allMerkezPersonnel,
    addPosition, 
    batchAddPositions,
    updatePosition,
    batchUpdatePositions,
    deletePosition, 
    addPersonnel,
    batchAddPersonnel,
    updatePersonnel,
    deletePersonnel,
    loading: merkezLoading,
    page: merkezPage,
    totalCount: merkezTotalCount,
    fetchNextPage: fetchNextMerkezPage,
    fetchPrevPage: fetchPrevMerkezPage,
  } = usePositions();

  // Taşra Teşkilatı Data
  const {
    tasraPositions,
    tasraPersonnel,
    allPersonnel: allTasraPersonnel,
    addTasraPosition,
    batchAddTasraPosition,
    updateTasraPosition,
    batchUpdateTasraPosition,
    deleteTasraPosition,
    addTasraPersonnel,
    batchAddTasraPersonnel,
    updateTasraPersonnel,
    deleteTasraPersonnel,
    loading: tasraLoading,
    page: tasraPage,
    totalCount: tasraTotalCount,
    fetchNextPage: fetchNextTasraPage,
    fetchPrevPage: fetchPrevTasraPage,
  } = useTasraPositions();
  
  const { 
    users, 
    approveUser,
    isInitialized: isUsersInitialized 
  } = useUserManagement();

  const {
    cards, addCard, updateCard, deleteCard, updateCardBatch,
    files, addFile, deleteFile, updateFileOrder,
    isDepposhInitialized
  } = useDepposh();


  const { toast } = useToast();
  const personnelFileInputRef = useRef<HTMLInputElement>(null);
  const positionFileInputRef = useRef<HTMLInputElement>(null);
  const tasraPositionFileInputRef = useRef<HTMLInputElement>(null);
  
  // Merkez States
  const [filter, setFilter] = useState<PositionFilterType>("all");
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [isPersonnelDialogOpen, setIsPersonnelDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
  const [positionSearchTerm, setPositionSearchTerm] = useState("");
  const [personnelSearchTerm, setPersonnelSearchTerm] = useState("");

  // Taşra States
  const [isTasraPositionDialogOpen, setIsTasraPositionDialogOpen] = useState(false);
  const [editingTasraPosition, setEditingTasraPosition] = useState<TasraPosition | null>(null);
  const [isTasraPersonnelDialogOpen, setIsTasraPersonnelDialogOpen] = useState(false);
  const [editingTasraPersonnel, setEditingTasraPersonnel] = useState<Personnel | null>(null);
  const [tasraPositionSearchTerm, setTasraPositionSearchTerm] = useState("");
  const [tasraPersonnelSearchTerm, setTasraPersonnelSearchTerm] = useState("");
  
  // Talimatlar (Depposh) State
  const [isTalimatDialogOpen, setIsTalimatDialogOpen] = useState(false);
  const [editingTalimat, setEditingTalimat] = useState<KanbanCard | null>(null);

  // ---- Merkez Handlers ----
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
      addPersonnel(data as Omit<Personnel, 'id'> & { status: 'İHS' | '399' });
    }
    setIsPersonnelDialogOpen(false);
    setEditingPersonnel(null);
  };

  // ---- Taşra Handlers ----
  const handleAddTasraPositionClick = () => {
    setEditingTasraPosition(null);
    setIsTasraPositionDialogOpen(true);
  };

  const handleEditTasraPosition = (position: TasraPosition) => {
    setEditingTasraPosition(position);
    setIsTasraPositionDialogOpen(true);
  }

  const handleDeleteTasraPosition = (positionId: string) => {
    deleteTasraPosition(positionId);
  }

  const handleSaveTasraPosition = (data: Omit<TasraPosition, 'id'> | TasraPosition) => {
    if ('id' in data) {
      updateTasraPosition(data as TasraPosition);
    } else {
      addTasraPosition(data as Omit<TasraPosition, 'id'>);
    }
    setIsTasraPositionDialogOpen(false);
    setEditingTasraPosition(null);
  }

  const handleAddTasraPersonnelClick = () => {
    setEditingTasraPersonnel(null);
    setIsTasraPersonnelDialogOpen(true);
  };

  const handleEditTasraPersonnel = (person: Personnel) => {
    setEditingTasraPersonnel(person);
    setIsTasraPersonnelDialogOpen(true);
  }

  const handleDeleteTasraPersonnel = (personnelId: string) => {
    deleteTasraPersonnel(personnelId);
  }

  const handleSaveTasraPersonnel = (data: Omit<Personnel, 'id'> | Personnel) => {
    if ('id' in data) {
      updateTasraPersonnel(data as Personnel);
    } else {
      addTasraPersonnel(data as Omit<Personnel, 'id'>);
    }
    setIsTasraPersonnelDialogOpen(false);
    setEditingTasraPersonnel(null);
  }

  // --- Talimatlar Handlers ---
  const handleEditTalimat = (card: KanbanCard) => {
      setEditingTalimat(card);
      setIsTalimatDialogOpen(true);
  };

  const filteredPositions = useMemo(() => {
    let _filtered = positions;
    if (filter !== "all") {
      _filtered = _filtered.filter(p => p.status === filter);
    }
    if (positionSearchTerm.trim() !== "") {
      const searchTermLower = positionSearchTerm.toLowerCase();
      _filtered = _filtered.filter(p => {
        const assignedPerson = p.assignedPersonnelId ? allMerkezPersonnel.find(person => person.id === p.assignedPersonnelId) : null;
        return (
          (p.name || '').toLowerCase().includes(searchTermLower) ||
          (p.department || '').toLowerCase().includes(searchTermLower) ||
          (p.dutyLocation || '').toLowerCase().includes(searchTermLower) ||
          (p.originalTitle || '').toLowerCase().includes(searchTermLower) ||
          (assignedPerson && (
            (assignedPerson.firstName || '').toLowerCase().includes(searchTermLower) ||
            (assignedPerson.lastName || '').toLowerCase().includes(searchTermLower) ||
            (assignedPerson.registryNumber || '').toLowerCase().includes(searchTermLower)
          ))
        );
      });
    }
    return _filtered;
  }, [positions, allMerkezPersonnel, filter, positionSearchTerm]);
  
  const filteredPersonnel = useMemo(() => {
    if (personnelSearchTerm.trim() === "") {
      return personnel;
    }
    const searchTermLower = personnelSearchTerm.toLowerCase();
    return personnel.filter(p =>
      (p.firstName || '').toLowerCase().includes(searchTermLower) ||
      (p.lastName || '').toLowerCase().includes(searchTermLower) ||
      (p.registryNumber || '').toLowerCase().includes(searchTermLower) ||
      (p.email || '').toLowerCase().includes(searchTermLower) ||
      (p.phone || '').toLowerCase().includes(searchTermLower)
    );
  }, [personnel, personnelSearchTerm]);
  
  const filteredTasraPositions = useMemo(() => {
    let _filtered = tasraPositions;
    if (tasraPositionSearchTerm.trim() !== "") {
        const searchTermLower = tasraPositionSearchTerm.toLowerCase();
        _filtered = _filtered.filter(p => {
            const assignedPerson = p.assignedPersonnelId ? allTasraPersonnel.find(person => person.id === p.assignedPersonnelId) : null;
            return (
                (p.unit || '').toLowerCase().includes(searchTermLower) ||
                (p.dutyLocation || '').toLowerCase().includes(searchTermLower) ||
                (p.kadroUnvani || '').toLowerCase().includes(searchTermLower) ||
                (p.originalTitle || '').toLowerCase().includes(searchTermLower) ||
                (assignedPerson && (
                    (assignedPerson.firstName || '').toLowerCase().includes(searchTermLower) ||
                    (assignedPerson.lastName || '').toLowerCase().includes(searchTermLower) ||
                    (assignedPerson.registryNumber || '').toLowerCase().includes(searchTermLower)
                ))
            );
        });
    }
    return _filtered;
  }, [tasraPositions, allTasraPersonnel, tasraPositionSearchTerm]);
  
  const filteredTasraPersonnel = useMemo(() => {
    let filtered = tasraPersonnel;
    if (tasraPersonnelSearchTerm.trim() !== "") {
        const searchTermLower = tasraPersonnelSearchTerm.toLowerCase();
        filtered = filtered.filter(p => 
            (p.firstName || '').toLowerCase().includes(searchTermLower) ||
            (p.lastName || '').toLowerCase().includes(searchTermLower) ||
            (p.registryNumber || '').toLowerCase().includes(searchTermLower) ||
            (p.email || '').toLowerCase().includes(searchTermLower) ||
            (p.phone || '').toLowerCase().includes(searchTermLower)
        );
    }
    return filtered;
  }, [tasraPersonnel, tasraPersonnelSearchTerm]);


  const handleImportPersonnelClick = () => {
    personnelFileInputRef.current?.click();
  };

  const handleImportPositionsClick = () => {
    positionFileInputRef.current?.click();
  };

  const handleImportTasraPositionsClick = () => {
    tasraPositionFileInputRef.current?.click();
  };

  const normalizeHeader = (header: string) => {
    if (!header) return '';
    return header
      .replace(/İ/g, 'i')
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/gi, '');
  }

  const handlePersonnelFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
          toast({ title: "Hata", description: "Excel dosyası boş veya sadece başlık satırı içeriyor.", variant: "destructive" });
          return;
        }

        const headers = (jsonData[0] as string[]).map(normalizeHeader);
        const rows = jsonData.slice(1);

        const headerMapping: { [key: string]: keyof z.infer<typeof importPersonnelSchema> } = {
          'adi': 'firstName', 'ad': 'firstName',
          'soyadi': 'lastName', 'soyad': 'lastName',
          'unvan': 'unvan', 'kadrounvani': 'unvan',
          'sicilnumarasi': 'registryNumber', 'sicilno': 'registryNumber', 'sicil': 'registryNumber',
          'statu': 'status',
          'eposta': 'email', 'mail': 'email',
          'telefon': 'phone', 'tel': 'phone',
          'fotografurl': 'photoUrl', 'fotourl': 'photoUrl', 'foto': 'photoUrl', 'url': 'photoUrl',
          'dogumtarihi': 'dateOfBirth',
        };
        
        const personnelToAdd: Omit<Personnel, 'id'>[] = [];
        const errors: { rowIndex: number; message: string; }[] = [];
        let skippedCount = 0;

        const currentPersonnelList = activeView.startsWith('merkez') ? allMerkezPersonnel : allTasraPersonnel;
        const existingRegistryNumbers = new Set(currentPersonnelList.map(p => p.registryNumber));

        rows.forEach((rowArray, rowIndex) => {
          try {
            if (rowArray.every(cell => cell === null || cell === '')) {
                return; // Skip empty rows
            }
            const rawRow: any = {};
            headers.forEach((header, colIndex) => {
              const personnelKey = headerMapping[header];
              if (personnelKey) {
                let excelValue = rowArray[colIndex];
                if (excelValue === null || excelValue === undefined) {
                  rawRow[personnelKey] = null;
                } else if (personnelKey === 'dateOfBirth') {
                  rawRow[personnelKey] = excelValue instanceof Date ? excelValue : null;
                } else if (typeof excelValue === 'string') {
                  rawRow[personnelKey] = excelValue.trim();
                } else {
                  rawRow[personnelKey] = String(excelValue).trim();
                }
              }
            });

            const validation = importPersonnelSchema.safeParse(rawRow);

            if (validation.success) {
              const newPerson = validation.data as Omit<Personnel, 'id'>;
              
              if (existingRegistryNumbers.has(newPerson.registryNumber)) {
                skippedCount++;
              } else {
                personnelToAdd.push(newPerson);
                existingRegistryNumbers.add(newPerson.registryNumber);
              }
            } else {
              const personnelHeaderMappingReverse: { [key: string]: string } = {
                'firstName': 'Adı', 'lastName': 'Soyadı', 'registryNumber': 'Sicil Numarası', 'unvan': 'Ünvan',
                'status': 'Statü', 'email': 'E-posta', 'phone': 'Telefon', 'photoUrl': 'Fotoğraf URL',
                'dateOfBirth': 'Doğum Tarihi',
              };
              const errorMessagesForToast = validation.error.issues.map(issue => {
                let issuePath = issue.path.join('.');
                if (issue.path.length === 1 && personnelHeaderMappingReverse[issue.path[0] as string]) {
                  issuePath = personnelHeaderMappingReverse[issue.path[0] as string];
                }
                return issuePath ? `${issuePath}: ${issue.message}` : issue.message;
              });
              const errorDescription = errorMessagesForToast.join('; ') || "Bilinmeyen bir personel doğrulama hatası oluştu.";
              errors.push({ rowIndex: rowIndex + 2, message: errorDescription });
            }
          } catch(e: any) {
              errors.push({ rowIndex: rowIndex + 2, message: `Beklenmedik bir hata oluştu: ${e.message}` });
          }
        });
        
        if (personnelToAdd.length > 0) {
            if (activeView.startsWith('merkez')) {
                batchAddPersonnel(personnelToAdd);
            } else {
                batchAddTasraPersonnel(personnelToAdd);
            }
        }
        
        let summaryMessage = `${personnelToAdd.length} personel başarıyla içe aktarıldı.`;
        if (skippedCount > 0) summaryMessage += ` ${skippedCount} personel (sicil no mevcut) atlandı.`;
        if (errors.length > 0) summaryMessage += ` ${errors.length} personel hatalı veri nedeniyle eklenemedi.`;
        
        toast({
          title: "Personel İçe Aktarma Tamamlandı",
          description: summaryMessage,
          duration: 7000
        });

        if (errors.length > 0) {
            const errorDetails = errors.slice(0, 5).map(e => `Satır ${e.rowIndex}: ${e.message}`).join('\n');
            toast({
                title: `Toplam ${errors.length} Hatalı Satır Bulundu`,
                description: errorDetails + (errors.length > 5 ? `\n...ve ${errors.length - 5} daha fazla hata.` : ''),
                variant: "destructive",
                duration: 15000,
            });
        }
      } catch (error: any) {
        if (error.message && error.message.includes("password-protected")) {
          toast({ title: "Hata", description: "Yüklenen dosya şifre korumalı. Lütfen şifresiz bir dosya seçin.", variant: "destructive" });
        } else {
          toast({ title: "Hata", description: `Excel dosyası işlenirken bir sorun oluştu: ${error.message}`, variant: "destructive" });
        }
      } finally {
        if (event.target) {
          event.target.value = "";
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePositionFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          toast({ title: "Hata", description: "Pozisyon Excel dosyası boş veya sadece başlık satırı içeriyor.", variant: "destructive" });
          return;
        }

        const headers = (jsonData[0] as string[]).map(normalizeHeader);
        const rows = jsonData.slice(1);

        const headerMapping: { [key: string]: keyof z.infer<typeof importPositionSchema> } = {
          'unvan': 'name',
          'birim': 'department',
          'gorevyeri': 'dutyLocation',
          'asilunvan': 'originalTitle',
          'durum': 'status',
          'baglioldugupersonelsicil': 'reportsToPersonnelRegistryNumber', 'raporladigisicil': 'reportsToPersonnelRegistryNumber',
          'atananpersonelsicil': 'assignedPersonnelRegistryNumber', 'personelsicil': 'assignedPersonnelRegistryNumber', 'atananpersonel': 'assignedPersonnelRegistryNumber',
          'baslamatarihi': 'startDate', 'tarih': 'startDate',
        };
        
        const positionHeaderMappingReverse: { [key: string]: string } = {
          'name': 'Ünvan', 'department': 'Birim', 'dutyLocation': 'Görev Yeri', 'originalTitle': 'Asıl Ünvan',
          'status': 'Durum', 'reportsToPersonnelRegistryNumber': 'Bağlı Olduğu Personel Sicil',
          'assignedPersonnelRegistryNumber': 'Atanan Personel Sicil', 'startDate': 'Başlama Tarihi',
        };

        const positionsToAdd: Omit<Position, 'id'>[] = [];
        const positionsToUpdate: Position[] = [];
        const errors: { rowIndex: number; message: string; }[] = [];
        const warnings: { rowIndex: number; message: string; }[] = [];

        const existingPositionMap = new Map<string, Position>(
          positions.map(p => {
            const key = `${(p.department || '').trim().toLowerCase()}|${(p.name || '').trim().toLowerCase()}|${(p.dutyLocation || '').trim().toLowerCase()}`;
            return [key, p];
          })
        );
        const personnelByRegistry = new Map<string, Personnel>(allMerkezPersonnel.map(p => [p.registryNumber, p]));

        rows.forEach((rowArray, rowIndex) => {
          try {
            if (rowArray.every(cell => cell === null || cell === '')) {
                return; // Skip empty rows
            }
            const rawRowData: any = {};
            headers.forEach((header, colIndex) => {
              const positionKey = headerMapping[header];
              if (positionKey) {
                let excelValue = rowArray[colIndex];
                if (excelValue === null || excelValue === undefined) {
                  rawRowData[positionKey] = null;
                } else if (typeof excelValue === 'string') {
                  rawRowData[positionKey] = excelValue.trim();
                } else if (positionKey === 'startDate') {
                   rawRowData[positionKey] = excelValue instanceof Date ? excelValue : null;
                } else {
                   rawRowData[positionKey] = String(excelValue).trim();
                }
              }
            });
            
            const validation = importPositionSchema.safeParse(rawRowData);

            if (validation.success) {
              const validatedData = validation.data;
              let resolvedReportsToId: string | null = null;
              let resolvedAssignedPersonnelId: string | null = null;

              if (validatedData.reportsToPersonnelRegistryNumber) {
                const parentAssignee = personnelByRegistry.get(validatedData.reportsToPersonnelRegistryNumber);
                if (parentAssignee) {
                  const parentPosition = positions.find(pos => pos.assignedPersonnelId === parentAssignee.id);
                  if (parentPosition) {
                    resolvedReportsToId = parentPosition.id;
                  } else {
                    warnings.push({ rowIndex: rowIndex + 2, message: `'${validatedData.reportsToPersonnelRegistryNumber}' sicilli personelin bağlı olduğu pozisyon bulunamadı. 'Bağlı olduğu pozisyon' boş bırakılacak.` });
                  }
                } else {
                  warnings.push({ rowIndex: rowIndex + 2, message: `Bağlı olduğu personel için '${validatedData.reportsToPersonnelRegistryNumber}' sicil no bulunamadı. 'Bağlı olduğu pozisyon' boş bırakılacak.` });
                }
              }

              if (validatedData.assignedPersonnelRegistryNumber && validatedData.status !== "Boş") {
                const assignee = personnelByRegistry.get(validatedData.assignedPersonnelRegistryNumber);
                if (assignee) {
                  resolvedAssignedPersonnelId = assignee.id;
                } else {
                   warnings.push({ rowIndex: rowIndex + 2, message: `Atanacak personel için '${validatedData.assignedPersonnelRegistryNumber}' sicil no bulunamadı. Personel atanmayacak.` });
                }
              } else if (validatedData.status === "Boş") {
                  resolvedAssignedPersonnelId = null; 
              }
              
              const positionDataFromExcel: Omit<Position, 'id'> = {
                name: validatedData.name,
                department: validatedData.department,
                dutyLocation: validatedData.dutyLocation || null,
                originalTitle: validatedData.originalTitle || null,
                status: validatedData.status,
                reportsTo: resolvedReportsToId,
                assignedPersonnelId: resolvedAssignedPersonnelId,
                startDate: validatedData.startDate && validatedData.status !== "Boş" ? new Date(validatedData.startDate) : null,
              };
              
              const key = `${(positionDataFromExcel.department || '').trim().toLowerCase()}|${(positionDataFromExcel.name || '').trim().toLowerCase()}|${(positionDataFromExcel.dutyLocation || '').trim().toLowerCase()}`;
              const existingPosition = existingPositionMap.get(key);

              if (existingPosition) {
                positionsToUpdate.push({ ...existingPosition, ...positionDataFromExcel, id: existingPosition.id });
              } else {
                positionsToAdd.push(positionDataFromExcel);
              }

            } else {
              const errorMessagesForToast = validation.error.issues.map(issue => {
                let issuePath = issue.path.join('.');
                if (issue.path.length === 1 && positionHeaderMappingReverse[issue.path[0] as string]) {
                  issuePath = positionHeaderMappingReverse[issue.path[0] as string];
                }
                return issuePath ? `${issuePath}: ${issue.message}` : issue.message;
              });
              const errorDescription = errorMessagesForToast.join('; ') || "Bilinmeyen bir pozisyon doğrulama hatası oluştu.";
              errors.push({ rowIndex: rowIndex + 2, message: errorDescription });
            }
          } catch (e: any) {
              errors.push({ rowIndex: rowIndex + 2, message: `Beklenmedik bir hata oluştu: ${e.message}` });
          }
        });

        if (positionsToAdd.length > 0) batchAddPositions(positionsToAdd);
        if (positionsToUpdate.length > 0) batchUpdatePositions(positionsToUpdate);
        
        let summaryMessage = "";
        if (positionsToAdd.length > 0) summaryMessage += `${positionsToAdd.length} pozisyon eklendi. `;
        if (positionsToUpdate.length > 0) summaryMessage += `${positionsToUpdate.length} pozisyon güncellendi. `;
        if (errors.length > 0) summaryMessage += `${errors.length} satır hatalı. `;
        if (warnings.length > 0) summaryMessage += `${warnings.length} uyarı oluştu.`;
        
        if (summaryMessage.trim() === "") {
            summaryMessage = "İçe aktarılacak yeni veya güncellenecek pozisyon bulunamadı ya da tüm satırlar hatalıydı.";
        }

        toast({
          title: "Pozisyon İçe Aktarma Tamamlandı",
          description: summaryMessage.trim(),
        });
        
        if (errors.length > 0 || warnings.length > 0) {
            const errorDetails = errors.slice(0, 3).map(e => `Hata Satır ${e.rowIndex}: ${e.message}`).join('\n');
            const warningDetails = warnings.slice(0, 2).map(w => `Uyarı Satır ${w.rowIndex}: ${w.message}`).join('\n');
            toast({
              title: "İçe Aktarma Detayları",
              description: `${errorDetails}${errors.length > 3 ? '\n...daha fazla hata mevcut.' : ''}\n\n${warningDetails}${warnings.length > 2 ? '\n...daha fazla uyarı mevcut.' : ''}`,
              variant: "destructive",
              duration: 15000,
            })
        }
      } catch (error: any) {
        if (error.message && error.message.includes("password-protected")) {
          toast({ title: "Hata", description: "Yüklenen pozisyon dosyası şifre korumalı. Lütfen şifresiz bir dosya seçin.", variant: "destructive" });
        } else {
          toast({ title: "Hata", description: `Pozisyon Excel dosyası işlenirken bir sorun oluştu: ${error.message}`, variant: "destructive" });
        }
      } finally {
        if (event.target) {
          event.target.value = ""; 
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleTasraPositionFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          toast({ title: "Hata", description: "Taşra pozisyon Excel dosyası boş veya sadece başlık satırı içeriyor.", variant: "destructive" });
          return;
        }

        const headers = (jsonData[0] as string[]).map(normalizeHeader);
        const rows = jsonData.slice(1);

        const headerMapping: { [key: string]: keyof z.infer<typeof importTasraPositionSchema> } = {
          'unite': 'unit',
          'gorevyeri': 'dutyLocation',
          'kadrounvani': 'kadroUnvani',
          'durum': 'status', 
          'asilunvan': 'originalTitle',
          'atananpersonelsicil': 'assignedPersonnelRegistryNumber', 'personelsicil': 'assignedPersonnelRegistryNumber', 'atananpersonel': 'assignedPersonnelRegistryNumber',
          'baslamatarihi': 'startDate',
          'goreviverenmakam': 'actingAuthority', 'makam': 'actingAuthority',
          'vekaletucretialiyormu': 'receivesProxyPay', 'vekaletucreti': 'receivesProxyPay',
          'yetkidevrivarmi': 'hasDelegatedAuthority', 'yetkidevri': 'hasDelegatedAuthority',
        };
        
        const positionHeaderMappingReverse: { [key: string]: string } = {
          'unit': 'Ünite', 'dutyLocation': 'Görev Yeri', 'kadroUnvani': 'Kadro Ünvanı', 'status': 'Durum', 'originalTitle': 'Asıl Ünvan',
          'assignedPersonnelRegistryNumber': 'Atanan Personel Sicil', 'startDate': 'Başlama Tarihi',
          'actingAuthority': 'Görevi Veren Makam', 'receivesProxyPay': 'Vekalet Ücreti Alıyor Mu?', 'hasDelegatedAuthority': 'Yetki Devri Var Mı?',
        };

        const positionsToAdd: Omit<TasraPosition, 'id'>[] = [];
        const positionsToUpdate: TasraPosition[] = [];
        const errors: { rowIndex: number; message: string; }[] = [];
        const warnings: { rowIndex: number; message: string; }[] = [];
        
        const existingPositionMap = new Map<string, TasraPosition>(
          tasraPositions.map(p => {
            const key = `${(p.unit || '').trim().toLowerCase()}|${(p.dutyLocation || '').trim().toLowerCase()}`;
            return [key, p];
          })
        );
        const personnelByRegistry = new Map<string, Personnel>(allTasraPersonnel.map(p => [p.registryNumber, p]));

        rows.forEach((rowArray, rowIndex) => {
          try {
            if (rowArray.every(cell => cell === null || cell === '')) {
                return; // Skip empty rows
            }
            const rawRowData: any = {};
            headers.forEach((header, colIndex) => {
              const positionKey = headerMapping[header];
              if (positionKey) {
                let excelValue = rowArray[colIndex];
                if (excelValue === null || excelValue === undefined) {
                  rawRowData[positionKey] = null;
                } else if (typeof excelValue === 'string') {
                  rawRowData[positionKey] = excelValue.trim();
                } else if (positionKey === 'startDate') {
                   rawRowData[positionKey] = excelValue instanceof Date ? excelValue : null;
                } else {
                   rawRowData[positionKey] = String(excelValue).trim();
                }
              }
            });
            
            const validation = importTasraPositionSchema.safeParse(rawRowData);

            if (validation.success) {
              const validatedData = validation.data;
              let resolvedAssignedPersonnelId: string | null = null;
              
              if (validatedData.assignedPersonnelRegistryNumber && validatedData.status !== "Boş") {
                const assignee = personnelByRegistry.get(validatedData.assignedPersonnelRegistryNumber);
                if (assignee) {
                  resolvedAssignedPersonnelId = assignee.id;
                } else {
                   warnings.push({ rowIndex: rowIndex + 2, message: `Atanacak personel için '${validatedData.assignedPersonnelRegistryNumber}' sicil no bulunamadı. Personel atanmayacak.` });
                }
              } else if (validatedData.status === "Boş") {
                  resolvedAssignedPersonnelId = null; 
              }
              
              const isProxyOrActing = validatedData.status === 'Vekalet' || validatedData.status === 'Yürütme';
              
              const receivesProxyPay = isProxyOrActing ? ['evet', 'true', '1', 'var', 'alıyor'].includes(String(validatedData.receivesProxyPay).trim().toLowerCase()) : false;
              const hasDelegatedAuthority = isProxyOrActing ? ['evet', 'true', '1', 'var'].includes(String(validatedData.hasDelegatedAuthority).trim().toLowerCase()) : false;

              const positionDataFromExcel: Omit<TasraPosition, 'id'> = {
                unit: validatedData.unit,
                dutyLocation: validatedData.dutyLocation,
                kadroUnvani: validatedData.kadroUnvani || null,
                originalTitle: isProxyOrActing ? validatedData.originalTitle || null : null,
                status: validatedData.status,
                assignedPersonnelId: resolvedAssignedPersonnelId,
                startDate: validatedData.startDate && validatedData.status !== "Boş" ? new Date(validatedData.startDate) : null,
                actingAuthority: isProxyOrActing ? validatedData.actingAuthority : null,
                receivesProxyPay: isProxyOrActing ? receivesProxyPay : false,
                hasDelegatedAuthority: isProxyOrActing ? hasDelegatedAuthority : false,
              };
              
              const key = `${(positionDataFromExcel.unit || '').trim().toLowerCase()}|${(positionDataFromExcel.dutyLocation || '').trim().toLowerCase()}`;
              const existingPosition = existingPositionMap.get(key);

              if (existingPosition) {
                positionsToUpdate.push({ ...existingPosition, ...positionDataFromExcel, id: existingPosition.id });
              } else {
                positionsToAdd.push(positionDataFromExcel);
              }

            } else {
              const errorMessagesForToast = validation.error.issues.map(issue => {
                let issuePath = issue.path.join('.');
                if (issue.path.length === 1 && positionHeaderMappingReverse[issue.path[0] as string]) {
                  issuePath = positionHeaderMappingReverse[issue.path[0] as string];
                }
                return issuePath ? `${issuePath}: ${issue.message}` : issue.message;
              });
              const errorDescription = errorMessagesForToast.join('; ') || "Bilinmeyen bir taşra pozisyonu doğrulama hatası oluştu.";
              errors.push({ rowIndex: rowIndex + 2, message: errorDescription });
            }
          } catch(e: any) {
              errors.push({ rowIndex: rowIndex + 2, message: `Beklenmedik bir hata oluştu: ${e.message}` });
          }
        });

        if (positionsToAdd.length > 0) batchAddTasraPosition(positionsToAdd);
        if (positionsToUpdate.length > 0) batchUpdateTasraPosition(positionsToUpdate);
        
        let summaryMessage = "";
        if (positionsToAdd.length > 0) summaryMessage += `${positionsToAdd.length} pozisyon eklendi. `;
        if (positionsToUpdate.length > 0) summaryMessage += `${positionsToUpdate.length} pozisyon güncellendi. `;
        if (errors.length > 0) summaryMessage += `${errors.length} satır hatalı. `;
        if (warnings.length > 0) summaryMessage += `${warnings.length} uyarı oluştu.`;
        
        if (summaryMessage.trim() === "") {
            summaryMessage = "İçe aktarılacak yeni veya güncellenecek pozisyon bulunamadı ya da tüm satırlar hatalıydı.";
        }

        toast({
          title: "Taşra Pozisyon İçe Aktarma Tamamlandı",
          description: summaryMessage.trim(),
        });

        if (errors.length > 0 || warnings.length > 0) {
            const errorDetails = errors.slice(0, 3).map(e => `Hata Satır ${e.rowIndex}: ${e.message}`).join('\n');
            const warningDetails = warnings.slice(0, 2).map(w => `Uyarı Satır ${w.rowIndex}: ${w.message}`).join('\n');
            toast({
              title: "İçe Aktarma Detayları",
              description: `${errorDetails}${errors.length > 3 ? '\n...daha fazla hata mevcut.' : ''}\n\n${warningDetails}${warnings.length > 2 ? '\n...daha fazla uyarı mevcut.' : ''}`,
              variant: "destructive",
              duration: 15000,
            })
        }
      } catch (error: any) {
        if (error.message && error.message.includes("password-protected")) {
          toast({ title: "Hata", description: "Yüklenen pozisyon dosyası şifre korumalı. Lütfen şifresiz bir dosya seçin.", variant: "destructive" });
        } else {
          toast({ title: "Hata", description: `Taşra Pozisyon Excel dosyası işlenirken bir sorun oluştu: ${error.message}`, variant: "destructive" });
        }
      } finally {
        if (event.target) {
          event.target.value = ""; 
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  if (!isUsersInitialized || !isDepposhInitialized) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
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
    );
  }

  const renderContent = () => {
    switch (activeView) {
        case 'dashboard':
            return (
                <DashboardHome
                    positions={positions}
                    personnel={personnel}
                    tasraPositions={tasraPositions}
                    tasraPersonnel={tasraPersonnel}
                    cards={cards}
                    allUsers={users}
                    onUpdateCard={updateCard}
                    onEditCard={handleEditTalimat}
                    onDeleteCard={deleteCard}
                />
            );
        case 'merkez-pozisyon':
            return (
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle id="positions-heading" className="text-sm font-semibold">Merkez Pozisyonları</CardTitle>
                      <CardDescription>Şirket içindeki tüm merkez pozisyonları yönetin ve görüntüleyin.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button onClick={handleAddPositionClick} size="sm">
                            Pozisyon Ekle
                        </Button>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Mevcut sayfada ara..."
                          className="pl-8 h-9"
                          value={positionSearchTerm}
                          onChange={(e) => setPositionSearchTerm(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleImportPositionsClick} variant="outline" size="sm" className="flex-shrink-0">
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Yükle
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PositionFilter currentFilter={filter} onFilterChange={setFilter} />
                    {merkezLoading && !isUsersInitialized ? (
                        <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <PositionList 
                        positions={filteredPositions} 
                        allPersonnel={allMerkezPersonnel}
                        allUsers={users}
                        onEdit={handleEditPosition}
                        onDelete={handleDeletePosition}
                        />
                    )}
                  </CardContent>
                  <div className="flex items-center justify-end space-x-2 border-t p-4">
                        <span className="text-sm text-muted-foreground">
                            {page.start} - {page.end} / {totalCount.positions} gösteriliyor
                        </span>
                        <Button variant="outline" size="sm" onClick={() => fetchPrevMerkezPage('positions')} disabled={page.isFirst}>
                            <ChevronLeft className="h-4 w-4"/> Önceki
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => fetchNextMerkezPage('positions')} disabled={page.isLast}>
                            Sonraki <ChevronRight className="h-4 w-4"/>
                        </Button>
                    </div>
                </Card>
            );
        case 'merkez-personel':
            return (
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-sm font-semibold" id="personnel-heading">Merkez Personel Listesi</CardTitle>
                      <CardDescription>Merkez personelini yönetin.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button onClick={handleAddPersonnelClick} size="sm">
                           Personel Ekle
                        </Button>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Mevcut sayfada ara..."
                          className="pl-8 h-9"
                          value={personnelSearchTerm}
                          onChange={(e) => setPersonnelSearchTerm(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleImportPersonnelClick} variant="outline" size="sm" className="flex-shrink-0">
                        <UploadCloud className="mr-2 h-4 w-4"/>
                        Yükle
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {merkezLoading ? (
                         <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <PersonnelList
                        personnel={filteredPersonnel}
                        allUsers={users}
                        onEdit={handleEditPersonnel}
                        onDelete={handleDeletePersonnel}
                        />
                    )}
                  </CardContent>
                   <div className="flex items-center justify-end space-x-2 border-t p-4">
                        <span className="text-sm text-muted-foreground">
                            {page.start} - {page.end} / {totalCount.personnel} gösteriliyor
                        </span>
                        <Button variant="outline" size="sm" onClick={() => fetchPrevMerkezPage('personnel')} disabled={page.isFirst}>
                             <ChevronLeft className="h-4 w-4"/> Önceki
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => fetchNextMerkezPage('personnel')} disabled={page.isLast}>
                            Sonraki <ChevronRight className="h-4 w-4"/>
                        </Button>
                    </div>
                </Card>
            );
        case 'merkez-sema':
             return (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle id="org-chart-heading">Organizasyon Şeması</CardTitle>
                    <CardDescription>Şirketin raporlama yapısının görsel özeti.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OrgChart positions={positions} allPersonnel={allMerkezPersonnel} />
                  </CardContent>
                </Card>
            );
        case 'tasra-pozisyon':
            return (
                 <Card className="shadow-lg">
                   <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle id="tasra-positions-heading" className="text-sm font-semibold">Taşra Pozisyonları</CardTitle>
                      <CardDescription>Şirket içindeki tüm taşra pozisyonları yönetin ve görüntüleyin.</CardDescription>
                    </div>
                     <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button onClick={handleAddTasraPositionClick} size="sm">
                            Pozisyon Ekle
                        </Button>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Mevcut sayfada ara..."
                          className="pl-8 h-9"
                          value={tasraPositionSearchTerm}
                          onChange={(e) => setTasraPositionSearchTerm(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleImportTasraPositionsClick} variant="outline" size="sm" className="flex-shrink-0">
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Yükle
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                     {tasraLoading ? (
                         <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                     ) : (
                        <TasraPositionList
                        positions={filteredTasraPositions}
                        allPersonnel={allTasraPersonnel}
                        allUsers={users}
                        onEdit={handleEditTasraPosition}
                        onDelete={handleDeleteTasraPosition}
                        />
                     )}
                  </CardContent>
                   <div className="flex items-center justify-end space-x-2 border-t p-4">
                        <span className="text-sm text-muted-foreground">
                            {tasraPage.start} - {tasraPage.end} / {tasraTotalCount.positions} gösteriliyor
                        </span>
                        <Button variant="outline" size="sm" onClick={() => fetchPrevTasraPage('positions')} disabled={tasraPage.isFirst}>
                             <ChevronLeft className="h-4 w-4"/> Önceki
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => fetchNextTasraPage('positions')} disabled={tasraPage.isLast}>
                            Sonraki <ChevronRight className="h-4 w-4"/>
                        </Button>
                    </div>
                </Card>
            );
        case 'tasra-personel':
            return (
                <Card className="shadow-lg">
                   <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-sm font-semibold" id="tasra-personnel-heading">Taşra Personel Listesi</CardTitle>
                      <CardDescription>Taşra personelini yönetin.</CardDescription>
                    </div>
                     <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button onClick={handleAddTasraPersonnelClick} size="sm">
                            Personel Ekle
                        </Button>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Mevcut sayfada ara..."
                          className="pl-8 h-9"
                          value={tasraPersonnelSearchTerm}
                          onChange={(e) => setTasraPersonnelSearchTerm(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleImportPersonnelClick} variant="outline" size="sm" className="flex-shrink-0">
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Yükle
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {tasraLoading ? (
                        <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <PersonnelList
                        personnel={filteredTasraPersonnel}
                        allUsers={users}
                        onEdit={handleEditTasraPersonnel}
                        onDelete={handleDeleteTasraPersonnel}
                        />
                    )}
                  </CardContent>
                  <div className="flex items-center justify-end space-x-2 border-t p-4">
                        <span className="text-sm text-muted-foreground">
                            {tasraPage.start} - {tasraPage.end} / {tasraTotalCount.personnel} gösteriliyor
                        </span>
                        <Button variant="outline" size="sm" onClick={() => fetchPrevTasraPage('personnel')} disabled={tasraPage.isFirst}>
                             <ChevronLeft className="h-4 w-4"/> Önceki
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => fetchNextTasraPage('personnel')} disabled={tasraPage.isLast}>
                            Sonraki <ChevronRight className="h-4 w-4"/>
                        </Button>
                    </div>
                </Card>
            );
        case 'raporlama':
            return (
                <ReportingPanel
                    positions={positions}
                    personnel={allMerkezPersonnel}
                    tasraPositions={tasraPositions}
                    tasraPersonnel={allTasraPersonnel}
                />
            );
        case 'kullanici-onay':
             if (user?.role !== 'admin') {
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Erişim Reddedildi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Bu sayfayı görüntüleme yetkiniz yok.</p>
                        </CardContent>
                    </Card>
                );
             }
             return <UserApprovalPanel users={users} onApproveUser={approveUser} />;
        case 'talimatlar':
            return <TalimatlarBoard cards={cards} allUsers={users} addCard={addCard} updateCard={updateCard} deleteCard={deleteCard} updateCardBatch={updateCardBatch} />;
        case 'depposh-taslak':
            return <FileListView category="taslak" files={files} addFile={addFile} deleteFile={deleteFile} updateFileOrder={updateFileOrder} />;
        case 'depposh-matbu':
            return <FileListView category="matbu" files={files} addFile={addFile} deleteFile={deleteFile} updateFileOrder={updateFileOrder} />;
        case 'depposh-guncel':
            return <FileListView category="güncel" files={files} addFile={addFile} deleteFile={deleteFile} updateFileOrder={updateFileOrder} />;
        case 'depposh-mevzuat':
            return <FileListView category="mevzuat" files={files} addFile={addFile} deleteFile={deleteFile} updateFileOrder={updateFileOrder} />;
        default:
            return (
                 <DashboardHome
                    positions={positions}
                    personnel={personnel}
                    tasraPositions={tasraPositions}
                    tasraPersonnel={tasraPersonnel}
                    cards={cards}
                    allUsers={users}
                    onUpdateCard={updateCard}
                    onEditCard={handleEditTalimat}
                    onDeleteCard={deleteCard}
                />
            );
    }
  }

  return (
    <>
      {renderContent()}

      <input
        type="file"
        ref={personnelFileInputRef}
        onChange={handlePersonnelFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />
       <input
        type="file"
        ref={positionFileInputRef}
        onChange={handlePositionFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />
      <input
        type="file"
        ref={tasraPositionFileInputRef}
        onChange={handleTasraPositionFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Merkez Dialogs */}
      <AddEditPositionDialog
        isOpen={isPositionDialogOpen}
        onOpenChange={setIsPositionDialogOpen}
        positionToEdit={editingPosition}
        allPositions={positions}
        allPersonnel={allMerkezPersonnel}
        onSave={handleSavePosition}
        updatePersonnel={updatePersonnel} 
      />
      <AddEditPersonnelDialog
        isOpen={isPersonnelDialogOpen}
        onOpenChange={setIsPersonnelDialogOpen}
        personnelToEdit={editingPersonnel}
        onSave={handleSavePersonnel}
      />

      {/* Taşra Dialogs */}
      <AddEditTasraPositionDialog
        isOpen={isTasraPositionDialogOpen}
        onOpenChange={setIsTasraPositionDialogOpen}
        positionToEdit={editingTasraPosition}
        allPersonnel={allTasraPersonnel}
        onSave={handleSaveTasraPosition}
      />
      <AddEditPersonnelDialog
        isOpen={isTasraPersonnelDialogOpen}
        onOpenChange={setIsTasraPersonnelDialogOpen}
        personnelToEdit={editingTasraPersonnel}
        onSave={handleSaveTasraPersonnel}
      />

       {/* Talimatlar Dialog */}
       <AddEditTalimatDialog
        isOpen={isTalimatDialogOpen}
        onOpenChange={setIsTalimatDialogOpen}
        cardToEdit={editingTalimat}
        allUsers={users}
        onSave={(data) => {
            if('id' in data) {
                updateCard(data);
            } else {
                addCard(data);
            }
        }}
      />
    </>
  );
}


export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DashboardPageContent />
        </Suspense>
    )
}

    

    

    

