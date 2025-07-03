
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
import { CheckCircle2, Mail, Phone, XCircle, PencilRuler, Calendar, Building, MapPin, User, Hash, Briefcase } from "lucide-react";
import type { TasraPosition, Personnel } from "@/lib/types";
import { TasraPositionListItemActions } from "./tasra-position-list-item-actions";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TasraPositionListProps {
  positions: TasraPosition[];
  allPersonnel: Personnel[];
  onEdit: (position: TasraPosition) => void;
  onDelete: (positionId: string) => void;
}

export function TasraPositionList({ positions, allPersonnel, onEdit, onDelete }: TasraPositionListProps) {
    const sortedPositions = useMemo(() => {
        const uniquePositions = Array.from(new Map(positions.map(p => [p.id, p])).values());
        
        return uniquePositions.sort((a, b) => {
            const unitA = a.unit.toLowerCase();
            const unitB = b.unit.toLowerCase();
            if (unitA < unitB) return -1;
            if (unitA > unitB) return 1;

            const dutyA = a.dutyLocation.toLowerCase();
            const dutyB = b.dutyLocation.toLowerCase();
            if (dutyA < dutyB) return -1;
            if (dutyA > dutyB) return 1;
            
            return 0;
        });
    }, [positions]);

  if (positions.length === 0) {
    return <p className="text-muted-foreground text-center py-4">Taşra pozisyonu bulunamadı. Eklemeyi deneyin!</p>;
  }

  const renderStatusMakam = (position: TasraPosition) => {
    const { status, actingAuthority } = position;
    const statusMap = {
      'Asıl': { letter: 'A', tooltip: 'Asıl', variant: 'default' as const, className: '' },
      'Vekalet': { letter: 'V', tooltip: 'Vekalet', variant: 'secondary' as const, className: 'bg-orange-100 text-orange-800 border-orange-200' },
      'Yürütme': { letter: 'Y', tooltip: 'Yürütme', variant: 'outline' as const, className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'Boş': { letter: 'B', tooltip: 'Boş', variant: 'outline' as const, className: '' },
    };
    const authorityMap = {
        'Başmüdürlük': { letter: 'B', tooltip: 'Başmüdürlükçe' },
        'Genel Müdürlük': { letter: 'G', tooltip: 'Genel Müdürlükçe' },
    }

    const statusInfo = statusMap[status];

    return (
        <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Badge variant={statusInfo.variant} className={cn("w-6 h-6 flex items-center justify-center p-0 font-bold", statusInfo.className)}>
                            {statusInfo.letter}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent><p>{statusInfo.tooltip}</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            
            {(status === 'Vekalet' || status === 'Yürütme') && actingAuthority && authorityMap[actingAuthority] && (
                 <TooltipProvider delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 font-bold">
                                {authorityMap[actingAuthority].letter}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent><p>{authorityMap[actingAuthority].tooltip}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
  };
  
  const BooleanIcon = ({value}: {value: boolean}) => {
    if (value) {
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ünite</TableHead>
            <TableHead>Görev Yeri</TableHead>
            <TableHead>Sicil</TableHead>
            <TableHead>Personel</TableHead>
            <TableHead>Personel Statü</TableHead>
            <TableHead>Asıl Ünvan</TableHead>
            <TableHead>Durum / Makam</TableHead>
            <TableHead>Başlama Tarihi</TableHead>
            <TableHead>Vekalet Ücreti</TableHead>
            <TableHead>Yetki Devri</TableHead>
            <TableHead>Doğum Tarihi</TableHead>
            <TableHead>İletişim</TableHead>
            <TableHead>Son Değişiklik</TableHead>
            <TableHead className="text-right">Aksiyonlar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPositions.map((position) => {
            const assignedPerson = allPersonnel.find(p => p.id === position.assignedPersonnelId);
            
            return (
              <TableRow key={position.id}>
                <TableCell><div className="flex items-center gap-2"><Building className="h-4 w-4 shrink-0 text-muted-foreground"/>{position.unit}</div></TableCell>
                <TableCell><div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-muted-foreground"/>{position.dutyLocation}</div></TableCell>
                <TableCell>{assignedPerson ? <div className="flex items-center gap-2"><Hash className="h-4 w-4 shrink-0 text-muted-foreground"/>{assignedPerson.registryNumber}</div> : <span className="text-muted-foreground italic">N/A</span>}</TableCell>
                <TableCell>{assignedPerson ? <div className="flex items-center gap-2"><User className="h-4 w-4 shrink-0 text-muted-foreground"/>{`${assignedPerson.firstName} ${assignedPerson.lastName}`}</div> : <span className="text-muted-foreground italic">Atanmamış</span>}</TableCell>
                <TableCell>{assignedPerson ? <Badge variant={assignedPerson.status === "İHS" ? "default" : "secondary"}>{assignedPerson.status}</Badge> : <span className="text-muted-foreground italic">N/A</span>}</TableCell>
                <TableCell>
                  {(position.status === 'Asıl' && assignedPerson?.unvan) ? (
                    <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 shrink-0 text-muted-foreground"/>{assignedPerson.unvan}</div>
                  ) : ((position.status === 'Vekalet' || position.status === 'Yürütme') && position.originalTitle) ? (
                    <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 shrink-0 text-muted-foreground"/>{position.originalTitle}</div>
                  ) : (
                    <span className="text-muted-foreground italic">Yok</span>
                  )}
                </TableCell>
                <TableCell>{renderStatusMakam(position)}</TableCell>
                <TableCell>{position.startDate ? format(new Date(position.startDate), "dd.MM.yyyy") : <span className="text-muted-foreground italic">Belirtilmemiş</span>}</TableCell>
                <TableCell><BooleanIcon value={position.receivesProxyPay} /></TableCell>
                <TableCell><BooleanIcon value={position.hasDelegatedAuthority} /></TableCell>
                <TableCell>{assignedPerson?.dateOfBirth ? <div className="flex items-center gap-2"><Calendar className="h-4 w-4 shrink-0 text-muted-foreground"/>{format(new Date(assignedPerson.dateOfBirth), "dd.MM.yyyy")}</div> : <span className="text-muted-foreground italic">N/A</span>}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {assignedPerson?.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-muted-foreground"/>{assignedPerson.phone}</div>}
                    {assignedPerson?.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-muted-foreground"/>{assignedPerson.email}</div>}
                    {!assignedPerson?.phone && !assignedPerson?.email && <span className="text-muted-foreground italic">N/A</span>}
                  </div>
                </TableCell>
                <TableCell>
                  {position.lastModifiedBy && position.lastModifiedAt ? (
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
                              const modifier = allPersonnel.find(p => p.registryNumber === position.lastModifiedBy);
                              const modifierName = modifier ? `${modifier.firstName} ${modifier.lastName}` : position.lastModifiedBy;
                              const timeAgo = formatDistanceToNow(new Date(position.lastModifiedAt), { locale: tr });
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
                  <TasraPositionListItemActions position={position} onEdit={onEdit} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
