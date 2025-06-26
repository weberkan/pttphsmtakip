
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
import { Building2, MapPin, PencilRuler } from "lucide-react";
import type { Position, Personnel } from "@/lib/types";
import { PositionListItemActions } from "./position-list-item-actions";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    const getOverallOrderGroup = (p: Position): number => {
      if (p.name === "Genel Müdür") return 1;
      if (p.name === "Genel Müdür Yardımcısı") return 2;
      if (p.department === "Rehberlik ve Teftiş Başkanlığı") return 3;
      if (p.department === "Finans ve Muhasebe Başkanlığı") return 4;
      return 5;
    };

    return [...positions].sort((a, b) => {
      const overallGroupA = getOverallOrderGroup(a);
      const overallGroupB = getOverallOrderGroup(b);
      if (overallGroupA !== overallGroupB) return overallGroupA - overallGroupB;

      if (overallGroupA === 5) { 
        const deptNameA = a.department.toLowerCase();
        const deptNameB = b.department.toLowerCase();
        if (deptNameA < deptNameB) return -1;
        if (deptNameA > deptNameB) return 1;
      }

      const titleOrderValA = positionTitleOrder[a.name] ?? Infinity;
      const titleOrderValB = positionTitleOrder[b.name] ?? Infinity;
      if (titleOrderValA !== titleOrderValB) return titleOrderValA - titleOrderValB;
      
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA !== nameB) return nameA.localeCompare(nameB);
      
      const locationA = a.dutyLocation?.trim().toLowerCase() ?? '';
      const locationB = b.dutyLocation?.trim().toLowerCase() ?? '';
      if (locationA !== locationB) return locationA.localeCompare(locationB);

      const personA = allPersonnel.find(p => p.id === a.assignedPersonnelId);
      const personB = allPersonnel.find(p => p.id === b.assignedPersonnelId);
      if (personA && personB) {
        const personNameA = `${personA.firstName} ${personA.lastName}`.toLowerCase();
        const personNameB = `${personB.firstName} ${personB.lastName}`.toLowerCase();
        return personNameA.localeCompare(personNameB);
      }

      return 0;
    });
  }, [positions, allPersonnel]);

  if (positions.length === 0) {
    return <p className="text-muted-foreground text-center py-4">Pozisyon bulunamadı. Eklemeyi deneyin!</p>;
  }

  const getStatusBadge = (status: Position['status']) => {
    const statusMap = {
      'Asıl': { letter: 'A', tooltip: 'Asıl', variant: 'default' as const, className: '' },
      'Vekalet': { letter: 'V', tooltip: 'Vekalet', variant: 'secondary' as const, className: '' },
      'Yürütme': { letter: 'Y', tooltip: 'Yürütme', variant: 'outline' as const, className: 'bg-accent/20 border-accent/50' },
      'Boş': { letter: 'B', tooltip: 'Boş', variant: 'outline' as const, className: '' },
    };
    
    const { letter, tooltip, variant, className } = statusMap[status] || { letter: '?', tooltip: status, variant: 'secondary' as const, className: '' };

    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={variant} className={cn("w-6 h-6 flex items-center justify-center p-0 font-bold", className)}>
              {letter}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
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
            <TableHead>Asıl Ünvan</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Başlama Tarihi</TableHead>
            <TableHead>Son Değişiklik</TableHead>
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
                  {position.name}
                </TableCell>
                <TableCell>
                  {assignedPerson && position.status !== 'Boş' ? (
                    <div className="flex flex-col">
                      <span>{assignedPerson.firstName} {assignedPerson.lastName}</span>
                      <span className="text-xs text-muted-foreground">{assignedPerson.registryNumber}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">Atanmamış</span>
                  )}
                </TableCell>
                <TableCell>
                  {assignedPerson && position.status !== 'Boş' ? (
                    assignedPerson.status
                  ) : (
                    <span className="text-muted-foreground italic">Yok</span>
                  )}
                </TableCell>
                <TableCell>
                  {(position.status === 'Vekalet' || position.status === 'Yürütme') && position.originalTitle ? (
                    <span>{position.originalTitle}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Yok</span>
                  )}
                </TableCell>
                <TableCell>
                  {getStatusBadge(position.status)}
                </TableCell>
                <TableCell>
                  {position.startDate && position.status !== 'Boş' ? (
                    <span>{format(new Date(position.startDate), "dd.MM.yyyy")}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Belirtilmemiş</span>
                  )}
                </TableCell>
                <TableCell>
                  {position.lastModifiedBy ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center text-muted-foreground">
                              <PencilRuler className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {position.lastModifiedBy} sicil nolu kullanıcı tarafından{' '}
                            {position.lastModifiedAt ? `${formatDistanceToNow(new Date(position.lastModifiedAt), { addSuffix: true, locale: tr })} güncellendi.` : 'Tarih bilgisi yok'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-muted-foreground italic">Yok</span>
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
