
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useAuth, type SignUpData } from "@/contexts/auth-context";
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
import { useToast } from "@/hooks/use-toast";
import { Network, LogIn, UserPlus } from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin."),
  password: z.string().min(1, "Şifre boş bırakılamaz."),
});

const signupSchema = z.object({
  firstName: z.string().min(1, "Ad boş bırakılamaz."),
  lastName: z.string().min(1, "Soyad boş bırakılamaz."),
  registryNumber: z.string().min(1, "Sicil numarası boş bırakılamaz."),
  email: z.string().email("Geçerli bir e-posta adresi girin."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
  confirmPassword: z.string(),
  status: z.enum(["İHS", "399"]),
  unvan: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor.",
  path: ["confirmPassword"],
});


type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

function LoginForm() {
    const { login } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsSubmitting(true);
        try {
            const loginSuccessful = await login(data.email, data.password);
            if (loginSuccessful) {
                toast({ title: "Giriş Başarılı", description: "Yönlendiriliyorsunuz..." });
                // Yönlendirme artık AuthPage'deki useEffect tarafından yapılacak.
            } else {
                toast({ variant: "destructive", title: "Giriş Başarısız", description: "E-posta veya şifre hatalı." });
            }
        } catch (error) {
            console.error("Login error:", error);
            toast({ variant: "destructive", title: "Bir hata oluştu", description: "Giriş yapılırken bir sorunla karşılaşıldı." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>E-posta Adresi</FormLabel>
                    <FormControl><Input placeholder="E-posta adresinizi girin" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Şifre</FormLabel>
                    <FormControl><Input type="password" placeholder="Şifrenizi girin" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                <LogIn className="mr-2 h-4 w-4" />
                {isSubmitting ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </Button>
            </form>
        </Form>
    );
}

function SignupForm() {
    const { signup } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

     const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            registryNumber: "",
            email: "",
            password: "",
            confirmPassword: "",
            status: "İHS",
            unvan: "",
        },
    });

    const onSubmit = async (data: SignupFormValues) => {
        setIsSubmitting(true);
        const result = await signup(data as SignUpData);
        if (result.success) {
            toast({ title: "Kayıt Başarılı!", description: "Giriş başarılı. Anasayfaya yönlendiriliyorsunuz..." });
            // Yönlendirme artık AuthPage'deki useEffect tarafından yapılacak.
        } else {
            toast({ variant: "destructive", title: "Kayıt Başarısız", description: result.message || "Bilinmeyen bir hata oluştu." });
        }
        setIsSubmitting(false);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem><FormLabel>Ad</FormLabel><FormControl><Input placeholder="Adınız" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem><FormLabel>Soyad</FormLabel><FormControl><Input placeholder="Soyadınız" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="registryNumber" render={({ field }) => (
                    <FormItem><FormLabel>Sicil Numarası</FormLabel><FormControl><Input placeholder="Sicil No" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>E-posta</FormLabel><FormControl><Input type="email" placeholder="ornek@ptt.gov.tr" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Şifre</FormLabel><FormControl><Input type="password" placeholder="En az 6 karakter" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem><FormLabel>Şifre Tekrar</FormLabel><FormControl><Input type="password" placeholder="Şifrenizi doğrulayın" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Statü</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="İHS">İHS</SelectItem><SelectItem value="399">399</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Hesap Oluşturuluyor..." : "Hesap Oluştur"}
                </Button>
            </form>
        </Form>
    );
}


export default function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    // This effect is the single source of truth for redirection.
    // It will only redirect when the authentication state is fully resolved.
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);
  
  if (loading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Network className="h-12 w-12 text-primary animate-pulse" />
                <p className="text-muted-foreground">Yükleniyor...</p>
            </div>
        </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Tabs defaultValue="login" className="w-full max-w-sm">
        <Card>
            <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 items-center justify-center">
                <Image
                src="https://www.ptt.gov.tr/_next/static/media/184logo.0437c82e.png"
                alt="Logo"
                width={120}
                height={48}
                className="object-contain"
                />
            </div>
            <CardTitle>Personel Hareketleri Takip Sistemi</CardTitle>
            <CardDescription>
                Devam etmek için giriş yapın veya yeni hesap oluşturun.
            </CardDescription>
             <TabsList className="grid w-full grid-cols-2 mt-4">
                <TabsTrigger value="login">Giriş Yap</TabsTrigger>
                <TabsTrigger value="signup">Hesap Oluştur</TabsTrigger>
            </TabsList>
            </CardHeader>
            <CardContent>
                <TabsContent value="login">
                    <LoginForm />
                </TabsContent>
                <TabsContent value="signup">
                    <SignupForm />
                </TabsContent>
            </CardContent>
        </Card>
      </Tabs>
    </main>
  );
}
