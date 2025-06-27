
"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle, Users, LogOut, Map, Building } from "lucide-react";
import Image from "next/image";
import type { AuthUser } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "./ui/avatar";


interface AppHeaderProps {
  user: AuthUser | null;
  onAddPosition: () => void;
  onAddPersonnel: () => void;
  onLogout: () => void;
  activeTab: 'merkez' | 'tasra';
}

export function AppHeader({ user, onAddPosition, onAddPersonnel, onLogout, activeTab }: AppHeaderProps) {
  const title = activeTab === 'merkez'
    ? "Merkez Teşkilatı Yönetim Sistemi"
    : "Taşra Teşkilatı Yönetim Sistemi";
  
  const personnelButtonText = activeTab === 'merkez' ? 'Personel Ekle' : 'Taşra Personel Ekle';
  const positionButtonText = activeTab === 'merkez' ? 'Pozisyon Ekle' : 'Taşra Pozisyon Ekle';

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="https://www.ptt.gov.tr/_next/static/media/184logo.0437c82e.png"
            alt="PTT Logo"
            width={100}
            height={40}
            className="object-contain"
          />
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex gap-2">
              <Button onClick={onAddPersonnel} size="sm" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                {personnelButtonText}
              </Button>
              <Button onClick={onAddPosition} size="sm">
                {activeTab === 'merkez' ? <Building className="mr-2 h-4 w-4" /> : <Map className="mr-2 h-4 w-4" /> }
                {positionButtonText}
              </Button>
            </div>
          )}

          {user && (
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
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Çıkış Yap</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
