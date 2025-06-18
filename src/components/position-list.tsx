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
import { BadgeCheck, BadgeAlert, Briefcase, Building2 } from "lucide-react";
import type { Position } from "@/lib/types";
import { PositionListItemActions } from "./position-list-item-actions";

interface PositionListProps {
  positions: Position[];
  onEdit: (position: Position) => void;
  onDelete: (positionId: string) => void;
}

export function PositionList({ positions, onEdit, onDelete }: PositionListProps) {
  if (positions.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No positions found. Try adding some!</p>;
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Position Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => (
            <TableRow key={position.id}>
              <TableCell className="font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                {position.name}
              </TableCell>
              <TableCell className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {position.department}
              </TableCell>
              <TableCell>{position.employeeName}</TableCell>
              <TableCell>
                <Badge variant={position.status === 'permanent' ? 'default' : 'secondary'} className="capitalize">
                  {position.status === 'permanent' ? (
                    <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                  ) : (
                    <BadgeAlert className="mr-1 h-3.5 w-3.5" />
                  )}
                  {position.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <PositionListItemActions position={position} onEdit={onEdit} onDelete={onDelete} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
