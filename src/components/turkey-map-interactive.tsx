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
    // Adjust the position to be slightly offset from the cursor
    setTooltipPosition({ x: e.clientX + 15, y: e.clientY + 15 });
  };

  return (
    <div className="relative w-full h-full" onMouseMove={handleMouseMove}>
      <TurkeyMapSvg 
        onProvinceHover={setHoveredProvinceId}
        hoveredProvinceId={hoveredProvinceId}
      />
      {tooltipData && (
        <div
          className="fixed z-50 pointer-events-none transform"
          style={{ 
            top: tooltipPosition.y, 
            left: tooltipPosition.x,
            // Ensure the tooltip doesn't go off-screen
            transform: `translate(-50%, -50%)`,
          }}
        >
          <ProvinceInfoCard data={tooltipData} />
        </div>
      )}
    </div>
  );
}
