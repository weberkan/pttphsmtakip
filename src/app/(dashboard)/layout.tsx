
"use client";

import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense, useState, ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Users, LogOut, Menu, Briefcase, Network, UserCheck, Bell, ChevronLeft, Check, KanbanSquare } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from '@/components/ui/sheet';
import { SidebarNav } from '@/components/sidebar-nav';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { useUserManagement } from '@/hooks/use-user-management';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';


const viewTitles: { [key: string]: string } = {
    'dashboard': 'Anasayfa',
    'talimatlar': 'Talimatlar Panosu',
    'merkez-pozisyon': 'Merkez Pozisyon Yönetimi',
    'merkez-personel': 'Merkez Personel Yönetimi',
    'merkez-sema': 'Merkez Organizasyon Şeması',
    'tasra-pozisyon': 'Taşra Pozisyon Yönetimi',
    'tasra-personel': 'Taşra Personel Yönetimi',
    'raporlama': 'Raporlama ve Analiz',
    'kullanici-onay': 'Kullanıcı Onayları',
    'depposh-taslak': 'Depo - Taslak Dosyalar',
    'depposh-matbu': 'Depo - Matbu Dosyalar',
    'depposh-guncel': 'Depo - Güncel Dosyalar',
    'depposh-mevzuat': 'Depo - Mevzuat Dosyaları',
};

const SidebarContent = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <>
      <div className={cn("flex h-14 items-center border-b lg:h-[60px]", isCollapsed ? 'justify-center px-2' : 'px-4 lg:px-6')}>
          <Link href="/?view=dashboard" className="flex items-center gap-2 font-semibold">
              <Image
                  src="https://www.ptt.gov.tr/_next/static/media/184logo.0437c82e.png"
                  alt="PTT Logo"
                  width={isCollapsed ? 40 : 80}
                  height={32}
                  style={{ height: 'auto' }}
                  className="object-contain transition-all duration-300"
              />
          </Link>
      </div>
      <div className="flex-1 overflow-auto">
        <SidebarNav isCollapsed={isCollapsed} />
      </div>
    </>
);


function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    const { users } = useUserManagement();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    
    const view = searchParams.get('view') || 'dashboard';

    const hasPendingApprovals = useMemo(() => {
        if (user?.role !== 'admin') return false;
        return users.some(u => !u.isApproved);
    }, [users, user?.role]);

    const hasNotifications = useMemo(() => hasPendingApprovals || unreadCount > 0, [hasPendingApprovals, unreadCount]);

    if (!user) return null;
    
    const headerTitle = viewTitles[view] || 'Pozisyon Takip Sistemi';

    const handleNotificationClick = async (notification: any) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }
        router.push(notification.link);
    };

    return (
        <div className={cn(
            "grid min-h-screen w-full transition-[grid-template-columns]",
            isSidebarCollapsed 
                ? "md:grid-cols-[70px_1fr]" 
                : "md:grid-cols-[176px_1fr] lg:grid-cols-[224px_1fr]"
        )}>
            <div className="hidden border-r bg-muted/40 md:block">
                <div className="flex h-full max-h-screen flex-col">
                    <div className="flex-1 overflow-auto">
                        <SidebarContent isCollapsed={isSidebarCollapsed} />
                    </div>
                    <div className="mt-auto border-t p-2">
                        <Button variant="ghost" size="icon" className="w-full" onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}>
                            <ChevronLeft className={cn("h-5 w-5 transition-transform", isSidebarCollapsed && "rotate-180")} />
                            <span className="sr-only">Kenar çubuğunu daralt/genişlet</span>
                        </Button>
                    </div>
                </div>
            </div>
            <div className="flex flex-col overflow-hidden">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Navigasyon menüsünü aç/kapa</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0">
                           <SidebarContent isCollapsed={false} />
                        </SheetContent>
                    </Sheet>
                    
                    <h1 className="flex-1 text-lg font-semibold">{headerTitle}</h1>
                    
                    <div className="ml-auto flex items-center gap-2">
                        <ThemeToggle />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                                    <Bell className="h-5 w-5" />
                                    {hasNotifications && (
                                        <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                                    )}
                                    <span className="sr-only">Bildirimler</span>
                                </Button>
                            </DropdownMenuTrigger>
                             <DropdownMenuContent className="w-80" align="end">
                                <DropdownMenuLabel>Bildirimler</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <ScrollArea className="h-[300px]">
                                    {hasPendingApprovals && user.role === 'admin' && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/?view=kullanici-onay" className='!text-destructive focus:!text-destructive'>
                                                <UserCheck className="mr-2 h-4 w-4" />
                                                <span>Onay bekleyen kullanıcılar var!</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    {notifications.length > 0 ? (
                                        notifications.map(notification => (
                                            <DropdownMenuItem key={notification.id} onClick={() => handleNotificationClick(notification)} className={cn("flex flex-col items-start gap-1 whitespace-normal", !notification.isRead && 'bg-accent')}>
                                               <div className='flex items-center gap-2'>
                                                  <KanbanSquare className="h-4 w-4 text-muted-foreground" />
                                                  <p className="text-sm font-medium">{notification.message}</p>
                                               </div>
                                               <p className="text-xs text-muted-foreground pl-6">
                                                   {formatDistanceToNow(new Date(notification.createdAt as any), { locale: tr, addSuffix: true })}
                                               </p>
                                            </DropdownMenuItem>
                                        ))
                                    ) : !hasPendingApprovals && (
                                        <p className="px-2 py-4 text-center text-sm text-muted-foreground">Okunmamış bildiriminiz yok.</p>
                                    )}
                                </ScrollArea>
                                {unreadCount > 0 && (
                                     <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={markAllAsRead}>
                                            <Check className="mr-2 h-4 w-4" />
                                            <span>Tümünü okundu olarak işaretle</span>
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

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
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background overflow-hidden">
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
