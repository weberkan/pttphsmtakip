
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { Position, Personnel } from "@/lib/types";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const positionSchema = z.object({
  name: z.string().min(2, "Ünvan en az 2 karakter olmalıdır."),
  department: z.string().min(2, "Birim adı en az 2 karakter olmalıdır."),
  dutyLocation: z.string().optional().nullable(),
  status: z.enum(["Asıl", "Vekalet", "Yürütme", "Boş"]),
  originalTitle: z.string().optional().nullable(),
  reportsTo: z.string().nullable(),
  assignedPersonnelId: z.string().nullable(),
  startDate: z.date().nullable(),
});

type PositionFormData = z.infer<typeof positionSchema>;

interface AddEditPositionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  positionToEdit?: Position | null;
  allPositions: Position[];
  allPersonnel: Personnel[];
  onSave: (positionData: Omit<Position, 'id'> | Position) => void;
  updatePersonnel: (personnel: Personnel) => void;
}

const PLACEHOLDER_FOR_NULL_VALUE = "__PLACEHOLDER_FOR_NULL__";

export function AddEditPositionDialog({
  isOpen,
  onOpenChange,
  positionToEdit,
  allPositions,
  allPersonnel,
  onSave,
  updatePersonnel,
}: AddEditPositionDialogProps) {
  const { toast } = useToast();
  const form = useForm<PositionFormData>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      name: "",
      department: "",
      dutyLocation: "",
      status: "Asıl",
      originalTitle: "",
      reportsTo: null,
      assignedPersonnelId: null,
      startDate: null,
    },
  });

  const positionStatus = form.watch("status");
  const assignedPersonnelId = form.watch("assignedPersonnelId");

  const [currentAssignedPersonnel, setCurrentAssignedPersonnel] = useState<Personnel | null>(null);
  const [selectedPersonnelStatus, setSelectedPersonnelStatus] = useState<'İHS' | '399' | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      if (positionToEdit) {
        form.reset({
          name: positionToEdit.name,
          department: positionToEdit.department,
          dutyLocation: positionToEdit.dutyLocation || "",
          status: positionToEdit.status,
          originalTitle: positionToEdit.originalTitle || "",
          reportsTo: positionToEdit.reportsTo,
          assignedPersonnelId: positionToEdit.assignedPersonnelId,
          startDate: positionToEdit.startDate ? new Date(positionToEdit.startDate) : null,
        });
        if (positionToEdit.assignedPersonnelId && positionToEdit.assignedPersonnelId !== PLACEHOLDER_FOR_NULL_VALUE) {
          const person = allPersonnel.find(p => p.id === positionToEdit.assignedPersonnelId);
          setCurrentAssignedPersonnel(person || null);
          setSelectedPersonnelStatus(person?.status);
        } else {
          setCurrentAssignedPersonnel(null);
          setSelectedPersonnelStatus(undefined);
        }
      } else {
        form.reset({
          name: "",
          department: "",
          dutyLocation: "",
          status: "Asıl",
          originalTitle: "",
          reportsTo: null,
          assignedPersonnelId: null,
          startDate: null,
        });
        setCurrentAssignedPersonnel(null);
        setSelectedPersonnelStatus(undefined);
      }
    } else {
        setCurrentAssignedPersonnel(null);
        setSelectedPersonnelStatus(undefined);
    }
  }, [positionToEdit, form, isOpen, allPersonnel]);

  useEffect(() => {
    if (isOpen) { 
      if (assignedPersonnelId && assignedPersonnelId !== PLACEHOLDER_FOR_NULL_VALUE) {
        const person = allPersonnel.find(p => p.id === assignedPersonnelId);
        setCurrentAssignedPersonnel(person || null);
        setSelectedPersonnelStatus(person?.status);
      } else {
        setCurrentAssignedPersonnel(null);
        setSelectedPersonnelStatus(undefined);
      }
    }
  }, [assignedPersonnelId, allPersonnel, isOpen]);


  const onSubmit = (data: PositionFormData) => {
    if (currentAssignedPersonnel && selectedPersonnelStatus && selectedPersonnelStatus !== currentAssignedPersonnel.status) {
      updatePersonnel({ ...currentAssignedPersonnel, status: selectedPersonnelStatus });
      toast({ title: "Personel Statüsü Güncellendi", description: `${currentAssignedPersonnel.firstName} ${currentAssignedPersonnel.lastName}'nin statüsü ${selectedPersonnelStatus} olarak güncellendi.` });
    }

    const dataToSave = {
      ...data,
      dutyLocation: data.dutyLocation || null,
      originalTitle: data.status === 'Vekalet' || data.status === 'Yürütme' ? data.originalTitle || null : null,
      reportsTo: data.reportsTo === PLACEHOLDER_FOR_NULL_VALUE ? null : data.reportsTo,
      assignedPersonnelId: data.assignedPersonnelId === PLACEHOLDER_FOR_NULL_VALUE || data.status === "Boş" ? null : data.assignedPersonnelId,
      startDate: data.status === "Boş" ? null : data.startDate,
    };

    if (data.status === "Boş") {
      dataToSave.assignedPersonnelId = null;
      setCurrentAssignedPersonnel(null);
      setSelectedPersonnelStatus(undefined);
      dataToSave.startDate = null;
    }

    if (positionToEdit) {
      onSave({ ...positionToEdit, ...dataToSave });
      toast({ title: "Pozisyon Güncellendi", description: `"${data.name}" başarıyla güncellendi.` });
    } else {
      onSave(dataToSave as Omit<Position, 'id'>);
      toast({ title: "Pozisyon Eklendi", description: `"${data.name}" başarıyla eklendi.` });
    }
    onOpenChange(false);
  };
  
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      form.reset(); 
    }
    onOpenChange(open);
  };

  const getStartDateLabel = (status: Position['status']) => {
    switch (status) {
      case 'Asıl':
        return "Atanma Tarihi (Opsiyonel)";
      case 'Vekalet':
        return "Vekalet Görevine Başlama Tarihi (Opsiyonel)";
      case 'Yürütme':
        return "Yürütme Görevine Başlama Tarihi (Opsiyonel)";
      case 'Boş':
        return "Boş Kalma Tarihi (Opsiyonel)";
      default:
        return "Başlama Tarihi (Opsiyonel)";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{positionToEdit ? "Pozisyon Düzenle" : "Yeni Pozisyon Ekle"}</DialogTitle>
          <DialogDescription>
            {positionToEdit ? "Bu pozisyonun detaylarını güncelleyin." : "Yeni pozisyon için detayları girin."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4 space-y-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birim</FormLabel>
                    <FormControl>
                      <Input placeholder="örn: Bilgi Teknolojileri" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dutyLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Görev Yeri (Opsiyonel)</FormLabel>
                    <FormControl>
                      <Input placeholder="örn: Ankara Genel Müdürlük" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ünvan</FormLabel>
                    <FormControl>
                      <Input placeholder="örn: Yazılım Mühendisi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durum</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === "Boş") {
                          form.setValue("assignedPersonnelId", null);
                          form.setValue("startDate", null);
                          setCurrentAssignedPersonnel(null);
                          setSelectedPersonnelStatus(undefined);
                        }
                        if (value === "Asıl" || value === "Boş") {
                            form.setValue("originalTitle", "");
                        }
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Durum seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Asıl">Asıl</SelectItem>
                        <SelectItem value="Vekalet">Vekalet</SelectItem>
                        <SelectItem value="Yürütme">Yürütme</SelectItem>
                        <SelectItem value="Boş">Boş</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(positionStatus === 'Vekalet' || positionStatus === 'Yürütme') && (
                <FormField
                  control={form.control}
                  name="originalTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asıl Ünvan (Opsiyonel)</FormLabel>
                      <FormControl>
                        <Input placeholder="örn: Şube Müdürü" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{getStartDateLabel(positionStatus)}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={positionStatus === "Boş"}
                          >
                            {field.value ? (
                              format(field.value, "dd.MM.yyyy")
                            ) : (
                              <span>Tarih seçin</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? field.value : undefined}
                          onSelect={(date) => field.onChange(date || null)}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01") || positionStatus === "Boş"
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reportsTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bağlı Olduğu Pozisyon (Opsiyonel)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || PLACEHOLDER_FOR_NULL_VALUE}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Raporlayacağı yöneticiyi seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PLACEHOLDER_FOR_NULL_VALUE}>Yok (En üst düzey pozisyon)</SelectItem>
                        {allPositions
                          .filter(p => p.id !== positionToEdit?.id) 
                          .map(p => {
                            const assignedPerson = allPersonnel.find(person => person.id === p.assignedPersonnelId);
                            const personDisplayName = assignedPerson ? `${assignedPerson.firstName} ${assignedPerson.lastName}` : 'Boş';
                            return (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} ({personDisplayName})
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assignedPersonnelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Atanan Personel (Opsiyonel)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || PLACEHOLDER_FOR_NULL_VALUE}
                      disabled={positionStatus === "Boş"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Personel seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PLACEHOLDER_FOR_NULL_VALUE}>Boş (Atanmamış)</SelectItem>
                        {allPersonnel.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.firstName} {p.lastName} ({p.registryNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {currentAssignedPersonnel && positionStatus !== "Boş" && (
                <div className="space-y-2">
                  <Label htmlFor="assignedPersonnelStatus">Atanmış Personelin Statüsü ({currentAssignedPersonnel.firstName} {currentAssignedPersonnel.lastName})</Label>
                  <Select
                    value={selectedPersonnelStatus}
                    onValueChange={(value: 'İHS' | '399') => setSelectedPersonnelStatus(value)}
                    disabled={!currentAssignedPersonnel} 
                  >
                    <SelectTrigger id="assignedPersonnelStatus">
                      <SelectValue placeholder="Personel Statüsü Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="İHS">İHS</SelectItem>
                      <SelectItem value="399">399</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                İptal
              </Button>
              <Button type="submit">
                {positionToEdit ? "Değişiklikleri Kaydet" : "Pozisyon Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
