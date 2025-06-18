
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserCircle, Edit, Trash2 } from "lucide-react";
import type { Personnel } from "@/lib/types";
import { PersonnelListItemActions } from "./personnel-list-item-actions";

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
              <TableCell className="font-medium flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                {person.firstName}
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
