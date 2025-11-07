import classNames from 'classnames';
import { Icon } from '@blueprintjs/core';
import type { IconName } from '@blueprintjs/core';
import type { FC } from 'react';
import type { GitFileStatus } from 'git-types';

interface FileListProps {
  title: string;
  files: GitFileStatus[];
  selectedKey: string | null;
  selectedStage: boolean;
  onSelect: (file: GitFileStatus) => void;
  onDoubleClick: (file: GitFileStatus) => void;
}

const statusIconMap: Record<string, string> = {
  A: 'add',
  M: 'edit',
  D: 'trash',
  R: 'swap-horizontal',
  C: 'git-branch'
};

const FileList: FC<FileListProps> = ({
  title,
  files,
  selectedKey,
  selectedStage,
  onSelect,
  onDoubleClick
}) => {
  const renderStatusIcon = (statusCode: string) => {
    const symbol = statusCode[0] !== ' ' && statusCode[0] !== '?' ? statusCode[0] : statusCode[1];
    const iconName = (statusIconMap[symbol] ?? 'document') as IconName;
    return <Icon icon={iconName} size={12} />;
  };

  return (
    <div className="file-list-container">
      <div className="file-list-header">{title}</div>
      <div className="file-list" role="list">
        {files.length === 0 && <div className="file-list-empty">ファイルがありません</div>}
        {files.map((file) => {
          const isSelected = selectedKey === file.path && selectedStage === file.staged;
          return (
            <div
              key={`${file.path}-${file.staged ? 'staged' : 'working'}`}
              role="listitem"
              tabIndex={0}
              className={classNames('file-list-item', { 'is-selected': isSelected })}
              onClick={() => onSelect(file)}
              onDoubleClick={() => onDoubleClick(file)}
            >
              <span className="file-list-icon">{renderStatusIcon(file.statusCode)}</span>
              <span className="file-list-name">{file.displayPath}</span>
              <span className="file-list-code">{file.statusCode}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileList;
