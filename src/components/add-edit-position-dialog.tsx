
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
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { tr } from "date-fns/locale";

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
  const positionName = form.watch("name");
  const isGenelMudur = positionName?.trim().toLowerCase() === "genel müdür";

  useEffect(() => {
    if (isGenelMudur) {
      form.setValue("reportsTo", null);
    }
  }, [isGenelMudur, form]);


  const [reportsToOpen, setReportsToOpen] = useState(false);
  const [personnelOpen, setPersonnelOpen] = useState(false);

  const [currentAssignedPersonnel, setCurrentAssignedPersonnel] = useState<Personnel | null>(null);
  const [selectedPersonnelStatus, setSelectedPersonnelStatus] = useState<'İHS' | '399' | undefined>(undefined);

  const reportsToOptions = useMemo(() => [
    { value: PLACEHOLDER_FOR_NULL_VALUE, label: "Yok (En üst düzey pozisyon)" },
    ...allPositions
      .filter(p => p.id !== positionToEdit?.id)
      .map(p => {
        const assignedPerson = allPersonnel.find(person => person.id === p.assignedPersonnelId);
        const personDisplayName = assignedPerson ? `${assignedPerson.firstName} ${assignedPerson.lastName}` : 'Boş';
        return {
          value: p.id,
          label: `${p.name} - ${p.department} (${personDisplayName})`
        };
      })
  ], [allPositions, allPersonnel, positionToEdit]);

  const assignedPersonnelOptions = useMemo(() => [
      { value: PLACEHOLDER_FOR_NULL_VALUE, label: "Boş (Atanmamış)" },
      ...allPersonnel.map(p => ({
        value: p.id,
        label: `${p.firstName} ${p.lastName} (${p.registryNumber})`
      }))
  ], [allPersonnel]);

  useEffect(() => {
    if (isOpen) {
      if (positionToEdit) {
        form.reset({
          name: positionToEdit.name,
          department: positionToEdit.department,
          dutyLocation: positionToEdit.dutyLocation || "",
          status: positionToEdit.status,
          originalTitle: positionToEdit.originalTitle || "",
          reportsTo: positionToEdit.name.trim().toLowerCase() === "genel müdür" ? null : positionToEdit.reportsTo,
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
      reportsTo: data.name.trim().toLowerCase() === "genel müdür" ? null : (data.reportsTo === PLACEHOLDER_FOR_NULL_VALUE ? null : data.reportsTo),
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
        return "Atanma Tarihi";
      case 'Vekalet':
        return "Vekalet Başlama Tarihi";
      case 'Yürütme':
        return "Yürütme Başlama Tarihi";
      case 'Boş':
        return "Boş Kalma Tarihi";
      default:
        return "Başlama Tarihi";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{positionToEdit ? "Pozisyon Düzenle" : "Yeni Pozisyon Ekle"}</DialogTitle>
          <DialogDescription>
            {positionToEdit ? "Bu pozisyonun detaylarını güncelleyin." : "Yeni pozisyon için detayları girin."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 py-6">
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
                  name="dutyLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Görev Yeri (Opsiyonel)</FormLabel>
                      <FormControl>
                        <Input placeholder="örn: Ankara" {...field} value={field.value ?? ""} />
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
                  render={({ field }) => {
                    const [inputValue, setInputValue] = useState<string>("");

                    useEffect(() => {
                        if (field.value) {
                            setInputValue(format(field.value, 'dd.MM.yyyy'));
                        } else {
                            setInputValue("");
                        }
                    }, [field.value]);

                    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        setInputValue(e.target.value);
                    };

                    const handleInputBlur = () => {
                        if (inputValue === "") {
                            field.onChange(null);
                            return;
                        }
                        try {
                            const parsedDate = parse(inputValue, 'dd.MM.yyyy', new Date());
                            if (!isNaN(parsedDate.getTime())) {
                                field.onChange(parsedDate);
                            } else {
                                setInputValue(field.value ? format(field.value, 'dd.MM.yyyy') : "");
                            }
                        } catch {
                            setInputValue(field.value ? format(field.value, 'dd.MM.yyyy') : "");
                        }
                    };

                    return (
                        <FormItem className="flex flex-col">
                        <FormLabel>{getStartDateLabel(positionStatus)} (Opsiyonel)</FormLabel>
                        <Popover>
                            <div className="relative">
                                <FormControl>
                                    <Input
                                        placeholder="GG.AA.YYYY"
                                        value={inputValue}
                                        onChange={handleInputChange}
                                        onBlur={handleInputBlur}
                                        disabled={positionStatus === "Boş"}
                                    />
                                </FormControl>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" disabled={positionStatus === "Boş"} className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground">
                                        <CalendarIcon className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                            </div>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    locale={tr}
                                    mode="single"
                                    selected={field.value ?? undefined}
                                    onSelect={(date) => field.onChange(date)}
                                    disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01") || positionStatus === "Boş"
                                    }
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    );
                  }}
                />
                 <FormField
                  control={form.control}
                  name="reportsTo"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Bağlı Olduğu Pozisyon (Opsiyonel)</FormLabel>
                      <Popover open={reportsToOpen} onOpenChange={setReportsToOpen} modal={false}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={reportsToOpen}
                              disabled={isGenelMudur}
                              className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                            >
                              <span className="truncate">
                                {isGenelMudur
                                  ? "Yok (En üst düzey pozisyon)"
                                  : field.value
                                  ? reportsToOptions.find(option => option.value === field.value)?.label
                                  : "Raporlayacağı yöneticiyi seçin"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Pozisyon veya personel ara..." />
                            <CommandList>
                              <CommandEmpty>Pozisyon bulunamadı.</CommandEmpty>
                              <CommandGroup>
                                {reportsToOptions.map((option) => (
                                  <CommandItem
                                    value={option.label}
                                    key={option.value}
                                    onSelect={() => {
                                      form.setValue("reportsTo", option.value === PLACEHOLDER_FOR_NULL_VALUE ? null : option.value)
                                      setReportsToOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        (field.value === null && option.value === PLACEHOLDER_FOR_NULL_VALUE) || field.value === option.value
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assignedPersonnelId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Atanan Personel (Opsiyonel)</FormLabel>
                      <Popover open={personnelOpen} onOpenChange={setPersonnelOpen} modal={false}>
                        <PopoverTrigger asChild>
                          <FormControl>
                             <Button
                              variant="outline"
                              role="combobox"
                              disabled={positionStatus === "Boş"}
                              aria-expanded={personnelOpen}
                              className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                            >
                              <span className="truncate">
                                {field.value
                                  ? assignedPersonnelOptions.find(option => option.value === field.value)?.label
                                  : "Personel seçin"}
                               </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                         <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Personel ara..." />
                            <CommandList>
                              <CommandEmpty>Personel bulunamadı.</CommandEmpty>
                              <CommandGroup>
                                {assignedPersonnelOptions.map((option) => (
                                  <CommandItem
                                    value={option.label}
                                    key={option.value}
                                    onSelect={() => {
                                       form.setValue("assignedPersonnelId", option.value === PLACEHOLDER_FOR_NULL_VALUE ? null : option.value)
                                       setPersonnelOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        (field.value === null && option.value === PLACEHOLDER_FOR_NULL_VALUE) || field.value === option.value
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
            <DialogFooter>
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
