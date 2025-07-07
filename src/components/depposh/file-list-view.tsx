
"use client";

import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type { DepposhFile, DepposhFileCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UploadCloud, File as FileIcon, Trash2, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
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
    addFile: (file: File, category: DepposhFileCategory) => Promise<void>;
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
    const [isUploading, setIsUploading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setIsUploading(true);
        try {
            await Promise.all(acceptedFiles.map(file => addFile(file, category)));
            toast({ title: `${acceptedFiles.length} dosya başarıyla yüklendi.` });
        } catch (error) {
            console.error("File upload error:", error);
            toast({ variant: "destructive", title: "Yükleme Hatası", description: "Dosyalar yüklenirken bir sorun oluştu."});
        } finally {
            setIsUploading(false);
        }
    }, [addFile, category, toast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, disabled: isUploading });

    const categoryFiles = useMemo(() => 
        allFiles.filter(f => f.category === category).sort((a,b) => a.order - b.order)
    , [allFiles, category]);

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
                        isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                        isUploading && "cursor-not-allowed opacity-50"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                       {isUploading ? (
                           <>
                               <Loader2 className="h-10 w-10 animate-spin" />
                               <p className="font-semibold">Dosyalar Yükleniyor...</p>
                           </>
                       ) : (
                           <>
                                <UploadCloud className="h-10 w-10" />
                                <p className="font-semibold">Dosyaları buraya sürükleyin veya seçmek için tıklayın</p>
                           </>
                       )}
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Sıra</TableHead>
                                <TableHead>Dosya Adı</TableHead>
                                <TableHead className="text-right w-[100px]">Aksiyon</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categoryFiles.length > 0 ? (
                                categoryFiles.map((file, index) => (
                                    <TableRow key={file.id}>
                                        <TableCell className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateFileOrder(file, 'up')} disabled={index === 0}>
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateFileOrder(file, 'down')} disabled={index === categoryFiles.length - 1}>
                                                <ArrowDown className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <a 
                                                href={file.downloadUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                download={file.name}
                                                className="flex items-center gap-2 hover:underline"
                                            >
                                                <FileIcon className="h-4 w-4 text-muted-foreground" />
                                                {file.name}
                                            </a>
                                        </TableCell>
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
                                    <TableCell colSpan={3} className="h-24 text-center">
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
