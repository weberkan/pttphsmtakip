
"use client";

import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense, useState, ReactNode } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Users, LogOut, Trash, Menu, Briefcase, ChevronsLeft, Network } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SidebarNav } from '@/components/sidebar-nav';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';


const viewTitles: { [key: string]: string } = {
    'dashboard': 'Anasayfa',
    'merkez-pozisyon': 'Merkez Pozisyon Yönetimi',
    'merkez-personel': 'Merkez Personel Yönetimi',
    'kullanici-olustur': 'Yeni Kullanıcı Oluşturma',
    'merkez-sema': 'Merkez Organizasyon Şeması',
    'tasra-pozisyon': 'Taşra Pozisyon Yönetimi',
    'tasra-personel': 'Taşra Personel Yönetimi',
    'raporlama': 'Raporlama ve Analiz',
};

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // This should never happen if the protection in DashboardLayout works, but it's a good failsafe.
    if (!user) return null;

    const view = searchParams.get('view') || 'dashboard';
    
    const handleClearPersonnel = () => {
        localStorage.removeItem('positionTrackerApp_personnel');
        localStorage.removeItem('tasraTrackerApp_personnel');

        const merkezPositionsRaw = localStorage.getItem('positionTrackerApp_positions');
        if (merkezPositionsRaw) {
            try {
                const merkezPositions = JSON.parse(merkezPositionsRaw);
                if (Array.isArray(merkezPositions)) {
                    const updatedMerkezPositions = merkezPositions.map(p => ({ ...p, assignedPersonnelId: null }));
                    localStorage.setItem('positionTrackerApp_positions', JSON.stringify(updatedMerkezPositions));
                }
            } catch (e) { console.error("Could not update merkez positions", e); }
        }
        
        const tasraPositionsRaw = localStorage.getItem('tasraTrackerApp_positions');
        if (tasraPositionsRaw) {
            try {
                const tasraPositions = JSON.parse(tasraPositionsRaw);
                if (Array.isArray(tasraPositions)) {
                    const updatedTasraPositions = tasraPositions.map(p => ({ ...p, assignedPersonnelId: null }));
                    localStorage.setItem('tasraTrackerApp_positions', JSON.stringify(updatedTasraPositions));
                }
            } catch(e) { console.error("Could not update tasra positions", e); }
        }

        toast({
            title: "Personel Verileri Temizlendi",
            description: "Tüm personel bilgileri başarıyla silindi. Sayfa yeniden yükleniyor...",
        });
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    };
    
    return (
        <div className={cn(
            "grid min-h-screen w-full transition-[grid-template-columns] duration-300 ease-in-out",
            isCollapsed ? "md:grid-cols-[68px_1fr]" : "md:grid-cols-[240px_1fr]"
        )}>
            <aside className="hidden border-r bg-muted/40 md:flex md:flex-col">
                <div className="flex h-full max-h-screen flex-col">
                    <div className={cn("flex h-14 items-center border-b px-6", isCollapsed && "px-2 justify-center")}>
                        <Link href="/?view=dashboard" className="flex items-center gap-2 font-semibold">
                            <Image
                                src="https://www.ptt.gov.tr/_next/static/media/184logo.0437c82e.png"
                                alt="PTT Logo"
                                width={isCollapsed ? 40 : 80}
                                height={32}
                                className="object-contain transition-all duration-300"
                            />
                        </Link>
                    </div>
                    <div className="flex-1 overflow-auto py-2">
                        <SidebarNav isCollapsed={isCollapsed} />
                    </div>
                    <div className="mt-auto border-t p-2">
                        <Button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            variant="ghost"
                            size="icon"
                            className="w-full h-10"
                            aria-label={isCollapsed ? "Menüyü genişlet" : "Menüyü daralt"}
                        >
                            <ChevronsLeft className={cn("h-5 w-5 transition-transform duration-300", isCollapsed && "rotate-180")} />
                        </Button>
                    </div>
                </div>
            </aside>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Navigasyon menüsünü aç/kapa</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0">
                           <SheetHeader className="sr-only">
                             <SheetTitle>Navigasyon Menüsü</SheetTitle>
                             <SheetDescription>Uygulamanın ana bölümlerine gitmek için bu menüyü kullanın.</SheetDescription>
                           </SheetHeader>
                           <div className="flex h-14 items-center border-b px-6">
                                <Link href="/?view=dashboard" className="flex items-center gap-2 font-semibold">
                                    <Image
                                        src="https://www.ptt.gov.tr/_next/static/media/184logo.0437c82e.png"
                                        alt="PTT Logo"
                                        width={80}
                                        height={32}
                                        className="object-contain"
                                    />
                                </Link>
                            </div>
                            <SidebarNav isCollapsed={false} />
                        </SheetContent>
                    </Sheet>
                    
                    <h1 className="flex-1 text-lg font-semibold">{viewTitles[view] || 'Pozisyon Takip Sistemi'}</h1>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>

                                        <p className="text-xs leading-none text-muted-foreground">
                                            Sicil: {user.registryNumber}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                            className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10"
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            <Trash className="mr-2 h-4 w-4" />
                                            <span>Tüm Personeli Sil</span>
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Bu işlem geri alınamaz. Sistemdeki tüm merkez ve taşra personeli kalıcı olarak silinecektir. Pozisyonlar silinmeyecek, ancak personel atamaları kaldırılacaktır.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleClearPersonnel}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Evet, Personeli Sil
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Çıkış Yap</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
                    {children}
                </main>
            </div>
        </div>
    );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Network className="h-12 w-12 text-primary animate-pulse" />
                    <p className="text-muted-foreground">Oturum doğrulanıyor...</p>
                </div>
            </div>
        );
    }
    
    // AuthProvider is responsible for redirecting. If we reach here and there's
    // no user, it means the redirect is about to happen. Returning null prevents
    // the dashboard from flashing or attempting to render with no user data.
    if (!user) {
        return null; 
    }

    return <DashboardLayoutContent>{children}</DashboardLayoutContent>
}


export default function Layout({children}: {children: React.ReactNode}) {
    return (
        <Suspense fallback={<div>Loading Layout...</div>}>
            <DashboardLayout>{children}</DashboardLayout>
        </Suspense>
    )
}
