const path = require('path');
const fs = require('fs');

// Load .env.local from the specified directory
function loadEnv(envDir) {
  const envPath = path.join(envDir, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    console.log('Loaded environment from:', envPath);
  } else {
    console.log('.env.local not found at:', envPath);
  }
}

const port = parseInt(process.argv[2] || '3000', 10);
const standaloneDir = process.argv[3] || process.cwd();

console.log('Standalone directory:', standaloneDir);
console.log('Port:', port);

// Load env vars from the standalone directory
loadEnv(standaloneDir);

// Set hostname and port
process.env.HOSTNAME = 'localhost';
process.env.PORT = port.toString();

// The standalone server.js is directly in the standalone directory
const standaloneServer = path.join(standaloneDir, 'server.js');

if (fs.existsSync(standaloneServer)) {
  console.log('Starting standalone server from:', standaloneServer);
  console.log('Directory contents:', fs.readdirSync(standaloneDir));
  
  // Change to standalone directory so Next.js can find its files
  process.chdir(standaloneDir);
  
  // Require the standalone server
  try {
    require(standaloneServer);
  } catch (error) {
    console.error('Failed loading standalone server:', error);
    process.exit(1);
  }
  
  // Signal ready after a short delay
  setTimeout(() => {
    if (process.send) {
      process.send('ready');
    }
  }, 2000);
} else {
  console.error('Standalone server not found at:', standaloneServer);
  console.log('Available in standaloneDir:', fs.readdirSync(standaloneDir));
  process.exit(1);
}
