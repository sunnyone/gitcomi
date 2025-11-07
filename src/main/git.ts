import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import type { ExecFileOptions } from 'node:child_process';
import type { GitCommitResult, GitDiffPayload, GitFileStatus, GitStatusPayload } from 'git-types';

const execFileAsync = promisify(execFile);
const workspaceRoot = process.cwd();
let repoRoot: string | null = null;

interface RunGitOptions extends ExecFileOptions {
  allowCodes?: number[];
}

async function ensureRepoRoot(): Promise<string> {
  if (repoRoot) {
    return repoRoot;
  }
  const { stdout } = await execFileAsync('git', ['rev-parse', '--show-toplevel'], { cwd: workspaceRoot });
  repoRoot = stdout.trim();
  return repoRoot;
}

async function runGit(args: string[], options: RunGitOptions = {}) {
  const cwd = options.cwd ?? (await ensureRepoRoot());
  try {
    return await execFileAsync('git', args, { ...options, cwd });
  } catch (error: any) {
    const code = typeof error?.code === 'number' ? error.code : Number(error?.code);
    if (options.allowCodes?.includes(code)) {
      return {
        stdout: error.stdout ?? '',
        stderr: error.stderr ?? ''
      };
    }
    throw error;
  }
}

function parseStatus(output: string): GitFileStatus[] {
  const lines = output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);

  const statuses: GitFileStatus[] = [];

  lines.forEach((line) => {
    const statusCode = line.slice(0, 2);
    const rawPath = line.slice(3);
    const indexStatus = statusCode[0];
    const workTreeStatus = statusCode[1];
    const displayPath = rawPath.includes(' -> ')
      ? rawPath.split(' -> ').pop() ?? rawPath
      : rawPath;

    const isUntracked = statusCode === '??';
    const baseStatus = {
      path: displayPath,
      statusCode,
      displayPath
    };

    const hasWorkingChanges = statusCode === '??' || (workTreeStatus !== ' ' && workTreeStatus !== '?');
    const hasStagedChanges = indexStatus !== ' ' && indexStatus !== '?';

    if (hasWorkingChanges) {
      statuses.push({ ...baseStatus, staged: false, isUntracked });
    }

    if (hasStagedChanges) {
      statuses.push({ ...baseStatus, staged: true, isUntracked: false });
    }
  });

  return statuses;
}

export async function getStatus(): Promise<GitStatusPayload> {
  const { stdout } = await runGit(['status', '--short', '--untracked-files=all']);
  return { files: parseStatus(stdout) };
}

export async function stageFiles(paths: string[]): Promise<void> {
  if (!paths.length) return;
  await runGit(['add', '--', ...paths]);
}

export async function unstageFiles(paths: string[]): Promise<void> {
  if (!paths.length) return;
  await runGit(['reset', 'HEAD', '--', ...paths]);
}

export async function stageAll(): Promise<void> {
  await runGit(['add', '--all']);
}

export async function unstageAll(): Promise<void> {
  await runGit(['reset', 'HEAD']);
}

export async function discardChanges(payload: { path: string; isUntracked?: boolean }): Promise<void> {
  const { path: pathname, isUntracked } = payload;
  if (!pathname) {
    return;
  }

  if (isUntracked) {
    await runGit(['clean', '-fd', '--', pathname]);
  } else {
    await runGit(['checkout', '--', pathname]);
  }
}

export async function getDiff(payload: { path: string; staged: boolean; isUntracked?: boolean }): Promise<GitDiffPayload> {
  const { path: pathname, staged, isUntracked } = payload;
  const args = staged ? ['diff', '--cached', '--', pathname] : ['diff', '--', pathname];
  let stdout = (await runGit(args, { allowCodes: [1] })).stdout;

  if (!staged && isUntracked && !stdout.trim()) {
    const cwd = await ensureRepoRoot();
    const absolutePath = path.resolve(cwd, pathname);
    const noIndexArgs = ['diff', '--no-index', '--', '/dev/null', absolutePath];
    stdout = (await runGit(noIndexArgs, { cwd, allowCodes: [1] })).stdout;
  }

  return { path: pathname, staged, diff: stdout };
}

export async function commit(message: string): Promise<GitCommitResult> {
  if (!message.trim()) {
    throw new Error('Commit message is empty');
  }
  await runGit(['commit', '-m', message]);
  return { success: true, message: 'Commit created' };
}
