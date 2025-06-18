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
      <Label className="text-sm font-medium">Filter by Status:</Label>
      <RadioGroup
        defaultValue={currentFilter}
        onValueChange={(value) => onFilterChange(value as PositionFilterType)}
        className="flex flex-row gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="all" id="filter-all" />
          <Label htmlFor="filter-all" className="font-normal">All</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="permanent" id="filter-permanent" />
          <Label htmlFor="filter-permanent" className="font-normal">Permanent</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="acting" id="filter-acting" />
          <Label htmlFor="filter-acting" className="font-normal">Acting</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
