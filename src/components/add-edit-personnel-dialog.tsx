
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
import type { Personnel } from "@/lib/types";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { tr } from "date-fns/locale";

const personnelSchema = z.object({
  firstName: z.string().min(2, "Personel adı en az 2 karakter olmalıdır."),
  lastName: z.string().min(2, "Personel soyadı en az 2 karakter olmalıdır."),
  unvan: z.string().optional().or(z.literal('')),
  registryNumber: z.string().min(2, "Sicil numarası en az 2 karakter olmalıdır."),
  status: z.enum(["İHS", "399"], {
    required_error: "Personel statüsü seçmek zorunludur.",
  }),
  photoUrl: z.string().url("Geçerli bir URL girin.").optional().or(z.literal('')),
  email: z.string().email("Geçerli bir e-posta adresi girin.").optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  dateOfBirth: z.date().optional().nullable(),
});

type PersonnelFormData = z.infer<typeof personnelSchema>;

interface AddEditPersonnelDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  personnelToEdit?: Personnel | null;
  onSave: (personnelData: Omit<Personnel, 'id'> | Personnel) => void;
}

export function AddEditPersonnelDialog({
  isOpen,
  onOpenChange,
  personnelToEdit,
  onSave,
}: AddEditPersonnelDialogProps) {
  const { toast } = useToast();
  const form = useForm<PersonnelFormData>({
    resolver: zodResolver(personnelSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      unvan: "",
      registryNumber: "",
      status: "İHS",
      photoUrl: "",
      email: "",
      phone: "",
      dateOfBirth: null,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (personnelToEdit) {
        form.reset({
          firstName: personnelToEdit.firstName,
          lastName: personnelToEdit.lastName,
          unvan: personnelToEdit.unvan || "",
          registryNumber: personnelToEdit.registryNumber,
          status: personnelToEdit.status,
          photoUrl: personnelToEdit.photoUrl || "",
          email: personnelToEdit.email || "",
          phone: personnelToEdit.phone || "",
          dateOfBirth: personnelToEdit.dateOfBirth ? new Date(personnelToEdit.dateOfBirth) : null,
        });
      } else {
        form.reset({
          firstName: "",
          lastName: "",
          unvan: "",
          registryNumber: "",
          status: "İHS",
          photoUrl: "",
          email: "",
          phone: "",
          dateOfBirth: null,
        });
      }
    }
  }, [personnelToEdit, form, isOpen]);

  const onSubmit = (data: PersonnelFormData) => {
    const dataToSave = {
      ...data,
      unvan: data.unvan || null,
      photoUrl: data.photoUrl || null,
      email: data.email || null,
      phone: data.phone || null,
      dateOfBirth: data.dateOfBirth || null,
    };

    if (personnelToEdit) {
      onSave({ ...personnelToEdit, ...dataToSave });
      toast({ title: "Personel Güncellendi", description: `"${data.firstName} ${data.lastName}" başarıyla güncellendi.` });
    } else {
      onSave(dataToSave as Omit<Personnel, 'id'>);
      toast({ title: "Personel Eklendi", description: `"${data.firstName} ${data.lastName}" başarıyla eklendi.` });
    }
    form.reset();
    onOpenChange(false);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  };

  const currentPhotoUrl = form.watch("photoUrl");

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{personnelToEdit ? "Personel Düzenle" : "Yeni Personel Ekle"}</DialogTitle>
          <DialogDescription>
            {personnelToEdit ? "Bu personelin detaylarını güncelleyin." : "Yeni personel için detayları girin."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-6">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Adı</FormLabel>
                            <FormControl>
                            <Input placeholder="örn: Ali" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Soyadı</FormLabel>
                            <FormControl>
                            <Input placeholder="örn: Veli" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="unvan"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ünvan (Opsiyonel)</FormLabel>
                            <FormControl>
                            <Input placeholder="örn: Başmüdür" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="registryNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sicil Numarası</FormLabel>
                            <FormControl>
                            <Input placeholder="örn: SN12345" {...field} />
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
                            <FormLabel>Statü</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Statü seçin" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="İHS">İHS</SelectItem>
                                <SelectItem value="399">399</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>E-posta (Opsiyonel)</FormLabel>
                            <FormControl>
                            <Input placeholder="örn: ali.veli@example.com" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Telefon (Opsiyonel)</FormLabel>
                            <FormControl>
                            <Input placeholder="örn: 0555 123 4567" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
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
                                <FormLabel>Doğum Tarihi (Opsiyonel)</FormLabel>
                                <Popover>
                                    <div className="relative">
                                        <FormControl>
                                            <Input
                                                placeholder="GG.AA.YYYY"
                                                value={inputValue}
                                                onChange={handleInputChange}
                                                onBlur={handleInputBlur}
                                            />
                                        </FormControl>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground">
                                                <CalendarIcon className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                    </div>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            locale={tr}
                                            mode="single"
                                            captionLayout="dropdown-buttons"
                                            fromYear={1950}
                                            toYear={new Date().getFullYear()}
                                            selected={field.value ?? undefined}
                                            onSelect={(date) => field.onChange(date)}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )
                      }}
                    />
                    <FormField
                        control={form.control}
                        name="photoUrl"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fotoğraf URL (Opsiyonel)</FormLabel>
                            <FormControl>
                            <Input placeholder="https://ornek.com/fotograf.png" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    {currentPhotoUrl && (
                        <div className="sm:col-span-3 flex justify-center">
                            <Image 
                                src={currentPhotoUrl} 
                                alt="Personel Fotoğraf Önizleme" 
                                width={80} 
                                height={80} 
                                className="rounded-full object-cover"
                                data-ai-hint="person avatar"
                                onError={(e) => { 
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://placehold.co/100x100.png'; 
                                target.alt = 'Geçersiz URL veya yüklenemedi';
                                }}
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                    İptal
                </Button>
                <Button type="submit">
                    {personnelToEdit ? "Değişiklikleri Kaydet" : "Personel Ekle"}
                </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
