import { useMonaco } from '@monaco-editor/react';
import { Height, Search } from '@mui/icons-material';
import { Badge, Box, Card, Skeleton, Tooltip, alpha, useTheme } from '@mui/material';
import TuiIconButton from 'commons/addons/display/buttons/TuiIconButton';
import QueryEditor from 'components/routes/advanced/QueryEditor';
import type { IDisposable, editor } from 'monaco-editor';

import type { FC } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { sanitizeMultilineLucene } from 'utils/stringUtils';

const DEFAULT_MULTILINE_HEIGHT = 250;
const PROMPT_CONTEXT = '!suggestWidgetVisible && !renameInputVisible && !inSnippetMode && !quickFixWidgetVisible';

export type HitQueryProps = {
  triggerSearch: (query: string) => void;
  searching?: boolean;
  disabled?: boolean;
};

const HitQuery: FC<HitQueryProps> = ({ searching = false, disabled = false, triggerSearch }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const theme = useTheme();
  const monaco = useMonaco();

  const prevQuery = useRef<string | null>(null);

  const [query, setQuery] = useState(new URLSearchParams(window.location.search).get('query') || 'howler.id:*');
  const [loaded, setLoaded] = useState(false);
  const [multiline, setMultiline] = useState(false);
  const [y, setY] = useState(0);

  const wrapper = useRef<HTMLDivElement>();

  const search = useCallback(() => triggerSearch(sanitizeMultilineLucene(query)), [query, triggerSearch]);

  const isDirty = useMemo(() => query !== new URLSearchParams(location.search).get('query'), [query, location]);

  useEffect(() => {
    if (!monaco) {
      return;
    }

    const executeDisposable = monaco.editor.addEditorAction({
      id: 'execute-query',
      label: t('route.advanced.execute.query'),
      contextMenuGroupId: 'howler',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: search
    });

    return () => {
      executeDisposable.dispose();
    };
  }, [monaco, t, search]);

  useEffect(() => {
    if (!monaco) {
      return;
    }

    let disposable: IDisposable;
    if (!multiline) {
      disposable = monaco.editor.addKeybindingRule({
        command: 'execute-query',
        keybinding: monaco.KeyCode.Enter,
        when: PROMPT_CONTEXT
      });
    } else {
      disposable = monaco.editor.addKeybindingRule({
        command: null,
        keybinding: monaco.KeyCode.Enter,
        when: PROMPT_CONTEXT
      });
    }

    return () => {
      disposable.dispose();
    };
  }, [monaco, multiline, search]);

  const onMouseMove = useCallback((event: MouseEvent) => {
    const wrapperRect = wrapper.current?.getBoundingClientRect();

    const offset = event.clientY - (wrapperRect.top + DEFAULT_MULTILINE_HEIGHT);

    setY(offset);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.has('query') && urlParams.get('query') !== prevQuery.current) {
      prevQuery.current = urlParams.get('query');
      setQuery(prevQuery.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const onMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const onMouseDown = useCallback(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [onMouseMove, onMouseUp]);

  const onMount = useCallback(() => setLoaded(true), []);

  const options: editor.IStandaloneEditorConstructionOptions = useMemo(
    () => ({
      fontSize: 17,
      lineHeight: 19,
      lineNumbers: multiline ? 'on' : 'off',
      lineDecorationsWidth: multiline ? 8 : 0,
      lineNumbersMinChars: multiline ? 2 : 0,
      showFoldingControls: 'never',
      scrollBeyondLastLine: !multiline,
      glyphMargin: !multiline,
      renderLineHighlight: multiline ? 'gutter' : 'none',
      overviewRulerLanes: multiline ? 1 : 0
    }),
    [multiline]
  );

  const preppedQuery = useMemo(() => (multiline ? query : query.replaceAll('\n', ' ')), [multiline, query]);

  return (
    <Card
      ref={wrapper}
      variant="outlined"
      sx={[
        {
          width: '100%',
          height: multiline ? `${DEFAULT_MULTILINE_HEIGHT + y}px` : theme.spacing(7),
          p: 1,
          position: 'relative',
          overflow: 'visible',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          '& .monaco-editor': {
            position: 'absolute !important'
          },
          transition: theme.transitions.create('border-color')
        },
        isDirty &&
          new URLSearchParams(location.search).has('query') && {
            borderColor: 'warning.main'
          }
      ]}
      onKeyDown={e => e.stopPropagation()}
    >
      <TuiIconButton disabled={searching || disabled} onClick={search} sx={{ mr: 1, alignSelf: 'start' }}>
        <Tooltip title={t('route.search')}>
          <Badge invisible={!isDirty} color="warning" variant="dot">
            <Search sx={{ fontSize: '20px' }} />
          </Badge>
        </Tooltip>
      </TuiIconButton>
      <QueryEditor
        query={preppedQuery}
        setQuery={setQuery}
        language="lucene"
        height={multiline ? '100%' : '20px'}
        onMount={onMount}
        editorOptions={options}
      />
      <TuiIconButton
        disabled={query.includes('\n#') || disabled}
        onClick={() => setMultiline(!multiline)}
        sx={{ ml: 1, alignSelf: 'start', flexShrink: 0 }}
        color={multiline ? 'primary' : theme.palette.text.primary}
        transparent={!multiline}
      >
        <Height sx={{ fontSize: '20px' }} />
      </TuiIconButton>
      {!loaded && (
        <Skeleton
          variant="rectangular"
          sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          height="100%"
        />
      )}
      {multiline && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '10px',
            backgroundColor: theme.palette.divider,
            cursor: 'row-resize',
            zIndex: 1000
          }}
          onMouseDown={onMouseDown}
        />
      )}
      {disabled && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            backgroundColor: alpha(theme.palette.background.paper, 0.65),
            zIndex: 1000
          }}
          onMouseDown={onMouseDown}
        />
      )}
    </Card>
  );
};

export default memo(HitQuery);
