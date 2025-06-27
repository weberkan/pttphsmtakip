
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { turkeyMapPaths } from '@/lib/turkey-map-paths';
import type { TasraChiefInfo } from '@/lib/tasra-data';
import { cn } from '@/lib/utils';

interface TurkeyMapProps {
  data: TasraChiefInfo[];
}

export function TurkeyMap({ data }: TurkeyMapProps) {
  const [tooltipData, setTooltipData] = useState<{
    province: TasraChiefInfo;
    x: number;
    y: number;
  } | null>(null);

  const provinceDataMap = new Map(data.map(p => [p.provinceId, p]));

  const handleMouseMove = (e: React.MouseEvent, provinceInfo: TasraChiefInfo) => {
    setTooltipData({
      province: provinceInfo,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseLeave = () => {
    setTooltipData(null);
  };
  
  return (
    <div className="relative w-full" style={{ paddingBottom: '44%' /* Aspect ratio from viewBox: 440 / 1000 */ }}>
      <div className="absolute inset-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1000 440"
          aria-label="Türkiye Haritası"
          className="w-full h-full"
        >
          <g>
            {Object.entries(turkeyMapPaths).map(([id, pathData]) => {
              const provinceInfo = provinceDataMap.get(id);
              const isHoverable = !!provinceInfo;
              const isHovered = tooltipData?.province.provinceId === id;

              return (
                <path
                  key={id}
                  id={id}
                  d={pathData.d}
                  className={cn(
                    'stroke-background stroke-[0.5] transition-colors duration-200',
                    isHoverable
                      ? 'fill-muted-foreground/30 hover:fill-primary/80 cursor-pointer'
                      : 'fill-muted/50 pointer-events-none',
                    isHovered && '!fill-primary'
                  )}
                  onMouseMove={(e) => provinceInfo && handleMouseMove(e, provinceInfo)}
                  onMouseLeave={handleMouseLeave}
                >
                  <title>{pathData.name}</title>
                </path>
              );
            })}
          </g>
        </svg>
      </div>

      {tooltipData && (
        <div
          className="pointer-events-none fixed z-50 transform -translate-x-1/2 -translate-y-[110%] rounded-lg bg-card p-2 shadow-lg border animate-in fade-in-0 zoom-in-95"
          style={{
            left: tooltipData.x,
            top: tooltipData.y,
          }}
        >
          <div className="flex items-center gap-3">
            <Image
              src={tooltipData.province.chiefPhotoUrl}
              alt={tooltipData.province.chiefName}
              width={50}
              height={50}
              className="rounded-full object-cover border-2 border-primary"
              data-ai-hint="person avatar"
            />
            <div>
              <p className="font-bold text-base text-foreground">{tooltipData.province.provinceName}</p>
              <p className="text-sm text-muted-foreground">{tooltipData.province.chiefName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
