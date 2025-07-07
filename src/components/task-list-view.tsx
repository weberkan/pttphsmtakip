
"use client";

import { useMemo } from 'react';
import type { KanbanCard, AppUser } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, Edit, Flame, Loader, Minus, MoreHorizontal, Signal, AlertTriangle, Trash2 } from 'lucide-react';

// --- Reusable Sub-components ---

const statusConfig = {
    todo: { label: "Yapılacak", icon: AlertTriangle, color: "text-red-500 bg-red-500/10" },
    inProgress: { label: "Devam Ediyor", icon: Loader, color: "text-blue-500 bg-blue-500/10 animate-spin" },
    done: { label: "Tamamlandı", icon: CheckCircle, color: "text-green-500 bg-green-500/10" },
};

const priorityConfig = {
    high: { label: "Yüksek", icon: Flame, color: "text-red-600" },
    medium: { label: "Orta", icon: Signal, color: "text-yellow-600" },
    low: { label: "Düşük", icon: Minus, color: "text-gray-500" },
};

const AvatarStack = ({ uids, allUsers }: { uids: string[], allUsers: AppUser[] }) => {
    const assignedUsers = uids.map(uid => allUsers.find(u => u.uid === uid)).filter(Boolean) as AppUser[];
    if (assignedUsers.length === 0) return <span className="text-muted-foreground italic text-xs">Atanmamış</span>;
    
    const visibleAvatars = assignedUsers.slice(0, 3);
    const hiddenCount = assignedUsers.length - visibleAvatars.length;

    return (
        <TooltipProvider>
            <div className="flex -space-x-2">
                {visibleAvatars.map(user => (
                    <Tooltip key={user.uid}>
                        <TooltipTrigger>
                            <Avatar className="h-7 w-7 border-2 border-background">
                                <AvatarImage src={user.photoUrl || ''} alt={user.firstName} />
                                <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>{user.firstName} {user.lastName}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
                {hiddenCount > 0 && (
                    <Tooltip>
                        <TooltipTrigger>
                            <Avatar className="h-7 w-7 border-2 border-background">
                                <AvatarFallback>+{hiddenCount}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>ve {hiddenCount} diğer kullanıcı</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    );
};


// --- Main Table Component ---

interface TaskListViewProps {
  cards: KanbanCard[];
  allUsers: AppUser[];
  isManager: boolean;
  onUpdateCard: (card: KanbanCard) => void;
  onEditCard: (card: KanbanCard) => void;
  onDeleteCard: (cardId: string) => void;
}

export function TaskListView({ cards, allUsers, isManager, onUpdateCard, onEditCard, onDeleteCard }: TaskListViewProps) {
  const { user: currentUser } = useAuth();

  const sortedCards = useMemo(() => {
    return [...cards].sort((a,b) => {
        const aDate = a.dueDate || a.startDate;
        const bDate = b.dueDate || b.startDate;
        if (aDate && bDate) return new Date(aDate as any).getTime() - new Date(bDate as any).getTime();
        if (aDate) return -1;
        if (bDate) return 1;
        return a.order - b.order;
    });
  }, [cards]);

  if (!currentUser) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Görev Takip Tablosu</CardTitle>
        <CardDescription>Tüm görevlerin listesi, durumları ve detayları.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>Görev Adı</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Başlangıç Tarihi</TableHead>
                <TableHead>Bitiş Tarihi</TableHead>
                <TableHead>Atananlar</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead className="text-right">Aksiyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCards.length > 0 ? sortedCards.map((card, index) => {
                const canPerformAction = isManager || card.assignedUids?.includes(currentUser.uid);
                const { icon: StatusIcon, color: statusColor, label: statusLabel } = statusConfig[card.status];
                const { icon: PriorityIcon, color: priorityColor, label: priorityLabel } = priorityConfig[card.priority || 'low'];

                return (
                  <TableRow key={card.id}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{card.title}</TableCell>
                    <TableCell>
                      <Select
                        value={card.status}
                        onValueChange={(newStatus) => onUpdateCard({ ...card, status: newStatus as KanbanCard['status']})}
                        disabled={!canPerformAction}
                      >
                        <SelectTrigger className={cn("h-8 border-none !bg-transparent p-1 focus:ring-0 focus:ring-offset-0 capitalize", statusColor)}>
                            <SelectValue asChild>
                                <div className='flex items-center gap-2'>
                                    <StatusIcon className={cn("h-4 w-4", card.status === 'inProgress' && 'animate-spin')}/>
                                    {statusLabel}
                                </div>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(statusConfig).map(([key, {label, icon: Icon}]) => (
                                <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4"/>
                                        {label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{card.startDate ? format(new Date(card.startDate as any), 'd MMM yyyy', {locale: tr}) : '-'}</TableCell>
                    <TableCell>{card.dueDate ? format(new Date(card.dueDate as any), 'd MMM yyyy', {locale: tr}) : '-'}</TableCell>
                    <TableCell>
                      {card.assignedUids && <AvatarStack uids={card.assignedUids} allUsers={allUsers} />}
                    </TableCell>
                    <TableCell>
                       <Select
                         value={card.priority}
                         onValueChange={(newPriority) => onUpdateCard({ ...card, priority: newPriority as KanbanCard['priority']})}
                         disabled={!canPerformAction}
                       >
                            <SelectTrigger className="h-8 border-none !bg-transparent p-1 focus:ring-0 focus:ring-offset-0">
                                <SelectValue asChild>
                                     <div className={cn("flex items-center gap-2", priorityColor)}>
                                        <PriorityIcon className="h-4 w-4" />
                                        {priorityLabel}
                                     </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(priorityConfig).map(([key, {label, icon: Icon}]) => (
                                    <SelectItem key={key} value={key}>
                                        <div className="flex items-center gap-2">
                                            <Icon className="h-4 w-4" />
                                            {label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                       </Select>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canPerformAction}>
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => onEditCard(card)}>
                                  <Edit className="mr-2 h-4 w-4" /> Düzenle
                              </DropdownMenuItem>
                              {isManager && (
                                <AlertDialog>
                                    <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="text-destructive focus:text-destructive"
                                        asChild
                                    >
                                        <AlertDialogTrigger className="w-full">
                                            <Trash2 className="mr-2 h-4 w-4" /> Sil
                                        </AlertDialogTrigger>
                                    </DropdownMenuItem>
                                     <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Bu işlem geri alınamaz. "{card.title}" görevini kalıcı olarak silmek istediğinizden emin misiniz?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onDeleteCard(card.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                              )}
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                 <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                       Gösterilecek görev bulunmuyor.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
