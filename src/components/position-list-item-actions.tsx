"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import type { Position } from "@/lib/types";
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

interface PositionListItemActionsProps {
  position: Position;
  onEdit: (position: Position) => void;
  onDelete: (positionId: string) => void;
}

export function PositionListItemActions({ position, onEdit, onDelete }: PositionListItemActionsProps) {
  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Menüyü aç</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(position)}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </DropdownMenuItem>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Sil
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
          <AlertDialogDescription>
            Bu işlem geri alınamaz. Bu, "{position.name}" pozisyonunu kalıcı olarak silecek
            ve sistemden kaldıracaktır. Bu pozisyona raporlayan tüm pozisyonların 'bağlı olduğu pozisyon' alanı temizlenecektir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => onDelete(position.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
