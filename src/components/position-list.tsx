
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
import { BadgeCheck, BadgeAlert, Briefcase, Building2, UserCircle } from "lucide-react";
import type { Position, Personnel } from "@/lib/types";
import { PositionListItemActions } from "./position-list-item-actions";

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

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pozisyon Adı</TableHead>
            <TableHead>Departman</TableHead>
            <TableHead>Atanan Personel</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-right">Aksiyonlar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => {
            const assignedPerson = allPersonnel.find(p => p.id === position.assignedPersonnelId);
            return (
              <TableRow key={position.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  {position.name}
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {position.department}
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  {assignedPerson ? (
                    <>
                      <UserCircle className="h-4 w-4 text-muted-foreground" />
                      {assignedPerson.firstName} {assignedPerson.lastName} (Sicil: {assignedPerson.registryNumber})
                    </>
                  ) : (
                    <span className="text-muted-foreground italic">Atanmamış</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={position.status === 'permanent' ? 'default' : 'secondary'} className="capitalize">
                    {position.status === 'permanent' ? (
                      <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                    ) : (
                      <BadgeAlert className="mr-1 h-3.5 w-3.5" />
                    )}
                    {position.status === 'permanent' ? 'Kalıcı' : 'Vekaleten'}
                  </Badge>
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
