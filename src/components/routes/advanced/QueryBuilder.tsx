/* eslint-disable no-useless-escape */
import { Editor, Monaco, useMonaco } from '@monaco-editor/react';
import { PlayArrowOutlined, SsidChart } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Box,
  Card,
  Chip,
  CircularProgress,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import api from 'api';
import { HowlerSearchResponse } from 'api/search';
import TuiButton from 'commons/addons/display/buttons/TuiButton';
import FlexOne from 'commons/addons/flexers/FlexOne';
import PageCenter from 'commons/components/pages/PageCenter';
import { parseEvent } from 'commons/components/utils/keyboard';
import { FieldContext } from 'components/app/providers/FieldProvider';
import JSONViewer from 'components/elements/display/JSONViewer';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import Fuse from 'fuse.js';
import { Hit } from 'models/entities/generated/Hit';
import { FC, KeyboardEventHandler, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TOKEN_PROVIDER from './luceneTokenProvider';

const STEPS = [1, 5, 25, 50, 100, 250, 500, 1000, 2500, 10000];

const DEFAULT_VALUE = `# Match any howler.id value
howler.id:*
AND
# Hits must be open
howler.status:open
`;

const QueryBuilder: FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const monaco = useMonaco();
  const { hitFields, getHitFields } = useContext(FieldContext);
  const { config } = useMyApiConfig();

  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(DEFAULT_VALUE);
  const [fields, setFields] = useState<string[]>(['howler.id']);
  const [response, setResponse] = useState<HowlerSearchResponse<Hit>>(null);
  const [error, setError] = useState<string>(null);
  const [rows, setRows] = useState(1);
  const [x, setX] = useState(0);

  const wrapper = useRef<HTMLDivElement>();

  const fieldOptions = useMemo(() => hitFields.map(_field => _field.key), [hitFields]);
  const fuse = useMemo(() => new Fuse(hitFields, { keys: ['key'], threshold: 0.4 }), [hitFields]);

  const execute = useCallback(async () => {
    setLoading(true);

    try {
      const result = await api.search.hit.post({
        query: query.replace(/#.+/g, '').replace(/\n{2,}/, '\n'),
        fl: fields.join(','),
        rows: STEPS[rows]
      });

      setResponse(result);
      setError(null);
    } catch (e) {
      setError(e.message ?? e.toString());
    } finally {
      setLoading(false);
    }
  }, [fields, query, rows]);

  const onKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
    event => {
      const parsedEvent = parseEvent(event);

      if (parsedEvent.isCtrl && parsedEvent.isEnter) {
        execute();
      }
    },
    [execute]
  );

  const beforeEditorMount = useCallback(
    (_monaco: Monaco) => {
      _monaco.editor.defineTheme('howler', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'operator', foreground: theme.palette.warning.light.toUpperCase().replaceAll('#', '') },
          { token: 'string.invalid', foreground: theme.palette.error.main.toUpperCase().replaceAll('#', '') },
          { token: 'invalid', foreground: theme.palette.error.main.toUpperCase().replaceAll('#', '') },
          { token: 'boolean', foreground: theme.palette.success.main.toUpperCase().replaceAll('#', '') }
        ],
        colors: {
          'editor.background': theme.palette.background.paper
        }
      });

      _monaco.languages.register({ id: 'lucene' });
    },
    [theme]
  );

  const onMouseMove = useCallback((event: MouseEvent) => {
    const wrapperRect = wrapper.current?.getBoundingClientRect();

    const offset = event.clientX - (wrapperRect.left + wrapperRect.width / 2);

    setX(offset);
  }, []);

  const onMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const onMouseDown = useCallback(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [onMouseMove, onMouseUp]);

  useEffect(() => {
    if (!monaco) {
      return;
    }

    monaco.editor.getModels().forEach(model => model.setEOL(monaco.editor.EndOfLineSequence.LF));

    const monarchDisposable = monaco.languages.setMonarchTokensProvider('lucene', TOKEN_PROVIDER);

    const completionDisposable = monaco.languages.registerCompletionItemProvider('lucene', {
      provideCompletionItems: (model, position) => {
        const line: string = model.getLineContent(position.lineNumber);

        const context = line.slice(0, position.column - 1);

        const before = context.replace(/^(.*?[^a-zA-Z._]?)[a-zA-Z._]+$/, '$1');
        const portion = context.replace(/^.+?[^a-zA-Z._]([a-zA-Z._]+)$/, '$1');

        if (before.trim().endsWith(':')) {
          const key = before.trim().replace(/^.*?[^a-zA-Z._]?([a-zA-Z._]+):$/, '$1');

          if (config.lookups[key]) {
            const _position = model.getWordUntilPosition(position);

            return {
              suggestions: (config.lookups[key] as string[]).map(_value => ({
                label: _value,
                kind: monaco.languages.CompletionItemKind.Constant,
                insertText: _value,
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: _position.startColumn,
                  endColumn: _position.endColumn
                }
              }))
            };
          }
        }

        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: before.length + 1,
          endColumn: before.length + portion.length
        };

        if (portion) {
          const fuzzyMatches = fuse.search(portion);
          return {
            suggestions: fuzzyMatches.map(({ item }) => ({
              label: item.key,
              detail: item.type,
              documentation: item.description,
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: item.key,
              range
            }))
          };
        } else {
          return {
            suggestions: hitFields.map(_field => ({
              label: _field.key,
              detail: _field.type,
              documentation: _field.description,
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: _field.key,
              range
            }))
          };
        }
      }
    });

    return () => {
      completionDisposable?.dispose();
      monarchDisposable?.dispose();
    };
  }, [config.lookups, fuse, hitFields, monaco]);

  useEffect(() => {
    if (!monaco) {
      return;
    }

    monaco.editor.addEditorAction({
      id: 'execute-query',
      label: t('route.advanced.execute.query'),
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: execute
    });
  }, [execute, monaco, t]);

  useEffect(() => {
    getHitFields();
  }, [getHitFields]);

  return (
    <PageCenter width="100%" maxWidth="100%" margin={0} textAlign="left">
      <Stack ref={wrapper}>
        <Stack direction="row" spacing={1} sx={{ px: 2, pb: 1, height: '48px' }}>
          <TuiButton
            size="small"
            variant="outlined"
            startIcon={
              loading ? (
                <CircularProgress size={18} color="success" />
              ) : (
                <PlayArrowOutlined color="success" sx={{ '& path': { stroke: 'currentcolor', strokeWidth: '1px' } }} />
              )
            }
            color="success"
            onClick={execute}
          >
            {t('execute')}
          </TuiButton>
          <Autocomplete
            renderTags={values =>
              values.length <= 3 ? (
                <Stack direction="row" spacing={0.5}>
                  {values.map(_value => (
                    <Chip size="small" key={_value} label={_value} />
                  ))}
                </Stack>
              ) : (
                <Tooltip
                  title={
                    <Stack spacing={1}>
                      {values.map(_value => (
                        <span key={_value}>{_value}</span>
                      ))}
                    </Stack>
                  }
                >
                  <Chip size="small" label={values.length} />
                </Tooltip>
              )
            }
            multiple
            size="small"
            options={fieldOptions}
            value={fields}
            onChange={(__, values) => setFields(values)}
            renderInput={params => <TextField {...params} label={t('route.advanced.fields')} />}
            sx={{ minWidth: '500px', '& label': { zIndex: 1200 } }}
            onKeyDown={onKeyDown}
          />
          <Card variant="outlined" sx={{ flex: 1, maxWidth: '350px' }}>
            <Stack spacing={0.5} sx={{ px: 1, alignItems: 'start' }}>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {t('route.advanced.rows')}: {STEPS[rows]}
              </Typography>
              <Slider
                size="small"
                valueLabelDisplay="off"
                value={rows}
                onChange={(_, value) => setRows(value as number)}
                min={0}
                max={9}
                step={1}
                marks
                track={false}
                sx={{ py: 0.5 }}
              />
            </Stack>
          </Card>
          <FlexOne />
          <TuiButton variant="outlined" color="info" startIcon={<SsidChart />} disabled={!response}>
            {t('route.advanced.create.correlation')}
          </TuiButton>
        </Stack>
        <Box
          width="100%"
          height="calc(100vh - 112px)"
          sx={{ position: 'relative', overflow: 'hidden', borderTop: `thin solid ${theme.palette.divider}` }}
        >
          <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: `calc(50% + 7px - ${x}px)`, pt: 1 }}>
            <Editor
              height="100%"
              width="100%"
              theme="howler"
              defaultLanguage="lucene"
              language="lucene"
              value={query}
              onChange={value => setQuery(value)}
              beforeMount={beforeEditorMount}
              options={{
                minimap: { enabled: false },
                overviewRulerBorder: false,
                renderLineHighlight: 'gutter',
                fontSize: 16,
                autoClosingBrackets: 'always'
              }}
            />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 'calc(50% - 5px)',
              width: '10px',
              backgroundColor: theme.palette.divider,
              cursor: 'col-resize',
              transform: `translateX(${x}px)`,
              zIndex: 1000
            }}
            onMouseDown={onMouseDown}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: `calc(50% + 7px + ${x}px)`,
              bottom: 0,
              right: 0,
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'stretch',
              px: 1,
              pt: 1,
              mt: -1,
              '& > *': { width: '100%' },
              '& .react-json-view': {
                backgroundColor: `${theme.palette.background.paper} !important`
              }
            }}
          >
            <JSONViewer data={response ?? {}} collapse={false} />
          </Box>
          {error && (
            <Alert
              sx={{ position: 'absolute', bottom: 0, left: 0, right: '50%', m: 1, mr: 13 }}
              variant="outlined"
              color="error"
            >
              <AlertTitle>{t('route.advanced.error')}</AlertTitle>
              {error}
            </Alert>
          )}
        </Box>
      </Stack>
    </PageCenter>
  );
};

export default QueryBuilder;
