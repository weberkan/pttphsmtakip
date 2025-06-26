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

// Hiyerarşik sıralama için ünvanlara öncelik değerleri atanır. Düşük değer daha üstte.
const positionTitleOrder: { [key: string]: number } = {
  "Genel Müdür": 1,
  "Genel Müdür Yardımcısı": 2,
  "Daire Başkanı": 3,
  "Finans ve Muhasebe Başkanı": 3, // Aynı seviye
  "Rehberlik ve Teftiş Başkanı": 3, // Aynı seviye
  "Başkan Yardımcısı": 4,
  "Daire Başkan Yardımcısı": 4, // Aynı seviye
  "Teknik Müdür": 5,
  "Şube Müdürü": 6,
  // Diğer tüm ünvanlar daha sonra alfabetik olarak sıralanacak (Infinity ile)
};

// Arka planı renklendirilecek özel ünvanlar
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
      return 5; // Diğer tüm departmanlar
    };

    return [...positions].sort((a, b) => {
      const overallGroupA = getOverallOrderGroup(a);
      const overallGroupB = getOverallOrderGroup(b);

      // 1. Ana gruplara göre sırala (GM, GM Yrd, Rehberlik, Finans, Diğerleri)
      if (overallGroupA !== overallGroupB) {
        return overallGroupA - overallGroupB;
      }

      // 2. Eğer "Diğerleri" grubundaysalar (overallGroupA === 5), departmana göre alfabetik sırala
      if (overallGroupA === 5) {
        const deptNameA = a.department.toLowerCase();
        const deptNameB = b.department.toLowerCase();
        if (deptNameA < deptNameB) return -1;
        if (deptNameA > deptNameB) return 1;
      }

      // 3. Aynı grup ve (gerekiyorsa) aynı departman içindeyse, ünvan hiyerarşisine göre sırala
      const titleOrderValA = positionTitleOrder[a.name] ?? Infinity;
      const titleOrderValB = positionTitleOrder[b.name] ?? Infinity;
      if (titleOrderValA !== titleOrderValB) {
        return titleOrderValA - titleOrderValB;
      }

      // 4. Aynı hiyerarşi seviyesindeyse, ünvana göre alfabetik sırala
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA !== nameB) {
        return nameA.localeCompare(nameB);
      }
      
      // 5. Eğer ünvanlar da aynı ise, Görev Yeri'ne göre alfabetik sırala
      const locationA = a.dutyLocation?.trim().toLowerCase() ?? '';
      const locationB = b.dutyLocation?.trim().toLowerCase() ?? '';
      if (locationA && !locationB) return -1; // Görev yeri olanlar olmayanlardan önce gelir
      if (!locationA && locationB) return 1;
      if (locationA !== locationB) {
        return locationA.localeCompare(locationB);
      }

      // 6. Son çare: Eğer Görev Yeri de aynıysa, atanmış personele göre sırala (stabilite için)
      const personA = allPersonnel.find(p => p.id === a.assignedPersonnelId);
      const personB = allPersonnel.find(p => p.id === b.assignedPersonnelId);

      if (personA && !personB) return -1; // Atanmış olanlar atanmamış olanlardan önce gelir
      if (!personA && personB) return 1;
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
