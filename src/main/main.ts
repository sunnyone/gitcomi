import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import {
  commit,
  discardChanges,
  getDiff,
  getStatus,
  stageAll,
  stageFiles,
  unstageAll,
  unstageFiles
} from './git';

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 720,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

function registerIpcHandlers() {
  ipcMain.handle('git:getStatus', async () => getStatus());
  ipcMain.handle('git:stageFiles', async (_event, paths: string[]) => stageFiles(paths));
  ipcMain.handle('git:unstageFiles', async (_event, paths: string[]) => unstageFiles(paths));
  ipcMain.handle('git:stageAll', async () => stageAll());
  ipcMain.handle('git:unstageAll', async () => unstageAll());
  ipcMain.handle('git:getDiff', async (_event, payload: { path: string; staged: boolean; isUntracked?: boolean }) =>
    getDiff(payload)
  );
  ipcMain.handle('git:commit', async (_event, message: string) => commit(message));
  ipcMain.handle('git:discardChanges', async (_event, payload: { path: string; isUntracked?: boolean }) =>
    discardChanges(payload)
  );
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

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
