
"use client";

import { Button } from "@/components/ui/button";
import { Network, PlusCircle, Users, LogOut, User as UserIcon } from "lucide-react";
import type { AuthUser } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";


interface AppHeaderProps {
  user: AuthUser | null;
  onAddPosition: () => void;
  onAddPersonnel: () => void;
  onLogout: () => void;
}

export function AppHeader({ user, onAddPosition, onAddPersonnel, onLogout }: AppHeaderProps) {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Pozisyon Takip</h1>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button onClick={onAddPersonnel} size="sm" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Personel Ekle
              </Button>
              <Button onClick={onAddPosition} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Pozisyon Ekle
              </Button>
            </div>

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
          </div>
        )}
      </div>
    </header>
  );
}
