
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
import type { KanbanCard, AppUser } from "@/lib/types";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, X, Calendar as CalendarIcon, Flame, Signal, Minus } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Badge } from "../ui/badge";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";


const cardSchema = z.object({
  title: z.string().min(1, "Başlık boş olamaz."),
  description: z.string().optional(),
  status: z.enum(["todo", "inProgress", "done"]),
  assignedUids: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.date().nullable().optional(),
});

type CardFormData = z.infer<typeof cardSchema>;

interface AddEditTalimatDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cardToEdit?: KanbanCard | null;
  initialStatus?: 'todo' | 'inProgress' | 'done';
  allUsers: AppUser[];
  onSave: (cardData: Omit<KanbanCard, 'id' | 'order' | 'lastModifiedAt' | 'lastModifiedBy'> | KanbanCard) => void;
}

export function AddEditTalimatDialog({
  isOpen,
  onOpenChange,
  cardToEdit,
  initialStatus = 'todo',
  allUsers,
  onSave,
}: AddEditTalimatDialogProps) {
  const { toast } = useToast();
  const form = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
  });

  const [openUserSelect, setOpenUserSelect] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (cardToEdit) {
        form.reset({
          title: cardToEdit.title,
          description: cardToEdit.description || "",
          status: cardToEdit.status,
          assignedUids: cardToEdit.assignedUids || [],
          priority: cardToEdit.priority || 'medium',
          dueDate: cardToEdit.dueDate ? new Date(cardToEdit.dueDate as any) : null,
        });
      } else {
        form.reset({
          title: "",
          description: "",
          status: initialStatus,
          assignedUids: [],
          priority: 'medium',
          dueDate: null,
        });
      }
    }
  }, [cardToEdit, initialStatus, form, isOpen]);

  const onSubmit = (data: CardFormData) => {
    const dataToSave = {
      ...data,
      priority: data.priority || 'medium',
      dueDate: data.dueDate || null,
    };
    if (cardToEdit) {
      onSave({ ...cardToEdit, ...dataToSave });
      toast({ title: "Talimat Güncellendi"});
    } else {
      onSave(dataToSave as Omit<KanbanCard, 'id' | 'order' | 'lastModifiedBy' | 'lastModifiedAt'>);
      toast({ title: "Talimat Eklendi"});
    }
    onOpenChange(false);
  };

  const userOptions = allUsers.map(u => ({ value: u.uid, label: `${u.firstName} ${u.lastName} (${u.registryNumber})`}));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cardToEdit ? "Talimatı Düzenle" : "Yeni Talimat Ekle"}</DialogTitle>
          <DialogDescription>
            Talimat detaylarını girin, durumunu seçin ve ilgili kullanıcıları atayın.
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
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Öncelik</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value || 'medium'}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Öncelik seçin" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="high"><div className="flex items-center gap-2"><Flame className="h-4 w-4 text-red-500" /> Yüksek</div></SelectItem>
                                    <SelectItem value="medium"><div className="flex items-center gap-2"><Signal className="h-4 w-4 text-yellow-500" /> Orta</div></SelectItem>
                                    <SelectItem value="low"><div className="flex items-center gap-2"><Minus className="h-4 w-4 text-gray-500" /> Düşük</div></SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Bitiş Tarihi (Opsiyonel)</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? (
                                    format(field.value, "PPP", { locale: require('date-fns/locale/tr') })
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
                                selected={field.value ?? undefined}
                                onSelect={field.onChange}
                                initialFocus
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="assignedUids"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Atanan Kullanıcılar (Opsiyonel)</FormLabel>
                            <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between h-auto min-h-10",
                                                !field.value?.length && "text-muted-foreground"
                                            )}
                                        >
                                            <div className="flex gap-1 flex-wrap">
                                                {field.value?.map(uid => {
                                                    const user = allUsers.find(u => u.uid === uid);
                                                    return (
                                                        <Badge
                                                            variant="secondary"
                                                            key={uid}
                                                            className="mr-1"
                                                        >
                                                            {user?.firstName} {user?.lastName}
                                                        </Badge>
                                                    );
                                                })}
                                                 {field.value?.length === 0 && "Kullanıcı seçin"}
                                            </div>
                                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Kullanıcı ara..." />
                                        <CommandList>
                                            <CommandEmpty>Kullanıcı bulunamadı.</CommandEmpty>
                                            <CommandGroup>
                                                {userOptions.map((option) => (
                                                    <CommandItem
                                                        key={option.value}
                                                        onSelect={() => {
                                                            const currentUids = field.value || [];
                                                            const newUids = currentUids.includes(option.value)
                                                                ? currentUids.filter(uid => uid !== option.value)
                                                                : [...currentUids, option.value];
                                                            field.onChange(newUids);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                field.value?.includes(option.value)
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
