import { contextBridge, ipcRenderer } from 'electron';
import type { GitCommitResult, GitDiffPayload, GitStatusPayload } from 'git-types';

const gitAPI = {
  getStatus: (): Promise<GitStatusPayload> => ipcRenderer.invoke('git:getStatus'),
  stageFiles: (paths: string[]) => ipcRenderer.invoke('git:stageFiles', paths),
  unstageFiles: (paths: string[]) => ipcRenderer.invoke('git:unstageFiles', paths),
  stageAll: () => ipcRenderer.invoke('git:stageAll'),
  unstageAll: () => ipcRenderer.invoke('git:unstageAll'),
  getDiff: (payload: { path: string; staged: boolean; isUntracked?: boolean }): Promise<GitDiffPayload> =>
    ipcRenderer.invoke('git:getDiff', payload),
  commit: (message: string): Promise<GitCommitResult> => ipcRenderer.invoke('git:commit', message),
  discardChanges: (payload: { path: string; isUntracked?: boolean }) => ipcRenderer.invoke('git:discardChanges', payload),
  getRepository: () => ipcRenderer.invoke('repo:getCurrent'),
  selectRepository: () => ipcRenderer.invoke('repo:select')
};

contextBridge.exposeInMainWorld('gitAPI', gitAPI);
