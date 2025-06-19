
"use client";

import type { Position, Personnel } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, User, BadgeCheck, BadgeAlert, Building2, Info, CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface OrgChartNodeProps {
  position: Position;
  allPositions: Position[];
  allPersonnel: Personnel[];
  level: number;
}

export function OrgChartNode({ position, allPositions, allPersonnel, level }: OrgChartNodeProps) {
  const children = allPositions.filter(p => p.reportsTo === position.id);
  const assignedPerson = allPersonnel.find(p => p.id === position.assignedPersonnelId);

  const getStatusBadge = (status: Position['status']) => {
    switch (status) {
      case 'Asıl':
        return (
          <Badge variant="default" className="capitalize text-xs px-1.5 py-0.5">
            <BadgeCheck className="mr-1 h-3 w-3" />
            Asıl
          </Badge>
        );
      case 'Vekalet':
        return (
          <Badge variant="secondary" className="capitalize text-xs px-1.5 py-0.5">
            <BadgeAlert className="mr-1 h-3 w-3" />
            Vekalet
          </Badge>
        );
      case 'Yürütme':
        return (
          <Badge variant="outline" className="capitalize text-xs px-1.5 py-0.5">
            <Info className="mr-1 h-3 w-3" />
            Yürütme
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="text-xs px-1.5 py-0.5">{status}</Badge>;
    }
  };

  const getStartDateLabelPrefix = (status: Position['status']) => {
    switch (status) {
      case 'Asıl':
        return "Atanma: ";
      case 'Vekalet':
        return "Vekalet Bşl.: ";
      case 'Yürütme':
        return "Yürütme Bşl.: ";
      default:
        return "Başlama: ";
    }
  };

  return (
    <li style={{ marginLeft: `${level * 20}px` }} className="mt-2">
      <Card className="mb-2 shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="p-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {position.name}
          </CardTitle>
          <CardDescription className="text-xs flex items-center gap-2 mt-1">
            <Avatar className="h-6 w-6">
              <AvatarImage 
                src={assignedPerson?.photoUrl || undefined} 
                alt={assignedPerson ? `${assignedPerson.firstName} ${assignedPerson.lastName}` : "Atanmamış"} 
                data-ai-hint="person avatar"
              />
              <AvatarFallback>
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            {assignedPerson ? `${assignedPerson.firstName} ${assignedPerson.lastName}` : <span className="italic">Atanmamış</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0 text-xs">
            <div className="flex items-center gap-1 mb-1">
                <Building2 className="h-3 w-3 text-muted-foreground"/>
                <span>{position.department}</span>
            </div>
            {getStatusBadge(position.status)}
             {position.startDate && (
              <div className="flex items-center gap-1 mt-1">
                <CalendarDays className="h-3 w-3 text-muted-foreground"/>
                <span>{getStartDateLabelPrefix(position.status)}{format(new Date(position.startDate), "dd.MM.yyyy")}</span>
              </div>
            )}
        </CardContent>
      </Card>
      {children.length > 0 && (
        <ul className="pl-4 border-l-2 border-border ml-2">
          {children.map(child => (
            <OrgChartNode key={child.id} position={child} allPositions={allPositions} allPersonnel={allPersonnel} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
