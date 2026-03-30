'use client';

import Image from 'next/image';
import { getMapAsset } from '@/lib/assetMappings';

/**
 * MapImage component - Displays map splash image with fallback to text
 * 
 * @param {string} mapName - Map name from API (any case/format)
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {string} className - Additional Tailwind classes
 * @param {boolean} showName - Show name as text fallback (default: true)
 */
export function MapImage({ mapName, width, height, className = '', showName = true }) {
  const assetPath = getMapAsset(mapName);
  
  // Fallback to text if no asset found
  if (!assetPath) {
    return showName ? (
      <span className={className}>{mapName}</span>
    ) : null;
  }
  
  return (
    <Image
      src={assetPath}
      width={width}
      height={height}
      alt={mapName}
      className={className}
      unoptimized
    />
  );
}
