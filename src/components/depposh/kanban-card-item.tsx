
"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2, Calendar, Flame, Signal, Minus } from 'lucide-react';
import type { KanbanCard, AppUser } from '@/lib/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

const PriorityIcon = ({ priority }: { priority: KanbanCard['priority'] }) => {
    if (!priority) return null;

    const priorityMap = {
        high: { icon: Flame, color: 'text-red-500', label: 'Yüksek Öncelik' },
        medium: { icon: Signal, color: 'text-yellow-500', label: 'Orta Öncelik' },
        low: { icon: Minus, color: 'text-gray-500', label: 'Düşük Öncelik' },
    };

    const { icon: Icon, color, label } = priorityMap[priority];

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <Icon className={cn("h-4 w-4", color)} />
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};


export function KanbanCardItem({
    card,
    allUsers,
    onEdit,
    onDelete,
}: {
    card: KanbanCard;
    allUsers: AppUser[];
    onEdit: (card: KanbanCard) => void;
    onDelete: (cardId: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: card.id,
        data: {
            type: 'Card',
            card,
        },
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card className="bg-background mb-4 touch-none">
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
                                <DropdownMenuItem onClick={() => onEdit(card)}>
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
                                <AlertDialogAction onClick={() => onDelete(card.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex justify-between items-center">
                    {(card.assignedUids && card.assignedUids.length > 0) ? (
                        <AvatarStack uids={card.assignedUids} allUsers={allUsers} />
                    ) : <div />}
                    <div className="flex items-center gap-3 text-muted-foreground">
                        {card.priority && <PriorityIcon priority={card.priority} />}
                        {card.dueDate && (
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger className="flex items-center gap-1 text-xs">
                                        <Calendar className="h-4 w-4" />
                                        <span>{format(new Date(card.dueDate as any), 'dd MMM', { locale: tr })}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>Bitiş Tarihi: {format(new Date(card.dueDate as any), 'PPP', { locale: tr })}</TooltipContent>
                                </Tooltip>
                             </TooltipProvider>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
