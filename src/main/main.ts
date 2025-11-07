import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'node:path';
import {
  commit,
  discardChanges,
  getDiff,
  getStatus,
  getRepositoryRoot,
  stageAll,
  stageFiles,
  setRepositoryRoot,
  unstageAll,
  unstageFiles
} from './git';

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
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
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

async function getRepositoryInfo() {
  const path = await getRepositoryRoot();
  return path ? { path } : null;
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
  ipcMain.handle('repo:getCurrent', () => getRepositoryInfo());
  ipcMain.handle('repo:select', async () => {
    const browserWindow = BrowserWindow.getFocusedWindow() ?? mainWindow ?? undefined;
    const dialogOptions: Electron.OpenDialogOptions = {
      title: 'Gitリポジトリを選択',
      properties: ['openDirectory']
    };
    const dialogResult = browserWindow
      ? await dialog.showOpenDialog(browserWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);
    const { canceled, filePaths } = dialogResult;

    if (canceled || !filePaths.length) {
      return getRepositoryInfo();
    }

    try {
      const repoPath = await setRepositoryRoot(filePaths[0]);
      return { path: repoPath };
    } catch (error) {
      const message = error instanceof Error ? error.message : '選択したフォルダーはGitリポジトリではありません。';
      throw new Error(`Gitリポジトリを特定できませんでした: ${message}`);
    }
  });
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
