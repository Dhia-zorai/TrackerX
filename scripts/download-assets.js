/**
 * Download Valorant agent and map assets from valorant-api.com
 * 
 * This script:
 * 1. Fetches agent and map data from Valorant API
 * 2. Downloads their images locally to public/assets/
 * 3. Auto-generates lib/assetMappings.js with asset paths
 * 
 * Usage: npm run download:assets
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Import normalization function (CommonJS require for Node script)
const normalizeAssetNameModule = path.join(__dirname, '../lib/normalizeAssetName.js');
let normalizeAssetName;

// Try to load ES module or define fallback
try {
  // For ES modules, we need to use dynamic import (not available in sync context)
  // So we'll define it inline for the script
  normalizeAssetName = (name) => {
    if (!name) return 'unknown';
    return name
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[\/\\]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };
} catch (err) {
  console.error('Error loading normalization function:', err);
  process.exit(1);
}

const ROOT_DIR = path.join(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'public', 'assets');
const AGENTS_DIR = path.join(ASSETS_DIR, 'agents');
const MAPS_DIR = path.join(ASSETS_DIR, 'maps');
const MAPPINGS_FILE = path.join(ROOT_DIR, 'lib', 'assetMappings.js');

const AGENTS_API = 'https://valorant-api.com/v1/agents?isPlayableCharacter=true';
const MAPS_API = 'https://valorant-api.com/v1/maps';

// Create directories if they don't exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
}

// Fetch JSON from URL
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Download file from URL
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

// Download agents
async function downloadAgents() {
  console.log('\n📥 Fetching agents from Valorant API...');
  
  try {
    const response = await fetchJSON(AGENTS_API);
    const agents = response.data;
    
    console.log(`✓ Found ${agents.length} playable agents`);
    
    const agentMappings = {};
    let downloadCount = 0;
    let skipCount = 0;
    
    for (const agent of agents) {
      const { displayName, displayIcon } = agent;
      
      // Skip agents with null displayIcon
      if (!displayIcon) {
        console.log(`  ⊘ Skipping ${displayName} (no icon)`);
        skipCount++;
        continue;
      }
      
      const normalizedName = normalizeAssetName(displayName);
      const fileName = `${normalizedName}.png`;
      const filePath = path.join(AGENTS_DIR, fileName);
      
      try {
        await downloadFile(displayIcon, filePath);
        agentMappings[normalizedName] = `/assets/agents/${fileName}`;
        console.log(`  ✓ Downloaded: ${displayName} → ${fileName}`);
        downloadCount++;
      } catch (err) {
        console.error(`  ✗ Failed to download ${displayName}:`, err.message);
      }
    }
    
    console.log(`\n✓ Downloaded ${downloadCount} agent icons (skipped ${skipCount})`);
    return agentMappings;
    
  } catch (err) {
    console.error('✗ Error fetching agents:', err);
    throw err;
  }
}

// Download maps
async function downloadMaps() {
  console.log('\n📥 Fetching maps from Valorant API...');
  
  try {
    const response = await fetchJSON(MAPS_API);
    const maps = response.data;
    
    console.log(`✓ Found ${maps.length} maps`);
    
    const mapMappings = {};
    let downloadCount = 0;
    
    for (const map of maps) {
      const { displayName, splash } = map;
      
      // Skip maps with null splash
      if (!splash) {
        console.log(`  ⊘ Skipping ${displayName} (no splash image)`);
        continue;
      }
      
      const normalizedName = normalizeAssetName(displayName);
      const fileName = `${normalizedName}.png`;
      const filePath = path.join(MAPS_DIR, fileName);
      
      try {
        await downloadFile(splash, filePath);
        mapMappings[normalizedName] = `/assets/maps/${fileName}`;
        console.log(`  ✓ Downloaded: ${displayName} → ${fileName}`);
        downloadCount++;
      } catch (err) {
        console.error(`  ✗ Failed to download ${displayName}:`, err.message);
      }
    }
    
    console.log(`\n✓ Downloaded ${downloadCount} map images`);
    return mapMappings;
    
  } catch (err) {
    console.error('✗ Error fetching maps:', err);
    throw err;
  }
}

// Generate assetMappings.js file
function generateMappingsFile(agentMappings, mapMappings) {
  console.log('\n📝 Generating asset mappings file...');
  
  const agentEntries = Object.entries(agentMappings)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `  ${key}: "${value}"`)
    .join(',\n');
  
  const mapEntries = Object.entries(mapMappings)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `  ${key}: "${value}"`)
    .join(',\n');
  
  const content = `/**
 * Auto-generated by scripts/download-assets.js
 * Do not edit manually - re-run script to update
 * 
 * Asset mappings for Valorant agents and maps
 */

import { normalizeAssetName } from './normalizeAssetName';

export const agentAssets = {
${agentEntries}
};

export const mapAssets = {
${mapEntries}
};

/**
 * Get agent asset path by agent name
 * @param {string} agentName - Agent name (any case/format)
 * @returns {string|null} Asset path or null if not found
 */
export function getAgentAsset(agentName) {
  if (!agentName) return null;
  const normalized = normalizeAssetName(agentName);
  return agentAssets[normalized] || null;
}

/**
 * Get map asset path by map name
 * @param {string} mapName - Map name (any case/format)
 * @returns {string|null} Asset path or null if not found
 */
export function getMapAsset(mapName) {
  if (!mapName) return null;
  const normalized = normalizeAssetName(mapName);
  return mapAssets[normalized] || null;
}
`;
  
  fs.writeFileSync(MAPPINGS_FILE, content, 'utf8');
  console.log(`✓ Generated: ${MAPPINGS_FILE}`);
  console.log(`  - ${Object.keys(agentMappings).length} agent mappings`);
  console.log(`  - ${Object.keys(mapMappings).length} map mappings`);
}

// Main execution
async function main() {
  console.log('🎮 Valorant Asset Downloader');
  console.log('================================\n');
  
  // Ensure directories exist
  ensureDir(ASSETS_DIR);
  ensureDir(AGENTS_DIR);
  ensureDir(MAPS_DIR);
  
  try {
    // Download assets
    const agentMappings = await downloadAgents();
    const mapMappings = await downloadMaps();
    
    // Generate mappings file
    generateMappingsFile(agentMappings, mapMappings);
    
    console.log('\n✅ Asset download complete!\n');
    console.log('Next steps:');
    console.log('  1. (Optional) Convert images to WebP for better performance');
    console.log('  2. Assets are ready to use in your components');
    console.log('  3. Import from: lib/assetMappings.js\n');
    
  } catch (err) {
    console.error('\n❌ Asset download failed:', err);
    process.exit(1);
  }
}

// Run the script
main();
