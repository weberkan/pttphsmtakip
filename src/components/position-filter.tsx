
"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Position } from "@/lib/types";

export type PositionFilterType = "all" | Position['status'];

interface PositionFilterProps {
  currentFilter: PositionFilterType;
  onFilterChange: (filter: PositionFilterType) => void;
}

export function PositionFilter({ currentFilter, onFilterChange }: PositionFilterProps) {
  return (
    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-start gap-4 sm:gap-6">
      <Label className="text-sm font-medium">Duruma Göre Filtrele:</Label>
      <RadioGroup
        defaultValue={currentFilter}
        onValueChange={(value) => onFilterChange(value as PositionFilterType)}
        className="flex flex-wrap flex-row gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="all" id="filter-all" />
          <Label htmlFor="filter-all" className="font-normal">Tümü</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Asıl" id="filter-asil" />
          <Label htmlFor="filter-asil" className="font-normal">Asıl</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Vekalet" id="filter-vekalet" />
          <Label htmlFor="filter-vekalet" className="font-normal">Vekalet</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Yürütme" id="filter-yurutme" />
          <Label htmlFor="filter-yurutme" className="font-normal">Yürütme</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Boş" id="filter-bos" />
          <Label htmlFor="filter-bos" className="font-normal">Boş</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
