"use client";

import type { Position } from "@/lib/types";
import { OrgChartNode } from "./org-chart-node";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OrgChartProps {
  positions: Position[];
}

export function OrgChart({ positions }: OrgChartProps) {
  const rootPositions = positions.filter(p => !p.reportsTo || !positions.find(parent => parent.id === p.reportsTo));

  if (positions.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No positions to display in chart.</p>;
  }
  
  if (rootPositions.length === 0 && positions.length > 0) {
     return <p className="text-muted-foreground text-center py-4">No top-level positions found for the chart. Check 'Reports To' fields.</p>;
  }


  return (
    <ScrollArea className="h-[calc(100vh-20rem)] pr-3"> {/* Adjust height as needed */}
      <ul className="space-y-2">
        {rootPositions.map(position => (
          <OrgChartNode key={position.id} position={position} allPositions={positions} level={0} />
        ))}
      </ul>
    </ScrollArea>
  );
}
