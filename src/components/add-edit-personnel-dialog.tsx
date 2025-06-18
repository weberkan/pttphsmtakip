
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
import type { Personnel } from "@/lib/types";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const personnelSchema = z.object({
  firstName: z.string().min(2, "Personel adı en az 2 karakter olmalıdır."),
  lastName: z.string().min(2, "Personel soyadı en az 2 karakter olmalıdır."),
  registryNumber: z.string().min(2, "Sicil numarası en az 2 karakter olmalıdır."),
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
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (personnelToEdit) {
        form.reset({
          firstName: personnelToEdit.firstName,
          lastName: personnelToEdit.lastName,
          registryNumber: personnelToEdit.registryNumber,
        });
      } else {
        form.reset({
          firstName: "",
          lastName: "",
          registryNumber: "",
        });
      }
    }
  }, [personnelToEdit, form, isOpen]);

  const onSubmit = (data: PersonnelFormData) => {
    if (personnelToEdit) {
      onSave({ ...personnelToEdit, ...data });
      toast({ title: "Personel Güncellendi", description: `"${data.firstName} ${data.lastName}" başarıyla güncellendi.` });
    } else {
      onSave(data as Omit<Personnel, 'id'>);
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
