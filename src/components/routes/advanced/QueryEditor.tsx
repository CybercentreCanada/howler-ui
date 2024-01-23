import type { Monaco } from '@monaco-editor/react';
import { Editor, useMonaco } from '@monaco-editor/react';
import { useTheme } from '@mui/material';
import { FieldContext } from 'components/app/providers/FieldProvider';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import { FC, useCallback, useContext, useEffect } from 'react';
import useEQLCompletionProvider from './eqlCompletionProvider';
import EQL_TOKEN_PROVIDER from './eqlTokenProvider';
import useLuceneCompletionProvider from './luceneCompletionProvider';
import LUCENE_TOKEN_PROVIDER from './luceneTokenProvider';
import useYamlCompletionProvider from './yamlCompletionProvider';

const QueryEditor: FC<{ query: string; language: string; setQuery?: (newQuery: string) => void }> = ({
  query,
  setQuery,
  language
}) => {
  const theme = useTheme();
  const monaco = useMonaco();
  const { hitFields } = useContext(FieldContext);
  const { config } = useMyApiConfig();
  const luceneCompletion = useLuceneCompletionProvider();
  const yamlCompletion = useYamlCompletionProvider();
  const eqlCompletion = useEQLCompletionProvider();

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
      _monaco.languages.register({ id: 'eql' });
    },
    [theme]
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
  }, [config.lookups, eqlCompletion, hitFields, luceneCompletion, monaco, yamlCompletion]);

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
  }, [monaco, language]);

  return (
    <Editor
      height="100%"
      width="100%"
      theme="howler"
      value={query}
      onChange={value => setQuery(value)}
      beforeMount={beforeEditorMount}
      options={{
        readOnly: !setQuery,
        minimap: { enabled: false },
        overviewRulerBorder: false,
        renderLineHighlight: 'gutter',
        fontSize: 16,
        autoClosingBrackets: 'always'
      }}
    />
  );
};

export default QueryEditor;
