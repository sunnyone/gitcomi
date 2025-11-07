import { Button, Callout, Card, Spinner, TextArea } from '@blueprintjs/core';
import type { GitFileStatus } from 'git-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import FileList from './components/FileList';

interface SelectedFileRef {
  path: string;
  staged: boolean;
}

const App = () => {
  const [files, setFiles] = useState<GitFileStatus[]>([]);
  const [selected, setSelected] = useState<SelectedFileRef | null>(null);
  const [diff, setDiff] = useState('');
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(true);

  const workingFiles = useMemo(() => files.filter((file) => !file.staged), [files]);
  const stagedFiles = useMemo(() => files.filter((file) => file.staged), [files]);

  const selectedFile = useMemo(
    () => files.find((file) => selected && file.path === selected.path && file.staged === selected.staged) ?? null,
    [files, selected]
  );

  const handleError = useCallback((message: string) => {
    setError(message);
    setInfo(null);
  }, []);

  const refreshStatus = useCallback(async () => {
    setIsStatusLoading(true);
    try {
      const status = await window.gitAPI.getStatus();
      setFiles(status.files);
      setError(null);
      if (!status.files.length) {
        setSelected(null);
        setDiff('');
        return;
      }

      setSelected((current) => {
        if (!status.files.length) {
          return null;
        }
        if (current && status.files.some((file) => file.path === current.path && file.staged === current.staged)) {
          return current;
        }
        if (current) {
          const samePath = status.files.find((file) => file.path === current.path);
          if (samePath) {
            return { path: samePath.path, staged: samePath.staged };
          }
        }
        const fallback = status.files[0];
        return { path: fallback.path, staged: fallback.staged };
      });
    } catch (err) {
      handleError((err as Error).message);
    } finally {
      setIsStatusLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!selectedFile) {
      setDiff('');
      setIsLoadingDiff(false);
      return;
    }

    let mounted = true;
    setIsLoadingDiff(true);
    window.gitAPI
      .getDiff({ path: selectedFile.path, staged: selectedFile.staged, isUntracked: selectedFile.isUntracked })
      .then((payload) => {
        if (mounted) {
          setDiff(payload.diff || '差分はありません');
        }
      })
      .catch((err) => handleError((err as Error).message))
      .finally(() => mounted && setIsLoadingDiff(false));

    return () => {
      mounted = false;
    };
  }, [selectedFile, handleError]);

  const runGitAction = useCallback(async (action: () => Promise<void>) => {
    setIsMutating(true);
    try {
      await action();
      await refreshStatus();
    } catch (err) {
      handleError((err as Error).message);
    } finally {
      setIsMutating(false);
    }
  }, [refreshStatus, handleError]);

  const stageFile = (file: GitFileStatus) => {
    if (file.staged) return;
    setSelected({ path: file.path, staged: true });
    runGitAction(() => window.gitAPI.stageFiles([file.path]));
  };

  const unstageFile = (file: GitFileStatus) => {
    if (!file.staged) return;
    setSelected({ path: file.path, staged: false });
    runGitAction(() => window.gitAPI.unstageFiles([file.path]));
  };

  const stageSelected = () => {
    if (!selectedFile) return;
    stageFile(selectedFile);
  };

  const unstageSelected = () => {
    if (!selectedFile) return;
    unstageFile(selectedFile);
  };

  const stageAll = () => {
    if (!workingFiles.length) return;
    runGitAction(() => window.gitAPI.stageAll());
  };

  const unstageAll = () => {
    if (!stagedFiles.length) return;
    runGitAction(() => window.gitAPI.unstageAll());
  };

  const handleCommit = async () => {
    if (!commitMessage.trim() || !stagedFiles.length) return;
    setIsMutating(true);
    try {
      await window.gitAPI.commit(commitMessage.trim());
      setCommitMessage('');
      setInfo('コミットを作成しました。');
      setError(null);
      await refreshStatus();
    } catch (err) {
      handleError((err as Error).message);
    } finally {
      setIsMutating(false);
    }
  };

  const selectFile = (file: GitFileStatus) => {
    setSelected({ path: file.path, staged: file.staged });
  };

  const canCommit = Boolean(commitMessage.trim()) && stagedFiles.length > 0 && !isMutating;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <FileList
          title={`Working copy (${workingFiles.length})`}
          files={workingFiles}
          selectedKey={selected?.path ?? null}
          selectedStage={selected?.staged ?? false}
          onSelect={selectFile}
          onDoubleClick={(file) => {
            selectFile(file);
            stageFile(file);
          }}
        />
        <div className="sidebar-controls">
          <div className="sidebar-control-group">
            <Button
              icon="chevron-down"
              title="選択したファイルをステージ"
              disabled={!selectedFile || selectedFile.staged || isMutating}
              onClick={stageSelected}
            />
            <Button
              icon="double-chevron-down"
              title="すべてステージ"
              disabled={!workingFiles.length || isMutating}
              onClick={stageAll}
            />
          </div>
          <div className="sidebar-control-group">
            <Button
              icon="chevron-up"
              title="選択したファイルをアンステージ"
              disabled={!selectedFile || !selectedFile.staged || isMutating}
              onClick={unstageSelected}
            />
            <Button
              icon="double-chevron-up"
              title="すべてアンステージ"
              disabled={!stagedFiles.length || isMutating}
              onClick={unstageAll}
            />
          </div>
        </div>
        <FileList
          title={`Stage (${stagedFiles.length})`}
          files={stagedFiles}
          selectedKey={selected?.path ?? null}
          selectedStage={selected?.staged ?? false}
          onSelect={selectFile}
          onDoubleClick={(file) => {
            selectFile(file);
            unstageFile(file);
          }}
        />
      </div>
      <div className="content">
        {(error || info) && (
          <Callout intent={error ? 'danger' : 'success'} className="feedback">
            <div className="feedback-row">
              <span>{error ?? info}</span>
              <Button
                icon="cross"
                minimal
                onClick={() => (error ? setError(null) : setInfo(null))}
              />
            </div>
          </Callout>
        )}
        <Card className="diff-pane" elevation={1}>
          <div className="diff-header">
            <div>
              <div className="diff-title">差分</div>
              {selectedFile && <div className="diff-path">{selectedFile.path}</div>}
            </div>
            {isStatusLoading && <Spinner size={20} />}
          </div>
          <div className="diff-body">
            {!selectedFile && <div className="placeholder">ファイルを選択してください。</div>}
            {selectedFile && isLoadingDiff && <Spinner />}
            {selectedFile && !isLoadingDiff && (
              <pre className="diff-output">
                {diff || '差分はありません'}
              </pre>
            )}
          </div>
        </Card>
        <Card className="commit-pane" elevation={1}>
          <div className="commit-header">
            <div>コミットメッセージ</div>
            <div className="commit-actions">
              <Button icon="refresh" minimal disabled={isMutating} onClick={refreshStatus} />
            </div>
          </div>
          <div className="commit-body">
            <TextArea
              placeholder="コミットメッセージを入力"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.currentTarget.value)}
            />
            <Button
              intent="primary"
              icon="git-commit"
              large
              onClick={handleCommit}
              disabled={!canCommit}
            >
              Commit
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default App;
