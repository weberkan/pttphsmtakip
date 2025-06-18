
"use client";

import type { Position, Personnel } from "@/lib/types";
import { OrgChartNode } from "./org-chart-node";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OrgChartProps {
  positions: Position[];
  allPersonnel: Personnel[];
}

export function OrgChart({ positions, allPersonnel }: OrgChartProps) {
  const rootPositions = positions.filter(p => !p.reportsTo || !positions.find(parent => parent.id === p.reportsTo));

  if (positions.length === 0) {
    return <p className="text-muted-foreground text-center py-4">Şemada gösterilecek pozisyon yok.</p>;
  }
  
  if (rootPositions.length === 0 && positions.length > 0) {
     return <p className="text-muted-foreground text-center py-4">Şema için üst düzey pozisyon bulunamadı. 'Bağlı Olduğu Pozisyon' alanlarını kontrol edin.</p>;
  }


  return (
    <ScrollArea className="h-[calc(100vh-20rem)] pr-3">
      <ul className="space-y-2">
        {rootPositions.map(position => (
          <OrgChartNode key={position.id} position={position} allPositions={positions} allPersonnel={allPersonnel} level={0} />
        ))}
      </ul>
    </ScrollArea>
  );
}
