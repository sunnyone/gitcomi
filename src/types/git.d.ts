declare module 'git-types' {
  export type GitStageArea = 'working' | 'staged';

  export interface GitFileStatus {
    path: string;
    staged: boolean;
    statusCode: string;
    displayPath: string;
    isUntracked: boolean;
  }

  export interface GitStatusPayload {
    files: GitFileStatus[];
  }

  export interface GitDiffPayload {
    path: string;
    staged: boolean;
    diff: string;
  }

  export interface GitCommitResult {
    success: boolean;
    message: string;
  }

  export interface GitRepositoryInfo {
    path: string;
  }
}
