"use client";

import type { ProvinceData } from '@/lib/turkey-map-data';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProvinceInfoCardProps {
  data: ProvinceData;
}

export function ProvinceInfoCard({ data }: ProvinceInfoCardProps) {
  return (
    <Card className="w-48 shadow-lg">
      <CardContent className="p-3 flex flex-col items-center text-center">
        <Image
          src={data.basmudur_foto_url}
          alt={data.basmudur_adi_soyadi}
          width={50}
          height={50}
          className="rounded-full mb-2 border"
          data-ai-hint="person avatar"
          onError={(e) => { 
            const target = e.target as HTMLImageElement;
            target.src = 'https://placehold.co/100x100.png'; 
            target.alt = 'Fotoğraf Yüklenemedi';
          }}
        />
        <p className="font-bold text-sm">{data.basmudur_adi_soyadi}</p>
        <p className="text-xs text-muted-foreground mb-2">Başmüdür</p>
        <Badge
          variant={data.gorev_durumu === 'Asaleten' ? 'asaleten' : 'vekaleten'}
          className="mb-2"
        >
          {data.gorev_durumu}
        </Badge>
        <p className="text-xs text-muted-foreground">
          Görevlendirme: {data.gorevlendirme_tarihi}
        </p>
      </CardContent>
    </Card>
  );
}
