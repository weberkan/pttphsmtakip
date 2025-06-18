
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User } from "lucide-react"; // Changed from UserCircle
import type { Personnel } from "@/lib/types";
import { PersonnelListItemActions } from "./personnel-list-item-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PersonnelListProps {
  personnel: Personnel[];
  onEdit: (person: Personnel) => void;
  onDelete: (personnelId: string) => void;
}

export function PersonnelList({ personnel, onEdit, onDelete }: PersonnelListProps) {
  if (personnel.length === 0) {
    return <p className="text-muted-foreground text-center py-4">Personel bulunamadı. Eklemeyi deneyin!</p>;
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Adı</TableHead>
            <TableHead>Soyadı</TableHead>
            <TableHead>Sicil Numarası</TableHead>
            <TableHead className="text-right">Aksiyonlar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {personnel.map((person) => (
            <TableRow key={person.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage 
                      src={person.photoUrl || undefined} 
                      alt={`${person.firstName} ${person.lastName}`} 
                      data-ai-hint="person avatar"
                    />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  {person.firstName}
                </div>
              </TableCell>
              <TableCell>{person.lastName}</TableCell>
              <TableCell>{person.registryNumber}</TableCell>
              <TableCell className="text-right">
                <PersonnelListItemActions person={person} onEdit={onEdit} onDelete={onDelete} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
