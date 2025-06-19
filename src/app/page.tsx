
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import * as XLSX from 'xlsx';
import * as z from "zod";
import { AppHeader } from "@/components/app-header";
import { AddEditPositionDialog } from "@/components/add-edit-position-dialog";
import { AddEditPersonnelDialog } from "@/components/add-edit-personnel-dialog";
import { PositionFilter, type PositionFilterType } from "@/components/position-filter";
import { PositionList } from "@/components/position-list";
import { PersonnelList } from "@/components/personnel-list";
import { OrgChart } from "@/components/org-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePositions } from "@/hooks/use-positions";
import type { Position, Personnel } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud } from "lucide-react";

const importPersonnelSchema = z.object({
  firstName: z.string().min(1, "Adı boş olamaz."),
  lastName: z.string().min(1, "Soyadı boş olamaz."),
  registryNumber: z.string().min(1, "Sicil Numarası boş olamaz."),
  status: z.enum(["İHS", "399"], { errorMap: () => ({ message: "Statü 'İHS' veya '399' olmalıdır." }) }),
  photoUrl: z.string().url("Geçerli bir URL girin.").optional().nullable().or(z.literal('')),
  email: z.string().email("Geçerli bir e-posta adresi girin.").optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable().or(z.literal('')),
});

const importPositionSchema = z.object({
  name: z.string().min(1, "Ünvan boş olamaz."),
  department: z.string().min(1, "Birim boş olamaz."),
  dutyLocation: z.string().optional().nullable().or(z.literal('')),
  status: z.enum(["Asıl", "Vekalet", "Yürütme", "Boş"], { 
    errorMap: () => ({ message: "Durum 'Asıl', 'Vekalet', 'Yürütme' veya 'Boş' olmalıdır." }) 
  }),
  reportsToPersonnelRegistryNumber: z.string().optional().nullable().or(z.literal('')),
  assignedPersonnelRegistryNumber: z.string().optional().nullable().or(z.literal('')),
  startDate: z.date().optional().nullable(),
});


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

  const { toast } = useToast();
  const personnelFileInputRef = useRef<HTMLInputElement>(null);
  const positionFileInputRef = useRef<HTMLInputElement>(null);

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
      addPersonnel(data as Omit<Personnel, 'id'> & { status: 'İHS' | '399' });
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

  const handleImportPersonnelClick = () => {
    personnelFileInputRef.current?.click();
  };

  const handleImportPositionsClick = () => {
    positionFileInputRef.current?.click();
  };

  const normalizeHeader = (header: string) => header.toLowerCase().replace(/\s+/g, '');

  const handlePersonnelFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length === 0) {
          toast({ title: "Hata", description: "Excel dosyası boş.", variant: "destructive" });
          return;
        }

        const headers = (jsonData[0] as string[]).map(normalizeHeader);
        const rows = jsonData.slice(1);

        const headerMapping: { [key: string]: keyof Omit<Personnel, 'id'> } = {
          'adı': 'firstName', 'ad': 'firstName',
          'soyadı': 'lastName', 'soyad': 'lastName',
          'sicilnumarası': 'registryNumber', 'sicilno': 'registryNumber', 'sicil': 'registryNumber',
          'statü': 'status', 'statu': 'status',
          'eposta': 'email', 'mail': 'email',
          'telefon': 'phone', 'tel': 'phone',
          'fotoğrafurl': 'photoUrl', 'fotourl': 'photoUrl', 'foto': 'photoUrl',
        };
        
        let importedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        rows.forEach((rowArray, rowIndex) => {
          const rawRow: any = {};
          headers.forEach((header, colIndex) => {
            const personnelKey = headerMapping[header];
            if (personnelKey) {
              let excelValue = rowArray[colIndex];
              if (excelValue === null || excelValue === undefined) {
                rawRow[personnelKey] = null;
              } else if (typeof excelValue === 'string') {
                rawRow[personnelKey] = excelValue.trim();
              } else if (personnelKey === 'registryNumber' && typeof excelValue === 'number') {
                rawRow[personnelKey] = String(excelValue);
              } else if (personnelKey === 'status') {
                 rawRow[personnelKey] = String(excelValue).trim();
              }
               else {
                rawRow[personnelKey] = String(excelValue).trim();
              }
            }
          });

          const validation = importPersonnelSchema.safeParse(rawRow);

          if (validation.success) {
            const newPerson = validation.data as Omit<Personnel, 'id'> & { status: 'İHS' | '399' };
            if (personnel.some(p => p.registryNumber === newPerson.registryNumber)) {
              skippedCount++;
            } else {
              addPersonnel(newPerson);
              importedCount++;
            }
          } else {
            errorCount++;
            const personnelHeaderMappingReverse: { [key: string]: string } = {
              'firstName': 'Adı', 'lastName': 'Soyadı', 'registryNumber': 'Sicil Numarası',
              'status': 'Statü', 'email': 'E-posta', 'phone': 'Telefon', 'photoUrl': 'Fotoğraf URL',
            };
            const errorMessagesForToast = validation.error.issues.map(issue => {
              let issuePath = issue.path.join('.');
              if (issue.path.length === 1 && personnelHeaderMappingReverse[issue.path[0] as string]) {
                issuePath = personnelHeaderMappingReverse[issue.path[0] as string];
              }
              return issuePath ? `${issuePath}: ${issue.message}` : issue.message;
            });
            const errorDescription = errorMessagesForToast.join('; ') || "Bilinmeyen bir personel doğrulama hatası oluştu.";
            
            console.error(`Personel Satır ${rowIndex + 2} için doğrulama hatası. Zod issues:`, validation.error.issues);
            toast({
              title: `Personel Satır ${rowIndex + 2} Hatası`,
              description: errorDescription,
              variant: "destructive",
              duration: 5000 + rowIndex * 200 
            });
          }
        });

        let summaryMessage = `${importedCount} personel başarıyla içe aktarıldı.`;
        if (skippedCount > 0) summaryMessage += ` ${skippedCount} personel (sicil no mevcut) atlandı.`;
        if (errorCount > 0) summaryMessage += ` ${errorCount} personel hatalı veri nedeniyle eklenemedi.`;
        
        toast({
          title: "Personel İçe Aktarma Tamamlandı",
          description: summaryMessage,
        });

      } catch (error: any) {
        console.error("Excel dosyası işlenirken hata:", error);
        if (error.message && error.message.includes("password-protected")) {
          toast({ title: "Hata", description: "Yüklenen dosya şifre korumalı. Lütfen şifresiz bir dosya seçin.", variant: "destructive" });
        } else {
          toast({ title: "Hata", description: "Excel dosyası işlenirken bir sorun oluştu.", variant: "destructive" });
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

        if (jsonData.length === 0) {
          toast({ title: "Hata", description: "Pozisyon Excel dosyası boş.", variant: "destructive" });
          return;
        }

        const headers = (jsonData[0] as string[]).map(normalizeHeader);
        const rows = jsonData.slice(1);

        const headerMapping: { [key: string]: keyof z.infer<typeof importPositionSchema> } = {
          'ünvan': 'name', 'unvan': 'name',
          'birim': 'department',
          'görevyeri': 'dutyLocation', 'gorevyeri': 'dutyLocation',
          'durum': 'status', 
          'bağlıolduğupersonelsicil': 'reportsToPersonnelRegistryNumber', 'baglioldugupersonelsicil': 'reportsToPersonnelRegistryNumber', 'raporladiğisicil': 'reportsToPersonnelRegistryNumber',
          'atananpersonelsicil': 'assignedPersonnelRegistryNumber', 'personelsicil': 'assignedPersonnelRegistryNumber',
          'başlamatarihi': 'startDate', 'baslamatarihi': 'startDate',
        };
        
        const positionHeaderMappingReverse: { [key: string]: string } = {
          'name': 'Ünvan', 'department': 'Birim', 'dutyLocation': 'Görev Yeri',
          'status': 'Durum', 'reportsToPersonnelRegistryNumber': 'Bağlı Olduğu Personel Sicil',
          'assignedPersonnelRegistryNumber': 'Atanan Personel Sicil', 'startDate': 'Başlama Tarihi',
        };

        let addedCount = 0;
        let updatedCount = 0;
        let errorCount = 0;
        let warningCount = 0;

        rows.forEach((rowArray, rowIndex) => {
          const rawRowData: any = {};
          headers.forEach((header, colIndex) => {
            const positionKey = headerMapping[header];
            if (positionKey) {
              let excelValue = rowArray[colIndex];
              if (excelValue === null || excelValue === undefined) {
                rawRowData[positionKey] = null;
              } else if (typeof excelValue === 'string') {
                rawRowData[positionKey] = excelValue.trim();
              } else if ((positionKey === 'reportsToPersonnelRegistryNumber' || positionKey === 'assignedPersonnelRegistryNumber') && typeof excelValue === 'number') {
                rawRowData[positionKey] = String(excelValue);
              } else if (positionKey === 'status') {
                rawRowData[positionKey] = String(excelValue).trim();
              } else if (positionKey === 'startDate') {
                rawRowData[positionKey] = excelValue; // Should be Date object or null
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
              const parentAssignee = personnel.find(p => p.registryNumber === validatedData.reportsToPersonnelRegistryNumber);
              if (parentAssignee) {
                const parentPosition = positions.find(pos => pos.assignedPersonnelId === parentAssignee.id);
                if (parentPosition) {
                  resolvedReportsToId = parentPosition.id;
                } else {
                  warningCount++;
                  toast({ title: `Pozisyon Satır ${rowIndex + 2} Uyarısı`, description: `'${validatedData.reportsToPersonnelRegistryNumber}' sicilli personelin bağlı olduğu pozisyon bulunamadı. 'Bağlı olduğu pozisyon' boş bırakılacak.`, variant: "default", duration: 4000 + warningCount * 100 });
                }
              } else {
                warningCount++;
                toast({ title: `Pozisyon Satır ${rowIndex + 2} Uyarısı`, description: `Bağlı olduğu personel için '${validatedData.reportsToPersonnelRegistryNumber}' sicil no bulunamadı. 'Bağlı olduğu pozisyon' boş bırakılacak.`, variant: "default", duration: 4000 + warningCount * 100 });
              }
            }

            if (validatedData.assignedPersonnelRegistryNumber && validatedData.status !== "Boş") {
              const assignee = personnel.find(p => p.registryNumber === validatedData.assignedPersonnelRegistryNumber);
              if (assignee) {
                resolvedAssignedPersonnelId = assignee.id;
              } else {
                 warningCount++;
                 toast({ title: `Pozisyon Satır ${rowIndex + 2} Uyarısı`, description: `Atanacak personel için '${validatedData.assignedPersonnelRegistryNumber}' sicil no bulunamadı. Personel atanmayacak.`, variant: "default", duration: 4000 + warningCount * 100 });
              }
            } else if (validatedData.status === "Boş") {
                resolvedAssignedPersonnelId = null; 
            }
            
            const positionDataFromExcel: Omit<Position, 'id'> = {
              name: validatedData.name,
              department: validatedData.department,
              dutyLocation: validatedData.dutyLocation || null,
              status: validatedData.status,
              reportsTo: resolvedReportsToId,
              assignedPersonnelId: resolvedAssignedPersonnelId,
              startDate: validatedData.startDate && validatedData.status !== "Boş" ? new Date(validatedData.startDate) : null,
            };
            
            const existingPosition = positions.find(p => p.name === positionDataFromExcel.name && p.department === positionDataFromExcel.department);

            if (existingPosition) {
              updatePosition({ ...existingPosition, ...positionDataFromExcel });
              updatedCount++;
            } else {
              addPosition(positionDataFromExcel);
              addedCount++;
            }

          } else {
            errorCount++;
            const errorMessagesForToast = validation.error.issues.map(issue => {
              let issuePath = issue.path.join('.');
              if (issue.path.length === 1 && positionHeaderMappingReverse[issue.path[0] as string]) {
                issuePath = positionHeaderMappingReverse[issue.path[0] as string];
              }
              return issuePath ? `${issuePath}: ${issue.message}` : issue.message;
            });
            const errorDescription = errorMessagesForToast.join('; ') || "Bilinmeyen bir pozisyon doğrulama hatası oluştu.";

            console.error(`Pozisyon Satır ${rowIndex + 2} için doğrulama hatası. Zod issues:`, validation.error.issues);
            toast({
              title: `Pozisyon Satır ${rowIndex + 2} Hatası`,
              description: errorDescription,
              variant: "destructive",
              duration: 5000 + rowIndex * 200
            });
          }
        });

        let summaryMessage = "";
        if (addedCount > 0) summaryMessage += `${addedCount} pozisyon eklendi. `;
        if (updatedCount > 0) summaryMessage += `${updatedCount} pozisyon güncellendi. `;
        if (errorCount > 0) summaryMessage += `${errorCount} pozisyon hatalı veri nedeniyle işlenemedi. `;
        if (warningCount > 0) summaryMessage += `${warningCount} uyarı oluştu (detaylar için önceki mesajlara bakın).`;
        
        if (summaryMessage.trim() === "") {
            summaryMessage = "İçe aktarılacak yeni veya güncellenecek pozisyon bulunamadı ya da tüm satırlar hatalıydı.";
        }

        toast({
          title: "Pozisyon İçe Aktarma Tamamlandı",
          description: summaryMessage.trim(),
        });

      } catch (error: any) {
        console.error("Pozisyon Excel dosyası işlenirken hata:", error);
        if (error.message && error.message.includes("password-protected")) {
          toast({ title: "Hata", description: "Yüklenen pozisyon dosyası şifre korumalı. Lütfen şifresiz bir dosya seçin.", variant: "destructive" });
        } else {
          toast({ title: "Hata", description: "Pozisyon Excel dosyası işlenirken bir sorun oluştu.", variant: "destructive" });
        }
      } finally {
        if (event.target) {
          event.target.value = ""; 
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };


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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle id="positions-heading" className="text-sm font-semibold">Şirket Pozisyonları (Toplam: {positions.length})</CardTitle>
                  <CardDescription>Şirket içindeki tüm pozisyonları yönetin ve görüntüleyin.</CardDescription>
                </div>
                 <Button onClick={handleImportPositionsClick} variant="outline" size="sm">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Excel'den İçe Aktar (Pozisyon)
                </Button>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold" id="personnel-heading">Personel Listesi (Toplam: {personnel.length})</CardTitle>
                  <CardDescription>Şirket personelini yönetin.</CardDescription>
                </div>
                <Button onClick={handleImportPersonnelClick} variant="outline" size="sm">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Excel'den İçe Aktar (Personel)
                </Button>
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
    

    