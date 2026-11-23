import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { registerIpcHandlers } from './ipcHandlers';
import { getDatabaseAdapter, type IDatabaseAdapter } from '../src/database';

// Load environment variables from .env
dotenv.config({ path: app.isPackaged ? path.join(app.getPath('userData'), '.env') : undefined, quiet: true });
let adapter: IDatabaseAdapter | undefined;

const isDev = process.env.DATA_ADAPTER !== 'postgres' && (process.env.NODE_ENV === 'development' || !app.isPackaged);

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  // Find preload.js (handles both direct outDir and nested electron outDir)
  const preloadDirect = path.join(__dirname, 'preload.js');
  const preloadNested = path.join(__dirname, 'electron', 'preload.js');
  const preloadPath = fs.existsSync(preloadDirect) ? preloadDirect : preloadNested;

  // Find icon
  const iconCandidate = path.resolve(__dirname, '../../client/public/icon.png');
  const iconPath = fs.existsSync(iconCandidate) ? iconCandidate : undefined;

  mainWindow = new BrowserWindow({
    title: 'BestBuy',
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
    ...(iconPath ? { icon: iconPath } : {}),
  });

  mainWindow.webContents.on('will-navigate', event => event.preventDefault());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (isDev && !process.env.ELECTRON_START_URL) {
    // Try local Vite dev server
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      // Fallback to static dist if dev server is not running
      loadStaticIndex();
    });
  } else {
    loadStaticIndex();
  }

  function loadStaticIndex() {
    const candidates = [
      path.resolve(__dirname, '../../client/dist/index.html'),
      path.resolve(__dirname, '../client/dist/index.html'),
      path.resolve(app.getAppPath(), 'client/dist/index.html'),
    ];
    const target = candidates.find(p => fs.existsSync(p));
    if (target && mainWindow) {
      mainWindow.loadFile(target);
    } else {
      console.warn('[Electron Main] Could not locate index.html, waiting or loading default');
    }
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    adapter = getDatabaseAdapter();
    await adapter.connect();
    registerIpcHandlers(ipcMain, adapter);
  } catch {
    dialog.showErrorBox('BestBuy database unavailable', 'Check the database configuration and apply the BestBuy schema before starting.');
    app.quit();
    return;
  }
  createWindow();

  if (process.env.TEST_BOOT === 'true') {
    console.log('[BestBuy Desktop Engine] Boot verification successful!');
    setTimeout(() => {
      app.quit();
    }, 1000);
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

app.on('before-quit', () => { void adapter?.disconnect().catch(() => undefined); });
