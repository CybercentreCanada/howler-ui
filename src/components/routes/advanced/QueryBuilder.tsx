/* eslint-disable no-useless-escape */
import { useMonaco } from '@monaco-editor/react';
import { PlayArrowOutlined, SsidChart } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Box,
  Card,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import api from 'api';
import { HowlerEQLSearchResponse, HowlerSearchResponse } from 'api/search';
import TuiButton from 'commons/addons/display/buttons/TuiButton';
import FlexOne from 'commons/addons/flexers/FlexOne';
import PageCenter from 'commons/components/pages/PageCenter';
import { parseEvent } from 'commons/components/utils/keyboard';
import { FieldContext } from 'components/app/providers/FieldProvider';
import JSONViewer from 'components/elements/display/JSONViewer';
import useMyModal from 'components/hooks/useMyModal';
import useMySnackbar from 'components/hooks/useMySnackbar';
import { Hit } from 'models/entities/generated/Hit';
import moment from 'moment';
import { FC, KeyboardEventHandler, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuid } from 'uuid';
import CorrelationModal from './CorrelationModal';
import QueryEditor from './QueryEditor';

const QUERY_TYPES = ['eql', 'lucene', 'yaml'];

const STEPS = [1, 5, 25, 50, 100, 250, 500, 1000, 2500, 10000];

const DEFAULT_VALUES = {
  eql: `sequence with maxspan=30m
  [ process where process.name == "regsvr32.exe" ]
  [ file where length(process.command_line) > 400 ]
`,
  lucene: `# Match any howler.id value
howler.id:*
AND
# Hits must be open
howler.status:open
`,
  yaml: `title: Example Howler Sigma Rule
id: ${uuid()}
status: test
description: A basic example of using sigma rule notation to query howler
references:
    - https://github.com/SigmaHQ/sigma
author: You
date: ${moment().format('YYYY/MM/DD')}
modified: ${moment().format('YYYY/MM/DD')}
tags:
    - attack.command_and_control
logsource:
    category: nbs
detection:
    selection1:
        howler.analytic|startswith:
            - '6Tail'
            - 'Assembly'
    selection2:
        howler.status:
          - open
          - in-progress
    condition: 1 of selection*
falsepositives:
    - Unknown
level: informational
`
};

type SearchResponse<T> = HowlerSearchResponse<T> | HowlerEQLSearchResponse<T>;

const QueryBuilder: FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const monaco = useMonaco();
  const { hitFields, getHitFields } = useContext(FieldContext);
  const { showModal } = useMyModal();
  const { showWarningMessage } = useMySnackbar();

  const [type, setType] = useState<'eql' | 'lucene' | 'yaml'>('lucene');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(DEFAULT_VALUES.lucene);
  const [fields, setFields] = useState<string[]>(['howler.id']);
  const [response, setResponse] = useState<SearchResponse<Hit>>(null);
  const [error, setError] = useState<string>(null);
  const [rows, setRows] = useState(1);
  const [x, setX] = useState(0);

  const wrapper = useRef<HTMLDivElement>();

  const fieldOptions = useMemo(() => hitFields.map(_field => _field.key), [hitFields]);

  const execute = useCallback(async () => {
    setLoading(true);

    try {
      const searchProperties = {
        fl: fields.join(','),
        rows: STEPS[rows]
      };

      let result: SearchResponse<Hit>;
      if (type === 'lucene') {
        result = await api.search.hit.post({
          query: query.replace(/#.+/g, '').replace(/\n{2,}/, '\n'),
          ...searchProperties
        });
      } else if (type === 'eql') {
        result = await api.search.hit.eql.post({
          eql_query: query.replace(/#.+/g, '').replace(/\n{2,}/, '\n'),
          ...searchProperties
        });
      } else {
        result = await api.search.hit.sigma.post({
          sigma: query,
          ...searchProperties
        });
      }

      setResponse(result);
      setError(null);
    } catch (e) {
      setError(e.message ?? e.toString());
    } finally {
      setLoading(false);
    }
  }, [fields, query, rows, type]);

  const onKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
    event => {
      const parsedEvent = parseEvent(event);

      if (parsedEvent.isCtrl && parsedEvent.isEnter) {
        execute();
      }
    },
    [execute]
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

  const onCreateCorrelation = useCallback(async () => {
    if (!response) {
      showWarningMessage(t('route.advanced.create.correlation.disabled'));
      return;
    }

    await new Promise<void>(res =>
      showModal(<CorrelationModal onSubmit={res} fileData={query} type={type} />, {
        maxWidth: '85vw',
        maxHeight: '85vh'
      })
    );
  }, [query, response, showModal, showWarningMessage, t, type]);

  useEffect(() => {
    if (!monaco) {
      return;
    }

    monaco.editor.addEditorAction({
      id: 'execute-query',
      label: t('route.advanced.execute.query'),
      contextMenuGroupId: 'howler',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: execute
    });

    monaco.editor.addEditorAction({
      id: 'save-query',
      label: t('route.advanced.create.correlation'),
      contextMenuGroupId: 'howler',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: onCreateCorrelation
    });
  }, [execute, monaco, onCreateCorrelation, t]);

  useEffect(() => {
    getHitFields();
  }, [getHitFields]);

  useEffect(() => {
    setResponse(null);

    if (!monaco) {
      return;
    }

    monaco.editor.getModels().forEach(model => {
      model.setValue(DEFAULT_VALUES[type]);
    });
  }, [type, monaco]);

  return (
    <PageCenter width="100%" maxWidth="100%" margin={0} textAlign="left">
      <Stack ref={wrapper}>
        <Stack direction="row" spacing={1} sx={{ px: 2, pb: 1, height: '48px' }}>
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
          <Select value={type} onChange={event => setType(event.target.value as 'eql' | 'lucene')}>
            {QUERY_TYPES.map(_type => (
              <MenuItem key={_type} value={_type}>
                {t(`route.advanced.query.${_type}`)}
              </MenuItem>
            ))}
          </Select>
          <FlexOne />
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
          <TuiButton
            variant="outlined"
            color="info"
            startIcon={<SsidChart />}
            onClick={onCreateCorrelation}
            disabled={!response}
            tooltip={!response && t('route.advanced.create.correlation.disabled')}
          >
            {t('route.advanced.create.correlation')}
          </TuiButton>
        </Stack>
        <Box
          width="100%"
          height="calc(100vh - 112px)"
          sx={{ position: 'relative', overflow: 'hidden', borderTop: `thin solid ${theme.palette.divider}` }}
        >
          <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: `calc(50% + 7px - ${x}px)`, pt: 1 }}>
            <QueryEditor query={query} setQuery={setQuery} language={type} />
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
            {response ? (
              <JSONViewer data={response ?? {}} collapse={false} />
            ) : (
              <Stack alignItems="center" p={2}>
                <Typography variant="h3" sx={{ mt: 4, color: 'text.secondary', opacity: 0.7 }}>
                  {t('route.advanced.result.title')}
                </Typography>
                <Typography variant="h5" sx={{ mt: 2, color: 'text.secondary', opacity: 0.7 }}>
                  {t('route.advanced.result.description')}
                </Typography>
              </Stack>
            )}
          </Box>
          {error && (
            <Alert
              sx={{ position: 'absolute', bottom: 0, left: 0, right: '50%', m: 1, mr: 13, maxHeight: '40vh' }}
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
