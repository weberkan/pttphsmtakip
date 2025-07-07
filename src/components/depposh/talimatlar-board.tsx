
"use client";

import { useState, useMemo } from 'react';
import type { KanbanCard, AppUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, MoreVertical, Edit, Trash2, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AddEditTalimatDialog } from './add-edit-talimat-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface TalimatlarBoardProps {
    cards: KanbanCard[];
    allUsers: AppUser[];
    addCard: (cardData: Omit<KanbanCard, 'id' | 'order'>) => void;
    updateCard: (card: KanbanCard) => void;
    deleteCard: (cardId: string) => void;
}

const statusMap = {
    todo: { title: 'Yapılacaklar', color: 'bg-gray-500' },
    inProgress: { title: 'Devam Edenler', color: 'bg-blue-500' },
    done: { title: 'Tamamlananlar', color: 'bg-green-500' },
};
type Status = keyof typeof statusMap;

const AvatarStack = ({ uids, allUsers }: { uids: string[], allUsers: AppUser[] }) => {
    const assignedUsers = uids.map(uid => allUsers.find(u => u.uid === uid)).filter(Boolean) as AppUser[];

    if (assignedUsers.length === 0) {
        return null;
    }

    const visibleAvatars = assignedUsers.slice(0, 3);
    const hiddenCount = assignedUsers.length - visibleAvatars.length;

    return (
        <div className="flex -space-x-2 overflow-hidden">
            <TooltipProvider>
                {visibleAvatars.map(user => (
                    <Tooltip key={user.uid}>
                        <TooltipTrigger>
                            <Avatar className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={user.photoUrl || ''} />
                                <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                           {user.firstName} {user.lastName}
                        </TooltipContent>
                    </Tooltip>
                ))}
                {hiddenCount > 0 && (
                     <Tooltip>
                        <TooltipTrigger>
                             <Avatar className="h-6 w-6 border-2 border-background">
                                <AvatarFallback>+{hiddenCount}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                           ve {hiddenCount} diğer kullanıcı
                        </TooltipContent>
                    </Tooltip>
                )}
            </TooltipProvider>
        </div>
    );
};


export function TalimatlarBoard({ cards, allUsers, addCard, updateCard, deleteCard }: TalimatlarBoardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
    const [initialStatus, setInitialStatus] = useState<Status>('todo');

    const handleAddClick = (status: Status) => {
        setEditingCard(null);
        setInitialStatus(status);
        setIsDialogOpen(true);
    };

    const handleEditClick = (card: KanbanCard) => {
        setEditingCard(card);
        setIsDialogOpen(true);
    };

    const handleSaveCard = (data: Omit<KanbanCard, 'id' | 'order'> | KanbanCard) => {
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
        // Sort cards within each group by their order property
        for (const status in grouped) {
            grouped[status as Status].sort((a,b) => a.order - b.order);
        }
        return grouped;
    }, [cards]);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
                {(Object.keys(statusMap) as Status[]).map(status => (
                    <div key={status} className="flex flex-col gap-4 bg-muted/50 p-4 rounded-lg h-full">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${statusMap[status].color}`}></div>
                                <h2 className="font-semibold text-lg">{statusMap[status].title}</h2>
                                <span className="text-muted-foreground text-sm">({columns[status].length})</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleAddClick(status)}>
                                <PlusCircle className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="flex flex-col gap-4 overflow-y-auto">
                           {columns[status].length > 0 ? columns[status].map(card => (
                                <Card key={card.id} className="bg-background">
                                    <CardHeader className="p-4 flex flex-row items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base font-medium">{card.title}</CardTitle>
                                             {card.description && (
                                                <CardDescription className="text-sm text-muted-foreground whitespace-pre-wrap">{card.description}</CardDescription>
                                            )}
                                        </div>
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 flex-shrink-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleEditClick(card)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Düzenle
                                                    </DropdownMenuItem>
                                                     <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Sil
                                                        </DropdownMenuItem>
                                                     </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Bu işlem geri alınamaz. "{card.title}" talimatını kalıcı olarak silmek istediğinizden emin misiniz?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteCard(card.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </CardHeader>
                                    {(card.assignedUids && card.assignedUids.length > 0) && (
                                        <CardContent className="p-4 pt-0">
                                            <AvatarStack uids={card.assignedUids} allUsers={allUsers} />
                                        </CardContent>
                                    )}
                                </Card>
                            )) : (
                                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                    <p>Henüz talimat yok.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
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
