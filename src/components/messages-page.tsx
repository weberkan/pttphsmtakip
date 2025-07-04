
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useUserManagement } from '@/hooks/use-user-management';
import { useMessaging } from '@/hooks/use-messaging';
import type { AppUser, Conversation, Message } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send, MessageSquare, Users, User, ArrowLeft, Search } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card } from './ui/card';

export function MessagesPage() {
    const { user: currentUser } = useAuth();
    const { users, isInitialized: usersInitialized } = useUserManagement();
    const { messages, loadingMessages, listenToMessages, sendMessage, startConversation } = useMessaging();
    
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const messageEndRef = useRef<HTMLDivElement>(null);
    const [isStartingConversation, setIsStartingConversation] = useState(false);
    
    const allOtherUsers = useMemo(() => 
        users.filter(u => u.uid !== currentUser?.uid)
             .sort((a,b) => {
                // Sort by presence first (online users on top), then by name
                if (a.presence === 'online' && b.presence !== 'online') return -1;
                if (a.presence !== 'online' && b.presence === 'online') return 1;
                return a.firstName.localeCompare(b.firstName);
             }), 
    [users, currentUser]);

    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        if (!activeConversationId) return;
        const unsubscribe = listenToMessages(activeConversationId);
        return () => unsubscribe();
    }, [activeConversationId, listenToMessages]);

    const handleSelectUser = async (user: AppUser) => {
        if (!currentUser || user.uid === selectedUser?.uid) return;
        setIsStartingConversation(true);
        setSelectedUser(user);
        setActiveConversationId(null);
        try {
            const convId = await startConversation(user);
            setActiveConversationId(convId);
        } catch (error) {
            console.error("Failed to start conversation", error);
        } finally {
            setIsStartingConversation(false);
        }
    };
    
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && activeConversationId) {
            sendMessage(activeConversationId, newMessage);
            setNewMessage("");
        }
    };

    if (!usersInitialized) {
        return (
             <Card className="h-full w-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 shadow-lg overflow-hidden">
                <div className="border-r flex flex-col bg-muted/20">
                     <div className="p-4 border-b">
                        <Skeleton className="h-7 w-2/4 mb-4" />
                        <Skeleton className="h-9 w-full" />
                    </div>
                     <div className="flex-1 p-3 space-y-2">
                        {[...Array(8)].map((_, i) => (
                           <div key={i} className="flex items-center gap-3 p-2">
                               <Skeleton className="h-10 w-10 rounded-full" />
                               <div className="flex-1 space-y-1">
                                   <Skeleton className="h-4 w-3/4" />
                                   <Skeleton className="h-3 w-full" />
                               </div>
                           </div>
                        ))}
                    </div>
                </div>
                 <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-muted-foreground bg-background md:col-span-2 lg:col-span-3">
                    <MessageSquare className="h-16 w-16 mb-4 animate-pulse" />
                    <h3 className="text-xl font-semibold">Yükleniyor...</h3>
                    <p>Mesajlar ve kişiler hazırlanıyor.</p>
                </div>
            </Card>
        );
    }

    const UserListPanel = (
        <div className={cn("border-r flex flex-col bg-muted/20", selectedUser ? "hidden md:flex" : "flex")}>
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2"><Users className="h-6 w-6"/> Kişiler</h2>
            </div>
            <ScrollArea className="flex-1">
                 <div className="flex flex-col gap-1 p-2">
                    {allOtherUsers.length > 0 ? allOtherUsers.map(user => (
                        <button
                            key={user.uid}
                            onClick={() => handleSelectUser(user)}
                            className={cn(
                                "w-full text-left justify-start h-auto shrink-0 gap-3 rounded-md p-2 flex items-center transition-colors",
                                "hover:bg-accent focus-visible:bg-accent outline-none",
                                selectedUser?.uid === user.uid ? "bg-accent" : ""
                            )}
                        >
                            <Avatar className="h-10 w-10 relative">
                                <AvatarImage src={user.photoUrl || ''} alt={user.firstName} />
                                <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
                                {user.presence && (
                                     <span className={cn(
                                        "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background",
                                        user.presence === 'online' ? "bg-green-500" : "bg-gray-400"
                                    )} />
                                )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                        </button>
                    )) : (
                        <p className="p-4 text-center text-sm text-muted-foreground">Sistemde başka kullanıcı bulunamadı.</p>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
    
    const ChatPanel = (
        <div className={cn("md:col-span-2 lg:col-span-3 flex flex-col", selectedUser ? "flex" : "hidden md:flex")}>
            {selectedUser ? (
                <>
                    <div className="p-3 border-b flex items-center gap-3">
                         <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedUser(null)}>
                            <ArrowLeft />
                         </Button>
                         <Avatar className="h-10 w-10 relative">
                            <AvatarImage src={selectedUser.photoUrl || ''} />
                            <AvatarFallback>{selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}</AvatarFallback>
                             {selectedUser.presence && (
                                <span className={cn(
                                    "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background",
                                    selectedUser.presence === 'online' ? "bg-green-500" : "bg-gray-400"
                                )} />
                            )}
                        </Avatar>
                        <div>
                            <h3 className="text-lg font-bold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                            <p className="text-xs text-muted-foreground">{selectedUser.presence === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}</p>
                        </div>
                    </div>
                    <ScrollArea className="flex-1 p-4 bg-background">
                        <div className="space-y-4">
                        {(loadingMessages || isStartingConversation) ? (
                            <div className="flex justify-center items-center h-full"><p>Sohbet yükleniyor...</p></div>
                        ) : messages.length === 0 ? (
                            <div className="flex justify-center items-center h-full"><p className="text-muted-foreground">Henüz mesaj yok. Bir merhaba de!</p></div>
                        ) : (
                            messages.map((msg) => (
                            <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === currentUser?.uid ? "justify-end" : "justify-start")}>
                                {msg.senderId !== currentUser?.uid && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={selectedUser.photoUrl || ''} />
                                        <AvatarFallback>{selectedUser.firstName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn("max-w-[80%] lg:max-w-[65%] rounded-xl p-2 px-3 text-sm", msg.senderId === currentUser?.uid ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card border rounded-bl-none")}>
                                    <p className="break-words">{msg.text}</p>
                                    <p className={cn("text-xs mt-1 text-right", msg.senderId === currentUser?.uid ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                        {format(new Date(msg.timestamp as any), 'HH:mm')}
                                    </p>
                                </div>
                            </div>
                            ))
                        )}
                         <div ref={messageEndRef} />
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t bg-muted/20">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <Input 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Bir mesaj yazın..." 
                                autoComplete='off'
                                className="flex-1"
                            />
                            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                                <Send />
                            </Button>
                        </form>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground bg-background">
                    <MessageSquare className="h-16 w-16 mb-4" />
                    <h3 className="text-xl font-semibold">Mesajlaşmaya Başlayın</h3>
                    <p>Sohbet etmek için sol taraftan bir kişi seçin.</p>
                </div>
            )}
        </div>
    );
    
    return (
        <Card className="h-full w-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 shadow-lg overflow-hidden">
            {UserListPanel}
            {ChatPanel}
        </Card>
    );
}
