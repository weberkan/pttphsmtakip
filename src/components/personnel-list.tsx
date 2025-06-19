
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User, Mail, Phone, BadgeInfo } from "lucide-react";
import type { Personnel } from "@/lib/types";
import { PersonnelListItemActions } from "./personnel-list-item-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
            <TableHead>Adı Soyadı</TableHead>
            <TableHead>Sicil Numarası</TableHead>
            <TableHead>Statü</TableHead>
            <TableHead>E-posta</TableHead>
            <TableHead>Telefon</TableHead>
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
                  {person.firstName} {person.lastName}
                </div>
              </TableCell>
              <TableCell>{person.registryNumber}</TableCell>
              <TableCell>
                 <Badge variant={person.status === "İHS" ? "default" : "secondary"} className="flex items-center gap-1 w-fit">
                    <BadgeInfo className="h-3 w-3"/>
                    {person.status}
                 </Badge>
              </TableCell>
              <TableCell>
                {person.email ? (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${person.email}`} className="hover:underline">{person.email}</a>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Belirtilmemiş</span>
                )}
              </TableCell>
              <TableCell>
                {person.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{person.phone}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Belirtilmemiş</span>
                )}
              </TableCell>
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
