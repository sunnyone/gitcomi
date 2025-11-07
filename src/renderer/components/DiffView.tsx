import { memo, useMemo } from 'react';

interface DiffViewProps {
  diff: string;
}

interface DiffLine {
  content: string;
  type: 'add' | 'remove' | 'hunk' | 'meta' | 'context';
}

const DiffView = memo(({ diff }: DiffViewProps) => {
  const lines = useMemo<DiffLine[]>(() => {
    if (!diff) {
      return [{ content: '差分はありません', type: 'meta' }];
    }

    return diff.replace(/\r\n/g, '\n').split('\n').map((line) => {
      let type: DiffLine['type'] = 'context';

      if (line.startsWith('+++') || line.startsWith('---')) {
        type = 'meta';
      } else if (line.startsWith('@@')) {
        type = 'hunk';
      } else if (line.startsWith('+')) {
        type = 'add';
      } else if (line.startsWith('-')) {
        type = 'remove';
      }

      return { content: line || ' ', type };
    });
  }, [diff]);

  return (
    <div className="diff-output">
      {lines.map((line, index) => (
        <div key={`${index}-${line.content}`} className={`diff-line diff-line-${line.type}`}>
          {line.content}
        </div>
      ))}
    </div>
  );
});

export default DiffView;
