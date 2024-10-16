import type { Monaco } from '@monaco-editor/react';
import { useMonaco } from '@monaco-editor/react';
import { useTheme } from '@mui/material';
import ThemedEditor from 'components/elements/ThemedEditor';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import type { editor } from 'monaco-editor';
import { memo, useCallback, useEffect, useMemo, type FC } from 'react';
import useEQLCompletionProvider from './eqlCompletionProvider';
import EQL_TOKEN_PROVIDER from './eqlTokenProvider';
import useLuceneCompletionProvider from './luceneCompletionProvider';
import LUCENE_TOKEN_PROVIDER from './luceneTokenProvider';
import useYamlCompletionProvider from './yamlCompletionProvider';

interface QueryEditorProps {
  query: string;
  setQuery: (query: string) => void;
  onMount?: () => void;
  language?: 'lucene' | 'eql' | 'yaml';
  fontSize?: number;
  height?: string;
  width?: string;
  editorOptions?: editor.IStandaloneEditorConstructionOptions;
}

const QueryEditor: FC<QueryEditorProps> = ({
  query,
  setQuery,
  onMount,
  language = 'lucene',
  fontSize = 16,
  height = '100%',
  width = '100%',
  editorOptions = {}
}) => {
  const theme = useTheme();
  const monaco = useMonaco();
  const { config } = useMyApiConfig();
  const luceneCompletion = useLuceneCompletionProvider();
  const yamlCompletion = useYamlCompletionProvider();
  const eqlCompletion = useEQLCompletionProvider();

  const beforeEditorMount = useCallback((_monaco: Monaco) => {
    _monaco.languages.register({ id: 'lucene' });
    _monaco.languages.register({ id: 'eql' });
  }, []);

  useEffect(() => {
    if (!monaco) {
      return;
    }

    monaco.editor.getModels().forEach(model => model.setEOL(monaco.editor.EndOfLineSequence.LF));

    // Set the parsers
    const monarchLuceneDisposable = monaco.languages.setMonarchTokensProvider('lucene', LUCENE_TOKEN_PROVIDER);
    const monarchEQLDisposable = monaco.languages.setMonarchTokensProvider('eql', EQL_TOKEN_PROVIDER);

    // Add completion providers
    const luceneCompletionDisposable = monaco.languages.registerCompletionItemProvider('lucene', luceneCompletion);
    const yamlCompletionDisposable = monaco.languages.registerCompletionItemProvider('yaml', yamlCompletion);
    const eqlCompletionDisposable = monaco.languages.registerCompletionItemProvider('eql', eqlCompletion);

    return () => {
      luceneCompletionDisposable?.dispose();
      yamlCompletionDisposable?.dispose();
      eqlCompletionDisposable?.dispose();
      monarchEQLDisposable?.dispose();
      monarchLuceneDisposable?.dispose();
    };
  }, [config.lookups, eqlCompletion, luceneCompletion, monaco, yamlCompletion]);

  useEffect(() => {
    if (!monaco || !language) {
      return;
    }

    const disposable = monaco.editor.onDidCreateModel(model => {
      if (model.getLanguageId() === 'markdown') {
        return;
      }

      monaco.editor.setModelLanguage(model, language);
    });

    monaco.editor.getModels().forEach(model => {
      if (model.getLanguageId() === 'markdown') {
        return;
      }

      monaco.editor.setModelLanguage(model, language);
    });

    return disposable.dispose;
  }, [language, monaco]);

  const options: editor.IStandaloneEditorConstructionOptions = useMemo(
    () => ({
      readOnly: !setQuery,
      fontSize,
      ...editorOptions
    }),
    [setQuery, fontSize, editorOptions]
  );

  return (
    <ThemedEditor
      height={height}
      width={width}
      theme={theme.palette.mode === 'light' ? 'howler' : 'howler-dark'}
      value={query}
      onChange={value => setQuery(value)}
      beforeMount={beforeEditorMount}
      onMount={onMount}
      options={options}
    />
  );
};

export default memo(QueryEditor);
