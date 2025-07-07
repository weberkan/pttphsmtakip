
"use client";

import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { KanbanCard } from '@/lib/types';
import { useDroppable } from '@dnd-kit/core';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
    id: string;
    title: string;
    color: string;
    cards: KanbanCard[];
    children: ReactNode;
}

export function KanbanColumn({ id, title, color, cards, children }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id,
        data: {
            type: 'Column',
        }
    });

    return (
        <div className="flex flex-col gap-4 bg-muted/50 p-4 rounded-lg h-full" ref={setNodeRef}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", color)}></div>
                    <h2 className="font-semibold text-lg">{title}</h2>
                    <span className="text-muted-foreground text-sm">({cards.length})</span>
                </div>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto">
                <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {children}
                    {cards.length === 0 && (
                         <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg mt-2">
                            <p>Henüz talimat yok.</p>
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
}
