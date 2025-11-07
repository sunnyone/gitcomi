import type { GitCommitResult, GitDiffPayload, GitStatusPayload } from 'git-types';

declare global {
  interface Window {
    gitAPI: {
      getStatus: () => Promise<GitStatusPayload>;
      stageFiles: (paths: string[]) => Promise<void>;
      unstageFiles: (paths: string[]) => Promise<void>;
      stageAll: () => Promise<void>;
      unstageAll: () => Promise<void>;
      getDiff: (payload: { path: string; staged: boolean; isUntracked?: boolean }) => Promise<GitDiffPayload>;
      commit: (message: string) => Promise<GitCommitResult>;
    };
  }
}

export {};
