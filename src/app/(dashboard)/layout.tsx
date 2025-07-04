
"use client";

import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense, useState, ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Users, LogOut, Menu, Briefcase, ChevronsLeft, Network, UserCheck, Mail, Bell, SlidersHorizontal, BarChart2, Home } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SidebarNav, menuConfig } from '@/components/sidebar-nav';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { useUserManagement } from '@/hooks/use-user-management';
import { useMessaging } from '@/hooks/use-messaging';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const viewTitles: { [key: string]: string } = {
    'dashboard': 'Anasayfa',
    'merkez-pozisyon': 'Merkez Pozisyon Yönetimi',
    'merkez-personel': 'Merkez Personel Yönetimi',
    'merkez-sema': 'Merkez Organizasyon Şeması',
    'tasra-pozisyon': 'Taşra Pozisyon Yönetimi',
    'tasra-personel': 'Taşra Personel Yönetimi',
    'raporlama': 'Raporlama ve Analiz',
    'kullanici-onay': 'Kullanıcı Onayları',
    'mesajlar': 'Mesajlar',
};

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const [activePrimaryNav, setActivePrimaryNav] = useState<'yonetim' | 'raporlama' | null>(null);

    const { users } = useUserManagement();
    const { conversations } = useMessaging();
    
    const view = searchParams.get('view') || 'dashboard';

    useEffect(() => {
        if (view.startsWith('merkez-') || view.startsWith('tasra-')) {
            setActivePrimaryNav('yonetim');
        } else if (view === 'raporlama') {
            setActivePrimaryNav('raporlama');
        } else {
            setActivePrimaryNav(null); // No primary nav selected for dashboard, messages, etc.
        }
    }, [view]);

    const hasPendingApprovals = useMemo(() => {
        if (user?.role !== 'admin') return false;
        return users.some(u => !u.isApproved);
    }, [users, user?.role]);

    const hasUnreadMessages = useMemo(() => {
        if (!user) return false;
        return conversations.some(c => 
            c.lastMessage && c.lastMessage.senderId !== user.uid
        );
    }, [conversations, user]);

    if (!user) return null;
    
    const headerTitle = viewTitles[view] || 'Pozisyon Takip Sistemi';

    const handlePrimaryNavClick = (nav: 'yonetim' | 'raporlama') => {
        setActivePrimaryNav(nav);
        if (nav === 'yonetim') {
             // Navigate to the first item in the management menu
            router.push('/?view=merkez-pozisyon');
        } else if (nav === 'raporlama') {
            router.push('/?view=raporlama');
        }
    }

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
            {/* Sidebar Container */}
            <div className="hidden bg-muted/40 md:flex">
                {/* Panel 1: Icon Rail */}
                <div className="flex flex-col items-center gap-4 p-2">
                    <Link href="/?view=dashboard" className="flex h-14 w-full items-center justify-center">
                         <Image
                            src="https://www.ptt.gov.tr/_next/static/media/184logo.0437c82e.png"
                            alt="PTT Logo"
                            width={40}
                            height={16}
                            style={{ height: 'auto' }}
                            className="object-contain"
                        />
                    </Link>
                    <TooltipProvider delayDuration={0}>
                        <nav className="flex flex-col items-center gap-2 mt-4">
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={activePrimaryNav === 'yonetim' ? 'secondary' : 'ghost'}
                                        className="rounded-lg h-11 w-11"
                                        size="icon"
                                        aria-label="Yönetim"
                                        onClick={() => handlePrimaryNavClick('yonetim')}
                                    >
                                        <SlidersHorizontal className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Yönetim</TooltipContent>
                            </Tooltip>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={activePrimaryNav === 'raporlama' ? 'secondary' : 'ghost'}
                                        className="rounded-lg h-11 w-11"
                                        size="icon"
                                        aria-label="Raporlama"
                                        onClick={() => handlePrimaryNavClick('raporlama')}
                                    >
                                        <BarChart2 className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Raporlama ve Analiz</TooltipContent>
                            </Tooltip>
                        </nav>
                    </TooltipProvider>
                </div>
                {/* Panel 2: Sub-menu */}
                {activePrimaryNav && (
                    <div className="w-[260px] flex flex-col">
                        <div className="flex h-14 items-center border-b px-4">
                            <h2 className="font-semibold tracking-tight text-lg">{menuConfig[activePrimaryNav].title}</h2>
                        </div>
                        <div className="flex-1 overflow-auto py-2">
                            <SidebarNav activePrimaryNav={activePrimaryNav} />
                        </div>
                    </div>
                )}
            </div>

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
                                        style={{ height: 'auto' }}
                                        className="object-contain"
                                    />
                                </Link>
                            </div>
                            <div className="p-2">
                                <SidebarNav activePrimaryNav={'yonetim'} />
                                <SidebarNav activePrimaryNav={'raporlama'} />
                            </div>
                        </SheetContent>
                    </Sheet>
                    
                    <h1 className="flex-1 text-lg font-semibold">{headerTitle}</h1>
                    
                    <div className="ml-auto flex items-center gap-2">
                        <ThemeToggle />
                        
                        <Link href="/?view=mesajlar" passHref>
                           <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                                <Mail className="h-5 w-5" />
                                {hasUnreadMessages && (
                                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                                )}
                                <span className="sr-only">Mesajlar</span>
                           </Button>
                        </Link>

                        <Link href="/?view=kullanici-onay" passHref>
                          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                              <Bell className="h-5 w-5" />
                              {hasPendingApprovals && (
                                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                              )}
                              <span className="sr-only">Bildirimler</span>
                          </Button>
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user.photoUrl || ''} alt={`${user.firstName} ${user.lastName}`} />
                                        <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={user.photoUrl || ''} alt={`${user.firstName} ${user.lastName}`} />
                                            <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {user.role === 'admin' && (
                                    <>
                                        <DropdownMenuItem asChild>
                                            <Link href="/?view=kullanici-onay">
                                                <UserCheck className="mr-2 h-4 w-4" />
                                                <span>Yönetim Paneli</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
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
