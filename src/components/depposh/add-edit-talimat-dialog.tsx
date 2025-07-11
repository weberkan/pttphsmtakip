
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
import { Check, ChevronsUpDown, Flame, Signal, Minus, CalendarIcon } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Badge } from "../ui/badge";
import { Calendar } from "../ui/calendar";
import { format, parse } from "date-fns";
import { tr } from 'date-fns/locale';


const cardSchema = z.object({
  title: z.string().min(1, "Başlık boş olamaz."),
  description: z.string().optional(),
  assignedUids: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  startDate: z.date().nullable().optional(),
  dueDate: z.date().nullable().optional(),
}).superRefine((data, ctx) => {
    if (data.startDate && data.dueDate && data.startDate > data.dueDate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dueDate'],
            message: 'Bitiş tarihi, başlangıç tarihinden önce olamaz.',
        });
    }
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
          assignedUids: cardToEdit.assignedUids || [],
          priority: cardToEdit.priority || 'medium',
          startDate: cardToEdit.startDate ? new Date(cardToEdit.startDate as any) : null,
          dueDate: cardToEdit.dueDate ? new Date(cardToEdit.dueDate as any) : null,
        });
      } else {
        form.reset({
          title: "",
          description: "",
          assignedUids: [],
          priority: 'medium',
          startDate: null,
          dueDate: null,
        });
      }
    }
  }, [cardToEdit, form, isOpen]);

  const onSubmit = (data: CardFormData) => {
    const dataToSave = {
      ...data,
      description: data.description || '',
      assignedUids: data.assignedUids || [],
      priority: data.priority || 'medium',
      status: cardToEdit?.status || initialStatus,
      startDate: data.startDate || null,
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
            Talimat detaylarını girin ve ilgili kullanıcıları atayın.
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
                    <div></div>
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
                                if (!isNaN(parsedDate.getTime()) && parsedDate >= new Date(new Date().setHours(0,0,0,0))) {
                                    field.onChange(parsedDate);
                                } else {
                                    form.setError("startDate", { message: "Lütfen bugün veya ileri bir tarih girin." });
                                    setInputValue(field.value ? format(field.value, 'dd.MM.yyyy') : "");
                                }
                            } catch {
                                setInputValue(field.value ? format(field.value, 'dd.MM.yyyy') : "");
                            }
                        };
                        
                        return (
                            <FormItem className="flex flex-col">
                            <FormLabel>Başlangıç Tarihi (Opsiyonel)</FormLabel>
                                <Popover>
                                    <div className="relative">
                                        <Input
                                            placeholder="GG.AA.YYYY"
                                            value={inputValue}
                                            onChange={handleInputChange}
                                            onBlur={handleInputBlur}
                                            className="pr-8"
                                        />
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
                                        selected={field.value ?? undefined}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                        date < new Date(new Date().setHours(0, 0, 0, 0))
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
                      name="dueDate"
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
                            const startDate = form.getValues("startDate");
                            if (inputValue === "") {
                                field.onChange(null);
                                return;
                            }
                            try {
                                const parsedDate = parse(inputValue, 'dd.MM.yyyy', new Date());
                                const minDate = startDate || new Date(new Date().setHours(0, 0, 0, 0));

                                if (!isNaN(parsedDate.getTime()) && parsedDate >= minDate) {
                                    field.onChange(parsedDate);
                                } else {
                                    form.setError("dueDate", { message: "Tarih, başlangıçtan veya bugünden önce olamaz." });
                                    setInputValue(field.value ? format(field.value, 'dd.MM.yyyy') : "");
                                }
                            } catch {
                                setInputValue(field.value ? format(field.value, 'dd.MM.yyyy') : "");
                            }
                        };
                        
                        return (
                            <FormItem className="flex flex-col">
                            <FormLabel>Bitiş Tarihi (Opsiyonel)</FormLabel>
                                <Popover>
                                    <div className="relative">
                                        <Input
                                            placeholder="GG.AA.YYYY"
                                            value={inputValue}
                                            onChange={handleInputChange}
                                            onBlur={handleInputBlur}
                                            className="pr-8"
                                        />
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
                                        selected={field.value ?? undefined}
                                        onSelect={field.onChange}
                                        disabled={(date) => {
                                            const startDate = form.getValues("startDate");
                                            const today = new Date(new Date().setHours(0, 0, 0, 0));
                                            const minDate = startDate && startDate > today ? startDate : today;
                                            return date < minDate;
                                        }}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                            <FormMessage />
                            </FormItem>
                        );
                      }}
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

    