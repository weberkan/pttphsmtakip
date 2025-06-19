
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
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, BadgeAlert, Briefcase, Building2, UserCircle, Info, CalendarDays, MapPin, CircleOff } from "lucide-react";
import type { Position, Personnel } from "@/lib/types";
import { PositionListItemActions } from "./position-list-item-actions";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PositionListProps {
  positions: Position[];
  allPersonnel: Personnel[];
  onEdit: (position: Position) => void;
  onDelete: (positionId: string) => void;
}

const positionTitleOrder: { [key: string]: number } = {
  "Genel Müdür": 1,
  "Genel Müdür Yardımcısı": 2,
  "Daire Başkanı": 3,
  "Finans ve Muhasebe Başkanı": 3,
  "Rehberlik ve Teftiş Başkanı": 3,
  "Başkan Yardımcısı": 4,
  "Daire Başkan Yardımcısı": 4,
  "Teknik Müdür": 5,
  "Şube Müdürü": 6,
};

const styledTitles = [
  "Daire Başkanı",
  "Finans ve Muhasebe Başkanı",
  "Rehberlik ve Teftiş Başkanı",
];

export function PositionList({ positions, allPersonnel, onEdit, onDelete }: PositionListProps) {
  const sortedPositions = useMemo(() => {
    return [...positions].sort((a, b) => {
      const orderA = positionTitleOrder[a.name] ?? Infinity;
      const orderB = positionTitleOrder[b.name] ?? Infinity;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Same hierarchy or both not in hierarchy, sort by department then name
      if (a.department.toLowerCase() < b.department.toLowerCase()) return -1;
      if (a.department.toLowerCase() > b.department.toLowerCase()) return 1;
      
      if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
      if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
      
      return 0;
    });
  }, [positions]);

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
          <Badge variant="outline" className="capitalize bg-accent/20 border-accent/50">
            <Info className="mr-1 h-3.5 w-3.5" />
            Yürütme
          </Badge>
        );
      case 'Boş':
        return (
          <Badge variant="outline" className="capitalize">
            <CircleOff className="mr-1 h-3.5 w-3.5" />
            Boş
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
            <TableHead>Birim</TableHead>
            <TableHead>Görev Yeri</TableHead>
            <TableHead>Ünvan</TableHead>
            <TableHead>Personel</TableHead>
            <TableHead>Statü</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Başlama Tarihi</TableHead>
            <TableHead className="text-right">Aksiyonlar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPositions.map((position) => {
            const assignedPerson = allPersonnel.find(p => p.id === position.assignedPersonnelId);
            const isStyledTitle = styledTitles.includes(position.name);
            return (
              <TableRow 
                key={position.id}
                className={cn(isStyledTitle && "bg-accent/10 hover:bg-accent/20")}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{position.department}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{position.dutyLocation || <span className="text-muted-foreground italic">Belirtilmemiş</span>}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{position.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {assignedPerson && position.status !== 'Boş' ? (
                      <>
                        <UserCircle className="h-4 w-4 text-muted-foreground shrink-0 self-start mt-1" />
                        <div className="flex flex-col">
                          <span>{assignedPerson.firstName} {assignedPerson.lastName}</span>
                          <span className="text-xs text-muted-foreground">{assignedPerson.registryNumber}</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground italic">Atanmamış</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {assignedPerson && position.status !== 'Boş' ? (
                    assignedPerson.status
                  ) : (
                    <span className="text-muted-foreground italic">Yok</span>
                  )}
                </TableCell>
                <TableCell>
                  {getStatusBadge(position.status)}
                </TableCell>
                <TableCell>
                  {position.startDate && position.status !== 'Boş' ? (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{format(new Date(position.startDate), "dd.MM.yyyy")}</span>
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
