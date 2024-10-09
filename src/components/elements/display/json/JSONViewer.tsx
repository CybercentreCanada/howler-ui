import ReactJson, { type CollapsedFieldProps } from '@microlink/react-json-view';
import { Skeleton, Stack } from '@mui/material';
import { TuiPhrase } from 'commons/addons/controls';
import { useAppTheme } from 'commons/components/app/hooks';
import { useMyLocalStorageItem } from 'components/hooks/useMyLocalStorage';
import { t } from 'i18next';
import { useEffect, useMemo, useState, type FC } from 'react';
import { StorageKey } from 'utils/constants';
// eslint-disable-next-line import/no-unresolved
import JSONWorker from './worker?worker';

const JSONViewer: FC<{ data: object; collapse?: boolean }> = ({ data, collapse = true }) => {
  const { isDark } = useAppTheme();
  const [compact] = useMyLocalStorageItem<boolean>(StorageKey.COMPACT_JSON, true);
  const [flat] = useMyLocalStorageItem<boolean>(StorageKey.FLATTEN_JSON);

  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);

  const jsonWorker = useMemo(() => new JSONWorker(), []);

  useEffect(() => {
    jsonWorker.postMessage([data, compact, query, flat]);

    jsonWorker.onmessage = (e: MessageEvent<[any]>) => {
      setResult(e.data[0]);
    };

    return () => (jsonWorker.onmessage = null);
  }, [compact, data, flat, jsonWorker, query]);

  const hasError = useMemo(() => {
    try {
      new RegExp(query);

      return false;
    } catch (e) {
      return true;
    }
  }, [query]);

  const shouldCollapse = (field: CollapsedFieldProps) => {
    return (field.name !== 'root' && field.type !== 'object') || field.namespace.length > 3;
  };

  return data ? (
    <Stack direction="column" spacing={1} sx={{ '& > div:first-of-type': { mt: 1, mr: 0.5 } }}>
      <TuiPhrase
        value={query}
        onChange={setQuery}
        error={hasError}
        label={t('json.viewer.search.label')}
        placeholder={t('json.viewer.search.prompt')}
        disabled={!result}
      />
      {result && (
        <ReactJson
          src={result}
          theme={isDark ? 'summerfruit' : 'summerfruit:inverted'}
          indentWidth={2}
          displayDataTypes={!compact}
          displayObjectSize={!compact}
          shouldCollapse={collapse ? shouldCollapse : false}
          quotesOnKeys={false}
          style={{ flex: 1, overflow: 'auto', height: '100%', fontSize: compact ? 'small' : 'smaller' }}
          enableClipboard={_data => {
            if (typeof _data.src === 'string') {
              navigator.clipboard.writeText(_data.src);
            } else {
              navigator.clipboard.writeText(JSON.stringify(_data.src));
            }
          }}
          {...({
            // Type declaration is wrong - this is a valid prop
            displayArrayKey: !compact
          } as any)}
        />
      )}
    </Stack>
  ) : (
    <Skeleton width="100%" height="95%" variant="rounded" />
  );
};

export default JSONViewer;
