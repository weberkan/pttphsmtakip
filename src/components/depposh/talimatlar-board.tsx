
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { KanbanCard, AppUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddEditTalimatDialog } from './add-edit-talimat-dialog';
import { useAuth } from '@/contexts/auth-context';
import { usePositions } from '@/hooks/use-positions';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './kanban-column';
import { KanbanCardItem } from './kanban-card-item';
import { useDepposh } from '@/hooks/use-depposh';


const statusMap = {
    todo: { title: 'Yapılacaklar', color: 'bg-gray-500' },
    inProgress: { title: 'Devam Edenler', color: 'bg-blue-500' },
    done: { title: 'Tamamlananlar', color: 'bg-green-500' },
};
type Status = keyof typeof statusMap;

export function TalimatlarBoard({ cards: initialCards, allUsers, addCard, updateCard, deleteCard }: {
    cards: KanbanCard[];
    allUsers: AppUser[];
    addCard: (cardData: Omit<KanbanCard, 'id' | 'order' | 'lastModifiedBy' | 'lastModifiedAt'>) => void;
    updateCard: (card: KanbanCard) => void;
    deleteCard: (cardId: string) => void;
}) {
    const { user } = useAuth();
    const { positions, personnel, isInitialized: isPositionsInitialized } = usePositions();
    const { updateCardBatch } = useDepposh();

    const [cards, setCards] = useState(initialCards);
    const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
    const [initialStatus, setInitialStatus] = useState<Status>('todo');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        setCards(initialCards);
    }, [initialCards]);

    const canAddTalimat = useMemo(() => {
        if (!user || !isPositionsInitialized) return false;

        const managerPositions = positions.filter(p =>
            p.department === 'İnsan Kaynakları Daire Başkanlığı' &&
            p.dutyLocation === 'Personel Hareketleri Şube Müdürlüğü' &&
            p.name === 'Şube Müdürü'
        );

        if (managerPositions.length === 0) return false;
        
        return managerPositions.some(p => {
            if (!p.assignedPersonnelId) return false;
            const assignedPerson = personnel.find(per => per.id === p.assignedPersonnelId);
            return assignedPerson?.registryNumber === user.registryNumber;
        });

    }, [user, positions, personnel, isPositionsInitialized]);
    
    const handleAddClick = (status: Status) => {
        setEditingCard(null);
        setInitialStatus(status);
        setIsDialogOpen(true);
    };

    const handleEditClick = (card: KanbanCard) => {
        setEditingCard(card);
        setIsDialogOpen(true);
    };

    const handleSaveCard = (data: Omit<KanbanCard, 'id' | 'order' | 'lastModifiedBy' | 'lastModifiedAt'> | KanbanCard) => {
        if ('id' in data) {
            updateCard(data);
        } else {
            addCard(data);
        }
    };
    
    const columns = useMemo(() => {
        const grouped: Record<Status, KanbanCard[]> = { todo: [], inProgress: [], done: [] };
        cards.forEach(card => {
            if (grouped[card.status]) {
                grouped[card.status].push(card);
            }
        });
        for (const status in grouped) {
            grouped[status as Status].sort((a, b) => a.order - b.order);
        }
        return grouped;
    }, [cards]);

    function handleDragStart(event: DragStartEvent) {
        const card = cards.find(c => c.id === event.active.id);
        if (card) {
            setActiveCard(card);
        }
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;
    
        const activeId = active.id;
        const overId = over.id;
    
        if (activeId === overId) return;
    
        const isActiveACard = active.data.current?.type === 'Card';
        const isOverACard = over.data.current?.type === 'Card';
    
        if (!isActiveACard) return;
    
        // Dropping a Card over another Card
        if (isActiveACard && isOverACard) {
            setCards(prev => {
                const activeIndex = prev.findIndex(c => c.id === activeId);
                const overIndex = prev.findIndex(c => c.id === overId);
    
                if (prev[activeIndex].status !== prev[overIndex].status) {
                    const newCards = [...prev];
                    newCards[activeIndex].status = prev[overIndex].status;
                    return arrayMove(newCards, activeIndex, overIndex - 1);
                }
    
                return arrayMove(prev, activeIndex, overIndex);
            });
        }
    
        // Dropping a Card over a column
        const isOverAColumn = over.data.current?.type === 'Column';
        if (isActiveACard && isOverAColumn) {
            setCards(prev => {
                const activeIndex = prev.findIndex(c => c.id === activeId);
                prev[activeIndex].status = overId as Status;
                return arrayMove(prev, activeIndex, activeIndex);
            });
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over) {
            setActiveCard(null);
            return;
        }

        const activeId = String(active.id);
        let overId = over.id;

        if (over.data.current?.type === 'Card') {
            overId = over.data.current.card.status;
        }
        
        if (activeId === overId) {
            setActiveCard(null);
            return;
        }

        const oldCard = cards.find(c => c.id === activeId);
        if (!oldCard) return;

        const newStatus = overId as Status;
        
        let newCards = [...cards];
        const oldIndex = newCards.findIndex(c => c.id === activeId);
        
        // Find the index in the new column
        const overIndex = over.data.current?.type === 'Card'
          ? newCards.findIndex(c => c.id === over.id)
          : -1;

        if (overIndex !== -1) {
            newCards[oldIndex].status = newCards[overIndex].status;
            newCards = arrayMove(newCards, oldIndex, overIndex);
        } else {
             newCards[oldIndex].status = newStatus;
        }

        const cardsToUpdate: (Partial<KanbanCard> & { id: string })[] = [];
        
        const columnStates: Record<Status, KanbanCard[]> = { todo: [], inProgress: [], done: [] };
        newCards.forEach(c => columnStates[c.status].push(c));
        
        Object.values(columnStates).forEach(column => {
            column.sort((a,b) => a.order - b.order) // Ensure correct sorting before re-indexing
                .forEach((card, index) => {
                    const originalCard = initialCards.find(c => c.id === card.id);
                    if (originalCard && (originalCard.status !== card.status || originalCard.order !== index)) {
                         cardsToUpdate.push({
                            id: card.id,
                            status: card.status,
                            order: index
                        });
                    }
                });
        });
        
        if (cardsToUpdate.length > 0) {
            updateCardBatch(cardsToUpdate);
        }

        setActiveCard(null);
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    collisionDetection={closestCenter}
                >
                    {(Object.keys(statusMap) as Status[]).map(status => (
                        <KanbanColumn
                            key={status}
                            id={status}
                            title={statusMap[status].title}
                            color={statusMap[status].color}
                            cards={columns[status]}
                        >
                            {canAddTalimat && status === 'todo' && (
                                <Button variant="ghost" className="w-full justify-start mt-2" onClick={() => handleAddClick('todo')}>
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Yeni Talimat Ekle
                                </Button>
                            )}
                             {columns[status].map(card => (
                                <KanbanCardItem
                                    key={card.id}
                                    card={card}
                                    allUsers={allUsers}
                                    onEdit={handleEditClick}
                                    onDelete={deleteCard}
                                />
                            ))}
                        </KanbanColumn>
                    ))}
                </DndContext>
            </div>

            <AddEditTalimatDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                cardToEdit={editingCard}
                initialStatus={initialStatus}
                allUsers={allUsers}
                onSave={handleSaveCard}
            />
        </>
    );
}
