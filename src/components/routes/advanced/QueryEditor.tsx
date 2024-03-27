import type { Monaco } from '@monaco-editor/react';
import { Editor, useMonaco } from '@monaco-editor/react';
import { useTheme } from '@mui/material';
import useThemeBuilder from 'commons/components/utils/hooks/useThemeBuilder';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import { editor } from 'monaco-editor';
import { FC, memo, useCallback, useEffect, useMemo } from 'react';
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
  const themeBuilder = useThemeBuilder();
  const theme = useTheme();
  const monaco = useMonaco();
  const { config } = useMyApiConfig();
  const luceneCompletion = useLuceneCompletionProvider();
  const yamlCompletion = useYamlCompletionProvider();
  const eqlCompletion = useEQLCompletionProvider();

  const beforeEditorMount = useCallback(
    (_monaco: Monaco) => {
      let lightBackground = themeBuilder.lightTheme.palette.background.paper;
      // monaco doesn't like colours in the form #fff, with only three digits.
      if (lightBackground.startsWith('#') && lightBackground.length < 7) {
        lightBackground = lightBackground.replace(/(\w)/g, '$1$1');
      }

      _monaco.editor.defineTheme('howler', {
        base: 'vs',
        inherit: true,
        rules: [
          {
            token: 'operator',
            foreground: themeBuilder.lightTheme.palette.warning.light.toUpperCase().replaceAll('#', '')
          },
          {
            token: 'string.invalid',
            foreground: themeBuilder.lightTheme.palette.error.main.toUpperCase().replaceAll('#', '')
          },
          {
            token: 'invalid',
            foreground: themeBuilder.lightTheme.palette.error.main.toUpperCase().replaceAll('#', '')
          },
          {
            token: 'boolean',
            foreground: themeBuilder.lightTheme.palette.success.main.toUpperCase().replaceAll('#', '')
          }
        ],
        colors: {
          'editor.background': lightBackground
        }
      });

      let darkBackground = themeBuilder.darkTheme.palette.background.paper;
      // monaco doesn't like colours in the form #fff, with only three digits.
      if (darkBackground.startsWith('#') && darkBackground.length < 7) {
        darkBackground = darkBackground.replace(/(\w)/g, '$1$1');
      }
      _monaco.editor.defineTheme('howler-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          {
            token: 'operator',
            foreground: themeBuilder.darkTheme.palette.warning.light.toUpperCase().replaceAll('#', '')
          },
          {
            token: 'string.invalid',
            foreground: themeBuilder.darkTheme.palette.error.main.toUpperCase().replaceAll('#', '')
          },
          {
            token: 'invalid',
            foreground: themeBuilder.darkTheme.palette.error.main.toUpperCase().replaceAll('#', '')
          },
          {
            token: 'boolean',
            foreground: themeBuilder.darkTheme.palette.success.main.toUpperCase().replaceAll('#', '')
          }
        ],
        colors: {
          'editor.background': darkBackground
        }
      });

      _monaco.languages.register({ id: 'lucene' });
      _monaco.languages.register({ id: 'eql' });
    },
    [themeBuilder]
  );

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
    if (!monaco) {
      return;
    }

    monaco.editor.setTheme(theme.palette.mode === 'light' ? 'howler' : 'howler-dark');
  }, [monaco, theme.palette.background.paper, theme.palette.mode]);

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
      automaticLayout: true,
      readOnly: !setQuery,
      minimap: { enabled: false },
      overviewRulerBorder: false,
      renderLineHighlight: 'gutter',
      fontSize,
      autoClosingBrackets: 'always',
      ...editorOptions
    }),
    [setQuery, fontSize, editorOptions]
  );

  return (
    <Editor
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
