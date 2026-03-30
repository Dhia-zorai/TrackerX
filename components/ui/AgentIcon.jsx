'use client';

import Image from 'next/image';
import { getAgentAsset } from '@/lib/assetMappings';
import { capitalizeAgent } from '@/lib/utils';

/**
 * AgentIcon component - Displays agent portrait with fallback to text
 * 
 * @param {string} agentName - Agent name from API (any case/format)
 * @param {number} size - Width/height in pixels (default: 32)
 * @param {string} className - Additional Tailwind classes
 * @param {boolean} showName - Show name as text fallback (default: false)
 */
export function AgentIcon({ agentName, size = 32, className = '', showName = false }) {
  const assetPath = getAgentAsset(agentName);
  
  // Fallback to text if no asset found
  if (!assetPath) {
    return showName ? (
      <span className={className}>{capitalizeAgent(agentName)}</span>
    ) : null;
  }
  
  return (
    <Image
      src={assetPath}
      width={size}
      height={size}
      alt={capitalizeAgent(agentName)}
      className={className}
      unoptimized
    />
  );
}
