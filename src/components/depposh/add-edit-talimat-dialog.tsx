
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KanbanCard } from "@/lib/types";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const cardSchema = z.object({
  title: z.string().min(1, "Başlık boş olamaz."),
  description: z.string().optional(),
  status: z.enum(["todo", "inProgress", "done"]),
});

type CardFormData = z.infer<typeof cardSchema>;

interface AddEditTalimatDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cardToEdit?: KanbanCard | null;
  initialStatus?: 'todo' | 'inProgress' | 'done';
  onSave: (cardData: Omit<KanbanCard, 'id' | 'order' | 'lastModifiedAt' | 'lastModifiedBy'> | KanbanCard) => void;
}

export function AddEditTalimatDialog({
  isOpen,
  onOpenChange,
  cardToEdit,
  initialStatus = 'todo',
  onSave,
}: AddEditTalimatDialogProps) {
  const { toast } = useToast();
  const form = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (cardToEdit) {
        form.reset({
          title: cardToEdit.title,
          description: cardToEdit.description || "",
          status: cardToEdit.status,
        });
      } else {
        form.reset({
          title: "",
          description: "",
          status: initialStatus,
        });
      }
    }
  }, [cardToEdit, initialStatus, form, isOpen]);

  const onSubmit = (data: CardFormData) => {
    if (cardToEdit) {
      onSave({ ...cardToEdit, ...data });
      toast({ title: "Talimat Güncellendi"});
    } else {
      onSave(data as Omit<KanbanCard, 'id' | 'order'>);
      toast({ title: "Talimat Eklendi"});
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cardToEdit ? "Talimatı Düzenle" : "Yeni Talimat Ekle"}</DialogTitle>
          <DialogDescription>
            Talimat detaylarını girin ve durumunu seçin.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Başlık</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Açıklama (Opsiyonel)</FormLabel>
                        <FormControl><Textarea {...field} /></FormControl>
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
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Durum seçin" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="todo">Yapılacak</SelectItem>
                                <SelectItem value="inProgress">Devam Ediyor</SelectItem>
                                <SelectItem value="done">Tamamlandı</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        İptal
                    </Button>
                    <Button type="submit">
                        {cardToEdit ? "Kaydet" : "Ekle"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
