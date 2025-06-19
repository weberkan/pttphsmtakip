
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, BadgeAlert, Briefcase, Building2, UserCircle, Info, CalendarDays } from "lucide-react";
import type { Position, Personnel } from "@/lib/types";
import { PositionListItemActions } from "./position-list-item-actions";
import { format } from "date-fns";

interface PositionListProps {
  positions: Position[];
  allPersonnel: Personnel[];
  onEdit: (position: Position) => void;
  onDelete: (positionId: string) => void;
}

export function PositionList({ positions, allPersonnel, onEdit, onDelete }: PositionListProps) {
  if (positions.length === 0) {
    return <p className="text-muted-foreground text-center py-4">Pozisyon bulunamadı. Eklemeyi deneyin!</p>;
  }

  const getStatusBadge = (status: Position['status']) => {
    switch (status) {
      case 'Asıl':
        return (
          <Badge variant="default" className="capitalize">
            <BadgeCheck className="mr-1 h-3.5 w-3.5" />
            Asıl
          </Badge>
        );
      case 'Vekalet':
        return (
          <Badge variant="secondary" className="capitalize">
            <BadgeAlert className="mr-1 h-3.5 w-3.5" />
            Vekalet
          </Badge>
        );
      case 'Yürütme':
        return (
          <Badge variant="outline" className="capitalize">
            <Info className="mr-1 h-3.5 w-3.5" />
            Yürütme
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ünvan</TableHead>
            <TableHead>Birim</TableHead>
            <TableHead>Personel</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Başlama Tarihi</TableHead>
            <TableHead className="text-right">Aksiyonlar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => {
            const assignedPerson = allPersonnel.find(p => p.id === position.assignedPersonnelId);
            return (
              <TableRow key={position.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{position.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{position.department}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {assignedPerson ? (
                      <>
                        <UserCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{assignedPerson.firstName} {assignedPerson.lastName} (Sicil: {assignedPerson.registryNumber})</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground italic">Atanmamış</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(position.status)}
                </TableCell>
                <TableCell>
                  {position.startDate ? (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{format(new Date(position.startDate), "dd/MM/yyyy")}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">Belirtilmemiş</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <PositionListItemActions position={position} onEdit={onEdit} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
