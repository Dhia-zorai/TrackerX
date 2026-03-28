const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { fork } = require('child_process');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try {
  if (require.resolve('electron-squirrel-startup') && require('electron-squirrel-startup')) {
    app.quit();
  }
} catch (e) {
  // electron-squirrel-startup not installed, skip
}

let mainWindow;
let nextServer;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PORT = process.env.PORT || 3000;

// Resolve the path to Next standalone output across packaging layouts
function getStandalonePath() {
  if (app.isPackaged) {
    const candidates = [
      path.join(process.resourcesPath, 'standalone'),
      path.join(process.resourcesPath, 'app', 'standalone'),
      path.join(process.resourcesPath, 'app', '.next', 'standalone'),
    ];

    const found = candidates.find((dir) => fs.existsSync(path.join(dir, 'server.js')));
    return found || candidates[0];
  }

  // In development, it's at .next/standalone
  return path.join(__dirname, '..', '.next', 'standalone');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../public/icon.png'),
    titleBarStyle: 'default',
    backgroundColor: '#0a0a0a',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const url = `http://localhost:${PORT}`;
  
  // Retry loading URL until server is ready
  const loadWithRetry = (retries = 30) => {
    mainWindow.loadURL(url).catch((err) => {
      if (retries > 0) {
        setTimeout(() => loadWithRetry(retries - 1), 500);
      } else {
        console.error('Failed to load URL after retries:', err);
      }
    });
  };
  
  loadWithRetry();

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startNextServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      resolve();
      return;
    }

    const standaloneDir = getStandalonePath();
    const serverScript = path.join(__dirname, 'server.js');
    
    if (!fs.existsSync(path.join(standaloneDir, 'server.js'))) {
      reject(new Error(`Standalone server.js not found in: ${standaloneDir}`));
      return;
    }

    console.log('Starting server with standaloneDir:', standaloneDir);
    console.log('Server script:', serverScript);

    let settled = false;

    nextServer = fork(serverScript, [PORT.toString(), standaloneDir], {
      env: { ...process.env, PORT: PORT.toString() },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });

    nextServer.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
    });

    nextServer.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });

    nextServer.on('message', (msg) => {
      if (msg === 'ready') {
        settled = true;
        console.log('Server ready!');
        resolve();
      }
    });

    nextServer.on('error', (err) => {
      settled = true;
      console.error('Failed to start server:', err);
      reject(err);
    });

    nextServer.on('exit', (code) => {
      if (!settled) {
        settled = true;
        reject(new Error(`Next server process exited early with code ${code}`));
      }
    });

    setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Timed out waiting for Next server to become ready'));
      }
    }, 20000);
  });
}

app.whenReady().then(async () => {
  try {
    await startNextServer();
    createWindow();
  } catch (err) {
    console.error('Failed to start application:', err);
    dialog.showErrorBox(
      'TrackerX Startup Error',
      `TrackerX failed to start the internal server.\n\n${err.message}`
    );
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (nextServer) {
    nextServer.kill();
  }
});
