
"use client";

import type { Position, Personnel } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, User, BadgeCheck, BadgeAlert, Building2 } from "lucide-react";

interface OrgChartNodeProps {
  position: Position;
  allPositions: Position[];
  allPersonnel: Personnel[];
  level: number;
}

export function OrgChartNode({ position, allPositions, allPersonnel, level }: OrgChartNodeProps) {
  const children = allPositions.filter(p => p.reportsTo === position.id);
  const assignedPerson = allPersonnel.find(p => p.id === position.assignedPersonnelId);

  return (
    <li style={{ marginLeft: `${level * 20}px` }} className="mt-2">
      <Card className="mb-2 shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="p-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {position.name}
          </CardTitle>
          <CardDescription className="text-xs flex items-center gap-1 mt-1">
            <User className="h-3 w-3" /> 
            {assignedPerson ? `${assignedPerson.firstName} ${assignedPerson.lastName}` : <span className="italic">Atanmamış</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0 text-xs">
            <div className="flex items-center gap-1 mb-1">
                <Building2 className="h-3 w-3 text-muted-foreground"/>
                <span>{position.department}</span>
            </div>
             <Badge variant={position.status === 'permanent' ? 'default' : 'secondary'} className="capitalize text-xs px-1.5 py-0.5">
              {position.status === 'permanent' ? (
                <BadgeCheck className="mr-1 h-3 w-3" />
              ) : (
                <BadgeAlert className="mr-1 h-3 w-3" />
              )}
              {position.status === 'permanent' ? 'Kalıcı' : 'Vekaleten'}
            </Badge>
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
