'use client';

import Image from 'next/image';
import { Shield } from 'lucide-react';
import { getRankAsset } from '@/lib/rankMappings';

/**
 * RankIcon component - Displays competitive tier (rank) icon with fallback
 * 
 * @param {string} tierName - Rank tier name from API (e.g., "Gold 3", "Radiant", "Unranked")
 * @param {number} size - Width/height in pixels (default: 32)
 * @param {string} className - Additional Tailwind classes
 * @param {boolean} grayscale - Apply grayscale filter (for peak rank display)
 */
export function RankIcon({ tierName, size = 32, className = '', grayscale = false }) {
  const assetPath = getRankAsset(tierName);
  
  // Fallback to Shield icon if no asset found
  if (!assetPath) {
    return (
      <Shield 
        size={size * 0.6} 
        className={className}
        style={{ color: 'var(--text-muted)' }}
      />
    );
  }
  
  return (
    <Image
      src={assetPath}
      width={size}
      height={size}
      alt={tierName || 'Rank'}
      className={`${className} ${grayscale ? 'grayscale-[30%]' : ''}`}
      unoptimized
    />
  );
}
