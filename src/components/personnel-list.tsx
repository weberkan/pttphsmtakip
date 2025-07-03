
"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User, Mail, Phone, BadgeInfo, PencilRuler, Briefcase } from "lucide-react";
import type { Personnel } from "@/lib/types";
import { PersonnelListItemActions } from "./personnel-list-item-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PersonnelListProps {
  personnel: Personnel[];
  onEdit: (person: Personnel) => void;
  onDelete: (personnelId: string) => void;
}

export function PersonnelList({ personnel, onEdit, onDelete }: PersonnelListProps) {
  const uniquePersonnel = useMemo(() => {
    return Array.from(new Map(personnel.map(p => [p.id, p])).values());
  }, [personnel]);

  if (uniquePersonnel.length === 0) {
    return <p className="text-muted-foreground text-center py-4">Personel bulunamadı. Eklemeyi deneyin!</p>;
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Adı Soyadı</TableHead>
            <TableHead>Ünvan</TableHead>
            <TableHead>Sicil Numarası</TableHead>
            <TableHead>Statü</TableHead>
            <TableHead>E-posta</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Son Değişiklik</TableHead>
            <TableHead className="text-right">Aksiyonlar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {uniquePersonnel.map((person) => {
            return (
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
                <TableCell>
                  {person.unvan ? (
                     <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                        {person.unvan}
                     </div>
                  ) : (
                    <span className="text-muted-foreground italic">Belirtilmemiş</span>
                  )}
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
                <TableCell>
                  {person.lastModifiedBy && person.lastModifiedAt ? (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center text-muted-foreground">
                              <PencilRuler className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {(() => {
                              const modifier = personnel.find(p => p.registryNumber === person.lastModifiedBy);
                              const modifierName = modifier ? `${modifier.firstName} ${modifier.lastName}` : person.lastModifiedBy;
                              const timeAgo = formatDistanceToNow(new Date(person.lastModifiedAt), { locale: tr });
                              return `${modifierName} ${timeAgo} önce güncelledi.`;
                            })()}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-muted-foreground italic">Yok</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <PersonnelListItemActions person={person} onEdit={onEdit} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );
}
