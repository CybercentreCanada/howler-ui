import { Skeleton } from '@mui/material';
import useAppTheme from 'commons/components/app/hooks/useAppTheme';
import { FC, useMemo } from 'react';
import ReactJson, { CollapsedFieldProps } from 'react-json-view';
import { removeEmpty } from 'utils/utils';

const JSONViewer: FC<{ data: object; collapse?: boolean }> = ({ data, collapse = true }) => {
  const { isDark } = useAppTheme();

  const filteredData = useMemo(() => removeEmpty(data), [data]);

  const shouldCollapse = (field: CollapsedFieldProps) => {
    return (field.name !== 'root' && field.type !== 'object') || field.namespace.length > 3;
  };

  // https://github.com/mac-s-g/react-json-view
  // https://mac-s-g.github.io/react-json-view/demo/dist/
  // https://github.com/aspecto-io/searchable-react-json-view -  for a searchable fork
  return data ? (
    <ReactJson
      src={filteredData}
      theme={isDark ? 'summerfruit' : 'summerfruit:inverted'}
      indentWidth={2}
      // theme={isDark ? 'grayscale' : 'grayscale:inverted'}
      // collapsed={1}
      shouldCollapse={collapse ? shouldCollapse : false}
      quotesOnKeys={false}
      style={{ flex: 1, overflow: 'auto', height: '100%', fontSize: 'smaller' }}
      enableClipboard={_data => {
        if (typeof _data.src === 'string') {
          navigator.clipboard.writeText(_data.src);
        } else {
          navigator.clipboard.writeText(JSON.stringify(_data.src));
        }
      }}
    />
  ) : (
    <Skeleton width="100%" height="95%" variant="rounded" />
  );
};

export default JSONViewer;
