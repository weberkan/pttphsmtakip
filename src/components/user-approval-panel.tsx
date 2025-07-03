
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CheckCircle } from 'lucide-react';
import type { AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface UserApprovalPanelProps {
  users: AppUser[];
  onApproveUser: (uid: string) => Promise<void>;
}

export function UserApprovalPanel({ users, onApproveUser }: UserApprovalPanelProps) {
  const { toast } = useToast();
  
  const pendingUsers = useMemo(() => {
    return users
      .filter(user => !user.isApproved)
      .sort((a, b) => (a.email).localeCompare(b.email));
  }, [users]);
  
  const handleApprove = async (user: AppUser) => {
    try {
      await onApproveUser(user.uid);
      toast({
        title: "Kullanıcı Onaylandı",
        description: `${user.firstName} ${user.lastName} (${user.email}) adlı kullanıcının sisteme erişim izni verildi.`
      });
    } catch (error) {
      console.error("Failed to approve user:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kullanıcı onaylanırken bir sorun oluştu."
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bekleyen Kullanıcı Onayları</CardTitle>
        <CardDescription>
          Sisteme yeni kayıt olmuş ve onayınızı bekleyen kullanıcıların listesi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Adı Soyadı</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Sicil Numarası</TableHead>
                <TableHead className="text-right">Aksiyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Onay bekleyen kullanıcı bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                pendingUsers.map(user => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <Badge variant="secondary">{user.registryNumber}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleApprove(user)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Onayla
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
