
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import type { Personnel } from "@/lib/types";
import { UserPlus, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";


const createUserSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır."),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır."),
  registryNumber: z.string().min(1, "Sicil numarası zorunludur."),
  email: z.string().email("Geçerli bir e-posta adresi girin."),
  status: z.enum(["İHS", "399"]),
  unvan: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserPanelProps {
  addPersonnel: (personnelData: Omit<Personnel, 'id' | 'status'> & { status: 'İHS' | '399' }) => Promise<void>;
  existingPersonnel: Personnel[];
}

export function CreateUserPanel({ addPersonnel, existingPersonnel }: CreateUserPanelProps) {
  const { toast } = useToast();
  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      registryNumber: "",
      email: "",
      status: "İHS",
      unvan: "",
    },
  });

  const onSubmit = async (data: CreateUserFormData) => {
    // Check for duplicate sicil or email
    if (existingPersonnel.some(p => p.registryNumber === data.registryNumber)) {
        form.setError("registryNumber", { message: "Bu sicil numarası zaten kullanılıyor." });
        return;
    }
    if (existingPersonnel.some(p => p.email && p.email.toLowerCase() === data.email.toLowerCase())) {
        form.setError("email", { message: "Bu e-posta adresi zaten kullanılıyor." });
        return;
    }

    try {
      await addPersonnel({
        ...data,
        unvan: data.unvan || null,
      });

      toast({
        title: "1. Adım Başarılı: Personel Kaydı Oluşturuldu",
        description: (
            <div className="flex flex-col gap-2 mt-2">
                <p>Personel "{data.firstName} {data.lastName}" başarıyla sisteme eklendi.</p>
                <p className="font-bold text-destructive">ÖNEMLİ: Son bir adım kaldı!</p>
                <p>Bu kullanıcının giriş yapabilmesi için Firebase Authentication paneline giderek <span className="font-mono bg-muted p-1 rounded">{data.email}</span> adresi ile yeni bir kullanıcı oluşturup şifre belirlemeniz gerekmektedir.</p>
            </div>
        ),
        duration: 15000,
      });
      form.reset();
    } catch (error) {
        console.error("Failed to add personnel", error);
        toast({
            variant: "destructive",
            title: "Hata",
            description: "Personel eklenirken bir sorun oluştu."
        })
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yeni Kullanıcı Oluşturma</CardTitle>
        <CardDescription>
          Sisteme giriş yapacak yeni bir kullanıcıyı buradan ekleyebilirsiniz. Bu işlem iki adımdan oluşur: Önce personel kaydı oluşturulur, ardından Firebase paneli üzerinden şifre belirlenir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Adı</FormLabel>
                        <FormControl>
                        <Input placeholder="Ali" {...field} />
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
                        <Input placeholder="Yılmaz" {...field} />
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
                        <Input placeholder="123456" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>E-posta Adresi</FormLabel>
                        <FormControl>
                        <Input placeholder="ali.yilmaz@ptt.gov.tr" {...field} />
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
                            <SelectValue />
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
                    name="unvan"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ünvan (Opsiyonel)</FormLabel>
                        <FormControl>
                        <Input placeholder="Uzman" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <UserPlus className="mr-2 h-4 w-4" />
              {form.formState.isSubmitting ? "Oluşturuluyor..." : "Personel Kaydını Oluştur"}
            </Button>
          </form>
        </Form>
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Nasıl Çalışır?</AlertTitle>
          <AlertDescription>
            Bu form, personelin bilgilerini veritabanına (Firestore) kaydeder. Kullanıcının şifre ile giriş yapabilmesi için, bu adımdan sonra Firebase konsolunun "Authentication" bölümüne gidip aynı e-posta adresiyle bir kullanıcı oluşturmanız ve şifresini belirlemeniz gerekir.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
