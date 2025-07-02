
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
import type { TasraPosition, Personnel } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Switch } from "./ui/switch";

const positionSchema = z.object({
  unit: z.string().min(2, "Ünite en az 2 karakter olmalıdır."),
  dutyLocation: z.string().min(2, "Görev Yeri en az 2 karakter olmalıdır."),
  status: z.enum(["Asıl", "Vekalet", "Yürütme", "Boş"]),
  originalTitle: z.string().optional().nullable(),
  assignedPersonnelId: z.string().nullable(),
  startDate: z.date().nullable(),
  actingAuthority: z.enum(["Başmüdürlük", "Genel Müdürlük"]).nullable(),
  receivesProxyPay: z.boolean().default(false),
  hasDelegatedAuthority: z.boolean().default(false),
});

type PositionFormData = z.infer<typeof positionSchema>;

interface AddEditTasraPositionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  positionToEdit?: TasraPosition | null;
  allPersonnel: Personnel[];
  onSave: (positionData: Omit<TasraPosition, 'id'> | TasraPosition) => void;
}

const PLACEHOLDER_FOR_NULL_VALUE = "__PLACEHOLDER_FOR_NULL__";

export function AddEditTasraPositionDialog({
  isOpen,
  onOpenChange,
  positionToEdit,
  allPersonnel,
  onSave,
}: AddEditTasraPositionDialogProps) {
  const { toast } = useToast();
  const form = useForm<PositionFormData>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      unit: "",
      dutyLocation: "",
      status: "Asıl",
      originalTitle: "",
      assignedPersonnelId: null,
      startDate: null,
      actingAuthority: null,
      receivesProxyPay: false,
      hasDelegatedAuthority: false,
    },
  });

  const positionStatus = form.watch("status");
  const [personnelOpen, setPersonnelOpen] = useState(false);

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
          unit: positionToEdit.unit,
          dutyLocation: positionToEdit.dutyLocation,
          status: positionToEdit.status,
          originalTitle: positionToEdit.originalTitle || "",
          assignedPersonnelId: positionToEdit.assignedPersonnelId,
          startDate: positionToEdit.startDate ? new Date(positionToEdit.startDate) : null,
          actingAuthority: positionToEdit.actingAuthority,
          receivesProxyPay: positionToEdit.receivesProxyPay,
          hasDelegatedAuthority: positionToEdit.hasDelegatedAuthority,
        });
      } else {
        form.reset({
          unit: "",
          dutyLocation: "",
          status: "Asıl",
          originalTitle: "",
          assignedPersonnelId: null,
          startDate: null,
          actingAuthority: null,
          receivesProxyPay: false,
          hasDelegatedAuthority: false,
        });
      }
    }
  }, [positionToEdit, form, isOpen]);


  const onSubmit = (data: PositionFormData) => {
    const isProxyOrActing = data.status === 'Vekalet' || data.status === 'Yürütme';

    const dataToSave = {
      ...data,
      originalTitle: isProxyOrActing ? data.originalTitle || null : null,
      actingAuthority: isProxyOrActing ? data.actingAuthority : null,
      receivesProxyPay: isProxyOrActing ? data.receivesProxyPay : false,
      hasDelegatedAuthority: isProxyOrActing ? data.hasDelegatedAuthority : false,
      assignedPersonnelId: data.assignedPersonnelId === PLACEHOLDER_FOR_NULL_VALUE || data.status === "Boş" ? null : data.assignedPersonnelId,
      startDate: data.status === "Boş" ? null : data.startDate,
    };
    
    if (data.status === "Boş") {
        dataToSave.assignedPersonnelId = null;
        dataToSave.startDate = null;
    }

    if (positionToEdit) {
      onSave({ ...positionToEdit, ...dataToSave });
      toast({ title: "Pozisyon Güncellendi", description: `Taşra pozisyonu başarıyla güncellendi.` });
    } else {
      onSave(dataToSave as Omit<TasraPosition, 'id'>);
      toast({ title: "Pozisyon Eklendi", description: `Taşra pozisyonu başarıyla eklendi.` });
    }
    onOpenChange(false);
  };
  
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      form.reset(); 
    }
    onOpenChange(open);
  };
  
  const isProxyOrActing = positionStatus === 'Vekalet' || positionStatus === 'Yürütme';

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{positionToEdit ? "Taşra Pozisyonu Düzenle" : "Yeni Taşra Pozisyonu Ekle"}</DialogTitle>
          <DialogDescription>
            {positionToEdit ? "Bu pozisyonun detaylarını güncelleyin." : "Yeni pozisyon için detayları girin."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4 py-6">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ünite</FormLabel>
                      <FormControl>
                        <Input placeholder="örn: Adana P.İ.M." {...field} />
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
                      <FormLabel>Görev Yeri</FormLabel>
                      <FormControl>
                        <Input placeholder="örn: Adana" {...field} />
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
                            }
                            if (value === 'Asıl' || value === 'Boş') {
                                form.setValue('originalTitle', '');
                                form.setValue('actingAuthority', null);
                                form.setValue('receivesProxyPay', false);
                                form.setValue('hasDelegatedAuthority', false);
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
                <FormField
                  control={form.control}
                  name="assignedPersonnelId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Atanan Personel</FormLabel>
                      <Popover open={personnelOpen} onOpenChange={setPersonnelOpen}>
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
                <FormField
                    control={form.control}
                    name="originalTitle"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Asıl Ünvan (Opsiyonel)</FormLabel>
                        <FormControl>
                        <Input 
                            placeholder="örn: Şube Müdürü" 
                            {...field} 
                            value={field.value ?? ""} 
                            disabled={!isProxyOrActing}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="actingAuthority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Görevi Veren Makam</FormLabel>
                        <Select 
                            onValueChange={field.onChange} 
                            value={field.value ?? undefined}
                            disabled={!isProxyOrActing}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Makam Seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Başmüdürlük">Başmüdürlük</SelectItem>
                            <SelectItem value="Genel Müdürlük">Genel Müdürlük</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => {
                    const [open, setOpen] = useState(false);
                    const [inputValue, setInputValue] = useState(
                      field.value ? format(new Date(field.value), "dd.MM.yyyy") : ""
                    );

                    useEffect(() => {
                      if (field.value) {
                        setInputValue(format(new Date(field.value), "dd.MM.yyyy"));
                      } else {
                        setInputValue("");
                      }
                    }, [field.value]);

                    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                      setInputValue(e.target.value);
                    };

                    const handleInputBlur = () => {
                      if (inputValue.trim() === "") {
                        field.onChange(null);
                        return;
                      }
                      const parsedDate = parse(inputValue, "dd.MM.yyyy", new Date());
                      if (isValid(parsedDate)) {
                        field.onChange(parsedDate);
                      } else {
                        setInputValue(field.value ? format(new Date(field.value), "dd.MM.yyyy") : "");
                      }
                    };
                    
                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>Başlama Tarihi (Opsiyonel)</FormLabel>
                        <Popover open={open} onOpenChange={setOpen}>
                          <div className="relative">
                            <FormControl>
                              <Input
                                  placeholder="gg.aa.yyyy"
                                  value={inputValue}
                                  onChange={handleInputChange}
                                  onBlur={handleInputBlur}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleInputBlur();
                                    }
                                  }}
                                  disabled={positionStatus === "Boş"}
                                  className="pr-10"
                              />
                            </FormControl>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant={"ghost"}
                                    className="absolute right-0 top-0 h-full px-3"
                                    disabled={positionStatus === "Boş"}
                                >
                                    <CalendarIcon className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                          </div>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                field.onChange(date || null);
                                setOpen(false);
                              }}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01") || positionStatus === "Boş"}
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
                    name="receivesProxyPay"
                    render={({ field }) => (
                        <FormItem className="flex flex-col rounded-lg border p-3 justify-between">
                            <FormLabel className="mb-2">Vekalet Ücreti Alıyor Mu?</FormLabel>
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!isProxyOrActing}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="hasDelegatedAuthority"
                    render={({ field }) => (
                        <FormItem className="flex flex-col rounded-lg border p-3 justify-between">
                            <FormLabel className="mb-2">Yetki Devri Var Mı?</FormLabel>
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!isProxyOrActing}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
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
