/**
 * Prepare standalone build for Electron packaging
 * 
 * Next.js standalone output needs additional files:
 * 1. public/ folder - static assets
 * 2. .next/static/ - client-side JS/CSS
 * 3. .env.local - environment variables with API keys
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const standaloneDir = path.join(rootDir, '.next', 'standalone');

// Helper to copy directory recursively
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Source not found: ${src}`);
    return;
  }
  
  fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Helper to copy file
function copyFileSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Source file not found: ${src}`);
    return;
  }
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${src} -> ${dest}`);
}

console.log('Preparing standalone build for Electron...');
console.log('Root directory:', rootDir);
console.log('Standalone directory:', standaloneDir);

// Check if standalone exists
if (!fs.existsSync(standaloneDir)) {
  console.error('ERROR: Standalone directory not found!');
  console.error('Run "npm run build" first to generate the standalone output.');
  process.exit(1);
}

// 1. Copy public/ to standalone/public/
const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(standaloneDir, 'public');
console.log('\nCopying public/ folder...');
copyDirSync(publicSrc, publicDest);
console.log('Done: public/');

// 2. Copy .next/static/ to standalone/.next/static/
const staticSrc = path.join(rootDir, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
console.log('\nCopying .next/static/ folder...');
copyDirSync(staticSrc, staticDest);
console.log('Done: .next/static/');

// 3. Copy .env.local to standalone/
const envSrc = path.join(rootDir, '.env.local');
const envDest = path.join(standaloneDir, '.env.local');
console.log('\nCopying .env.local...');
copyFileSync(envSrc, envDest);

console.log('\nStandalone build prepared successfully!');
console.log('Contents:', fs.readdirSync(standaloneDir));
