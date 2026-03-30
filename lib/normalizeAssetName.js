/**
 * Normalize agent/map names to consistent lowercase keys for asset lookups
 * 
 * Examples:
 * - "Killjoy" → "killjoy"
 * - "KAY/O" → "kayo"
 * - "The Range" → "therange"
 * - "Bind" → "bind"
 */
export function normalizeAssetName(name) {
  if (!name) return 'unknown';
  
  return name
    .toLowerCase()
    .replace(/\s+/g, '')         // Remove spaces: "The Range" → "therange"
    .replace(/[\/\\]/g, '')       // Remove slashes: "KAY/O" → "kayo"
    .replace(/[^a-z0-9]/g, '');   // Remove special chars
}
