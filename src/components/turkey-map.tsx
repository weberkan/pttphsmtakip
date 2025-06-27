"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { cn } from '@/lib/utils';
import type { TasraChiefInfo } from '@/lib/tasra-data';
import geoData from '@/lib/turkey-geojson';

interface TurkeyMapProps {
  data: TasraChiefInfo[];
}

export function TurkeyMap({ data }: TurkeyMapProps) {
  const [tooltipData, setTooltipData] = useState<{
    province: TasraChiefInfo;
    x: number;
    y: number;
  } | null>(null);

  const provinceDataMap = new Map(data.map(p => [p.provinceName, p]));

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
  
  // This wrapper div uses a robust aspect-ratio technique to ensure the map scales correctly.
  return (
    <div data-testid="turkey-map" className="relative w-full" style={{ paddingTop: '50%' /* Aspect ratio w:100, h:50 */ }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          rotate: [-35.5, -39.3, 0],
          scale: 2800
        }}
        className="absolute top-0 left-0 w-full h-full"
      >
        <Geographies geography={geoData}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const provinceName = geo.properties.name;
              const provinceInfo = provinceDataMap.get(provinceName);
              const isHovered = tooltipData?.province.provinceName === provinceName;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) => {
                    if (provinceInfo) {
                      handleMouseMove(e, provinceInfo);
                    }
                  }}
                  onMouseLeave={handleMouseLeave}
                  className={cn(
                    'outline-none transition-colors duration-200',
                    // HIGHLY VISIBLE COLORS
                    'stroke-white', // Use white for borders, will show on dark fills
                    provinceInfo
                      ? 'fill-primary/50 hover:fill-primary/80 cursor-pointer'
                      : 'fill-muted-foreground/40 pointer-events-none',
                    isHovered && '!fill-primary'
                  )}
                  style={{ strokeWidth: 0.5 }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

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
