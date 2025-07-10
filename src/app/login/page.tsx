
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
        const result = await login(data.email, data.password);
        if (result.success) {
            toast({ title: "Giriş Başarılı", description: "Yönlendiriliyorsunuz..." });
            // The AuthProvider's useEffect will handle the redirect.
        } else {
            toast({ variant: "destructive", title: "Giriş Başarısız", description: result.message });
        }
        setIsSubmitting(false);
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

function SignupForm({ onSignupSuccess }: { onSignupSuccess: () => void; }) {
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
        },
    });

    const onSubmit = async (data: SignupFormValues) => {
        setIsSubmitting(true);
        const result = await signup(data as SignUpData);
        if (result.success) {
            toast({ title: "Kayıt Başarılı!", description: "Hesabınız oluşturuldu. Yönetici onayı sonrası giriş yapabilirsiniz." });
            form.reset();
            onSignupSuccess();
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
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Hesap Oluşturuluyor..." : "Hesap Oluştur"}
                </Button>
            </form>
        </Form>
    );
}


export default function AuthPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  
  // While loading, show a spinner. This prevents a flash of the login form
  // if the user is already authenticated.
  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Image
                    src="https://www.ptt.gov.tr/_next/static/media/184logo.0437c82e.png"
                    alt="PTT Logo"
                    width={150}
                    height={60}
                    className="animate-pulse"
                />
                <p className="text-muted-foreground">Yükleniyor...</p>
            </div>
        </div>
    );
  }

  // If loading is finished and there's a user, the AuthProvider's useEffect
  // is about to redirect them. Returning null prevents the login form from flashing.
  if (user) {
      return null;
  }
  
  // If loading is finished and there's no user, show the login page.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 gap-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-sm">
        <Card>
            <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 items-center justify-center">
                <Image
                src="https://www.ptt.gov.tr/_next/static/media/184logo.0437c82e.png"
                alt="Logo"
                width={120}
                height={48}
                style={{ height: 'auto' }}
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
                    <SignupForm onSignupSuccess={() => setActiveTab("login")} />
                </TabsContent>
            </CardContent>
        </Card>
      </Tabs>
       <p className="text-xs text-muted-foreground">
        ❤️ ile geliştirildi.
      </p>
    </main>
  );
}
