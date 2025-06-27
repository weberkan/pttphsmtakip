
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
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

const personnelSchema = z.object({
  firstName: z.string().min(2, "Personel adı en az 2 karakter olmalıdır."),
  lastName: z.string().min(2, "Personel soyadı en az 2 karakter olmalıdır."),
  registryNumber: z.string().min(2, "Sicil numarası en az 2 karakter olmalıdır."),
  status: z.enum(["İHS", "399"], {
    required_error: "Personel statüsü seçmek zorunludur.",
  }),
  photoUrl: z.string().url("Geçerli bir URL girin.").optional().or(z.literal('')),
  email: z.string().email("Geçerli bir e-posta adresi girin.").optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
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
      registryNumber: "",
      status: "İHS",
      photoUrl: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (personnelToEdit) {
        form.reset({
          firstName: personnelToEdit.firstName,
          lastName: personnelToEdit.lastName,
          registryNumber: personnelToEdit.registryNumber,
          status: personnelToEdit.status,
          photoUrl: personnelToEdit.photoUrl || "",
          email: personnelToEdit.email || "",
          phone: personnelToEdit.phone || "",
        });
      } else {
        form.reset({
          firstName: "",
          lastName: "",
          registryNumber: "",
          status: "İHS",
          photoUrl: "",
          email: "",
          phone: "",
        });
      }
    }
  }, [personnelToEdit, form, isOpen]);

  const onSubmit = (data: PersonnelFormData) => {
    const dataToSave = {
      ...data,
      photoUrl: data.photoUrl || null,
      email: data.email || null,
      phone: data.phone || null,
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{personnelToEdit ? "Personel Düzenle" : "Yeni Personel Ekle"}</DialogTitle>
          <DialogDescription>
            {personnelToEdit ? "Bu personelin detaylarını güncelleyin." : "Yeni personel için detayları girin."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4 space-y-4">
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
                    <FormLabel>E-posta Adresi (Opsiyonel)</FormLabel>
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
                    <FormLabel>Telefon Numarası (Opsiyonel)</FormLabel>
                    <FormControl>
                      <Input placeholder="örn: 0555 123 4567" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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
                <div className="mt-2 flex justify-center">
                  <Image 
                    src={currentPhotoUrl} 
                    alt="Personel Fotoğraf Önizleme" 
                    width={100} 
                    height={100} 
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
            <DialogFooter className="pt-4">
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
