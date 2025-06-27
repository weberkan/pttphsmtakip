"use client";

import { useState, useEffect } from 'react';
import type { ProvinceData } from '@/lib/turkey-map-data';
import { provinceDataMap } from '@/lib/turkey-map-data';
import { TurkeyMapSvg } from '@/components/turkey-map-svg';
import { ProvinceInfoCard } from '@/components/province-info-card';

export function TurkeyMapInteractive() {
  const [hoveredProvinceId, setHoveredProvinceId] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<ProvinceData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (hoveredProvinceId) {
      setTooltipData(provinceDataMap[hoveredProvinceId] || null);
    } else {
      setTooltipData(null);
    }
  }, [hoveredProvinceId]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="relative w-full h-full" onMouseMove={handleMouseMove}>
      <TurkeyMapSvg 
        onProvinceHover={setHoveredProvinceId}
        hoveredProvinceId={hoveredProvinceId}
      />
      {tooltipData && (
        <div
          className="fixed z-50 pointer-events-none transform translate-x-4 translate-y-4"
          style={{ top: tooltipPosition.y, left: tooltipPosition.x }}
        >
          <ProvinceInfoCard data={tooltipData} />
        </div>
      )}
    </div>
  );
}
