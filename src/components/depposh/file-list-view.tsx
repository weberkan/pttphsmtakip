
"use client";

import { useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import type { DepposhFile, DepposhFileCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UploadCloud, File as FileIcon, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FileListViewProps {
    category: DepposhFileCategory;
    files: DepposhFile[];
    addFile: (fileData: Omit<DepposhFile, 'id' | 'order' | 'downloadUrl'>) => void;
    deleteFile: (fileId: string) => void;
    updateFileOrder: (fileToMove: DepposhFile, direction: 'up' | 'down') => void;
}

const categoryTitles = {
    taslak: "Taslak Dosyalar",
    matbu: "Matbu Dosyalar",
    güncel: "Güncel Dosyalar",
    mevzuat: "Mevzuat Dosyaları",
};

export function FileListView({ category, files: allFiles, addFile, deleteFile, updateFileOrder }: FileListViewProps) {
    const { toast } = useToast();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach(file => {
            addFile({
                name: file.name,
                type: file.type,
                size: file.size,
                category: category,
            });
        });
        toast({ title: `${acceptedFiles.length} dosya eklendi.` });
    }, [addFile, category, toast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const categoryFiles = useMemo(() => 
        allFiles.filter(f => f.category === category).sort((a,b) => a.order - b.order)
    , [allFiles, category]);

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{categoryTitles[category]}</CardTitle>
                <CardDescription>Bu bölüme ait dosyaları yönetin. Dosyaları sürükleyip bırakarak veya butona tıklayarak yükleyebilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div 
                    {...getRootProps()} 
                    className={cn(
                        "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                        isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <UploadCloud className="h-10 w-10" />
                        <p className="font-semibold">Dosyaları buraya sürükleyin veya seçmek için tıklayın</p>
                        <p className="text-xs">
                            Bu, dosyalarınızı gerçekte bir sunucuya yüklemez, yalnızca metadatalarını kaydeder.
                        </p>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60px]">Sıra</TableHead>
                                <TableHead>Dosya Adı</TableHead>
                                <TableHead>Tür</TableHead>
                                <TableHead>Boyut</TableHead>
                                <TableHead>Yüklenme Tarihi</TableHead>
                                <TableHead className="text-right">Aksiyon</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categoryFiles.length > 0 ? (
                                categoryFiles.map((file, index) => (
                                    <TableRow key={file.id}>
                                        <TableCell className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateFileOrder(file, 'up')} disabled={index === 0}>
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateFileOrder(file, 'down')} disabled={index === categoryFiles.length - 1}>
                                                <ArrowDown className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                                            {file.name}
                                        </TableCell>
                                        <TableCell>{file.type}</TableCell>
                                        <TableCell>{formatFileSize(file.size)}</TableCell>
                                        <TableCell>{file.lastModifiedAt ? format(new Date(file.lastModifiedAt as any), 'dd.MM.yyyy HH:mm') : 'Bilinmiyor'}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Dosyayı Sil</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                           Bu işlem geri alınamaz. "{file.name}" dosyasını kalıcı olarak silmek istediğinizden emin misiniz?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteFile(file.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Bu kategoride dosya bulunmuyor.
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
