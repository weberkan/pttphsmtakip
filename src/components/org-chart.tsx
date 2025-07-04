
"use client";

import type { Position, Personnel } from "@/lib/types";
import { OrgChartNode } from "./org-chart-node";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle } from "lucide-react";

interface OrgChartProps {
  positions: Position[];
  allPersonnel: Personnel[];
}

export function OrgChart({ positions, allPersonnel }: OrgChartProps) {
  const genelMudurPositions = positions.filter(p => p.name === "Genel Müdür");

  if (positions.length === 0) {
    return <p className="text-muted-foreground text-center py-4">Şemada gösterilecek pozisyon yok.</p>;
  }
  
  if (genelMudurPositions.length === 0) {
     return (
        <div className="text-center py-4 text-muted-foreground border-l-4 border-destructive bg-destructive/10 p-4 rounded-r-md">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
            <p className="font-semibold text-destructive">Organizasyon Şeması Başlatılamadı</p>
            <p className="mt-2 text-sm">Şemanın oluşturulabilmesi için "Genel Müdür" ünvanlı bir pozisyon bulunmalıdır.</p>
            <p className="mt-1 text-xs">Lütfen pozisyon yönetimi ekranından bu pozisyonu oluşturun veya mevcut bir pozisyonun ünvanını "Genel Müdür" olarak güncelleyin.</p>
        </div>
    );
  }


  return (
    <ScrollArea className="h-[calc(100vh-20rem)] pr-3">
      <ul className="space-y-2">
        {genelMudurPositions.map(position => (
          <OrgChartNode key={position.id} position={position} allPositions={positions} allPersonnel={allPersonnel} level={0} />
        ))}
      </ul>
    </ScrollArea>
  );
}
