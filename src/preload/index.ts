import { contextBridge, ipcRenderer } from 'electron';
import type { GitCommitPayload, GitCommitResult, GitDiffPayload, GitStatusPayload } from 'git-types';

const gitAPI = {
  getStatus: (): Promise<GitStatusPayload> => ipcRenderer.invoke('git:getStatus'),
  stageFiles: (paths: string[]) => ipcRenderer.invoke('git:stageFiles', paths),
  unstageFiles: (paths: string[]) => ipcRenderer.invoke('git:unstageFiles', paths),
  stageAll: () => ipcRenderer.invoke('git:stageAll'),
  unstageAll: () => ipcRenderer.invoke('git:unstageAll'),
  getDiff: (payload: { path: string; staged: boolean; isUntracked?: boolean }): Promise<GitDiffPayload> =>
    ipcRenderer.invoke('git:getDiff', payload),
  commit: (payload: GitCommitPayload): Promise<GitCommitResult> => ipcRenderer.invoke('git:commit', payload),
  getLastCommitMessage: (): Promise<string> => ipcRenderer.invoke('git:getLastCommitMessage'),
  discardChanges: (payload: { path: string; isUntracked?: boolean }) => ipcRenderer.invoke('git:discardChanges', payload)
};

contextBridge.exposeInMainWorld('gitAPI', gitAPI);
