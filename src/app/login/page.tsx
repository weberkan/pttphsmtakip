
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Network, LogIn } from "lucide-react";
import Image from "next/image";

const loginSchema = z.object({
  registryNumber: z.string().min(1, "Sicil numarası boş bırakılamaz."),
  password: z.string().min(1, "Şifre boş bırakılamaz."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      registryNumber: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const loginSuccessful = await login(data.registryNumber, data.password);
      if (loginSuccessful) {
        toast({
          title: "Giriş Başarılı",
          description: "Yönlendiriliyorsunuz...",
        });
        router.push("/");
      } else {
        toast({
          variant: "destructive",
          title: "Giriş Başarısız",
          description: "Sicil numarası veya şifre hatalı.",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Bir hata oluştu",
        description: "Giriş yapılırken bir sorunla karşılaşıldı.",
      });
    } finally {
        setIsSubmitting(false);
    }
  };
  
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
      <Card className="w-full max-w-sm">
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
          <CardDescription>Devam etmek için giriş yapın</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="registryNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sicil Numarası</FormLabel>
                    <FormControl>
                      <Input placeholder="Sicil numaranızı girin" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input type="password" placeholder="Şifrenizi girin" {...field} />
                    </FormControl>
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
        </CardContent>
      </Card>
    </main>
  );
}
