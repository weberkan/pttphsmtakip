
"use client";

import { useState, useMemo } from 'react';
import type { KanbanCard, AppUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddEditTalimatDialog } from './add-edit-talimat-dialog';
import { useAuth } from '@/contexts/auth-context';
import { usePositions } from '@/hooks/use-positions';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './kanban-column';
import { KanbanCardItem } from './kanban-card-item';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';


const statusMap = {
    todo: { title: 'Yapılacaklar', color: 'bg-gray-500' },
    inProgress: { title: 'Devam Edenler', color: 'bg-blue-500' },
    done: { title: 'Tamamlananlar', color: 'bg-green-500' },
};
type Status = keyof typeof statusMap;

export function TalimatlarBoard({ cards, allUsers, addCard, updateCard, deleteCard, updateCardBatch }: {
    cards: KanbanCard[];
    allUsers: AppUser[];
    addCard: (cardData: Omit<KanbanCard, 'id' | 'order' | 'lastModifiedBy' | 'lastModifiedAt'>) => void;
    updateCard: (card: KanbanCard) => void;
    deleteCard: (cardId: string) => void;
    updateCardBatch: (cardsToUpdate: (Partial<KanbanCard> & { id: string })[]) => Promise<void>;
}) {
    const { user } = useAuth();
    const { positions, personnel, isInitialized: isPositionsInitialized } = usePositions();

    const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
    const [initialStatus, setInitialStatus] = useState<Status>('todo');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const managerUser = useMemo(() => {
        if (!isPositionsInitialized || !user) return null;
    
        const managerPosition = positions.find(p =>
            p.department === 'İnsan Kaynakları Daire Başkanlığı' &&
            p.name === 'Şube Müdürü' &&
            p.dutyLocation === 'Personel Hareketleri Şube Müdürlüğü'
        );
        
        if (!managerPosition || !managerPosition.assignedPersonnelId) return null;
        
        const assignedPerson = personnel.find(per => per.id === managerPosition.assignedPersonnelId);
        if (!assignedPerson) return null;

        return allUsers.find(u => u.registryNumber === assignedPerson.registryNumber) || null;
    }, [positions, personnel, isPositionsInitialized, allUsers, user]);

    const isManager = useMemo(() => !!managerUser && managerUser.uid === user?.uid, [managerUser, user]);
    
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

    async function handleDragEnd(event: DragEndEvent) {
        setActiveCard(null);
        const { active, over } = event;
    
        if (!over || active.id === over.id) {
            return;
        }
    
        const activeCard = cards.find(c => c.id === active.id);
        if (!activeCard) return;
    
        const overIsColumn = over.data.current?.type === 'Column';
        const overIsCard = over.data.current?.type === 'Card';
    
        if (!overIsColumn && !overIsCard) return;
    
        const newStatus: Status = overIsColumn ? over.id as Status : over.data.current!.card.status;
    
        const sourceColumn = cards.filter(c => c.status === activeCard.status).sort((a, b) => a.order - b.order);
        let destColumn = cards.filter(c => c.status === newStatus).sort((a, b) => a.order - b.order);
    
        const oldIndexInSourceCol = sourceColumn.findIndex(c => c.id === active.id);
        
        let newIndexInDestCol;
        if (overIsCard) {
            newIndexInDestCol = destColumn.findIndex(c => c.id === over.id);
             if (activeCard.status === newStatus && newIndexInDestCol > oldIndexInSourceCol) {
                // Adjust index if moving down in the same column to account for the removed item
                // No, arrayMove handles this. Let's rethink.
            }
        } else {
            newIndexInDestCol = destColumn.length;
        }

        const updates: (Partial<KanbanCard> & { id: string })[] = [];
        
        if (activeCard.status === newStatus) {
            // Reordering within the same column
            const reorderedColumn = arrayMove(sourceColumn, oldIndexInSourceCol, newIndexInDestCol);
            reorderedColumn.forEach((card, index) => {
                if (card.order !== index) {
                    updates.push({ id: card.id, order: index });
                }
            });
        } else {
            // Moving to a new column
            const [movedItem] = sourceColumn.splice(oldIndexInSourceCol, 1);
            destColumn.splice(newIndexInDestCol, 0, movedItem);

            // Update orders for the source column (items left behind)
            sourceColumn.forEach((card, index) => {
                if (card.order !== index) {
                    updates.push({ id: card.id, order: index });
                }
            });

            // Update orders for the destination column (all items)
            destColumn.forEach((card, index) => {
                 updates.push({ id: card.id, status: newStatus, order: index });
            });
        }
    
        if (updates.length > 0) {
            await updateCardBatch(updates);
        }
    
        if (newStatus === 'done' && activeCard.status !== 'done' && managerUser) {
            if (db) {
                await addDoc(collection(db, 'notifications'), {
                    recipientUid: managerUser.uid,
                    senderInfo: "Depposh Sistemi",
                    message: `Atadığınız '${activeCard.title}' görevi tamamlandı.`,
                    link: '/?view=depposh-talimatlar',
                    isRead: false,
                    createdAt: Timestamp.now(),
                });
            }
        }
    }


    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
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
                            {isManager && status === 'todo' && (
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
                                    isManager={isManager}
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
