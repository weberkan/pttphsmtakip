"use client";

import { Button } from "@/components/ui/button";
import { Network, PlusCircle } from "lucide-react";

interface AppHeaderProps {
  onAddPosition: () => void;
}

export function AppHeader({ onAddPosition }: AppHeaderProps) {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Position Tracker</h1>
        </div>
        <Button onClick={onAddPosition} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Position
        </Button>
      </div>
    </header>
  );
}
