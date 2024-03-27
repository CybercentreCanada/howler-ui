import { Add, Delete } from '@mui/icons-material';
import { Button, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { TuiPhrase } from 'commons/addons/controls';
import { FieldContext } from 'components/app/providers/FieldProvider';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import { default as _, default as lodash } from 'lodash';
import { Hit } from 'models/entities/generated/Hit';
import { memo, useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const TemplateEditor = ({
  hit,
  fields,
  onRemove,
  onAdd
}: {
  hit: Hit;
  fields: string[];
  onRemove: (field: string) => void;
  onAdd: (field: string) => void;
}) => {
  const { t } = useTranslation();
  const { config } = useMyApiConfig();
  const { getHitFields } = useContext(FieldContext);

  const [phrase, setPhrase] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const tryAddField = useCallback(() => {
    if (suggestions.includes(phrase)) {
      if (!fields.includes(phrase)) {
        onAdd(phrase);
        setPhrase('');
      }
    }
  }, [fields, onAdd, phrase, suggestions]);

  const checkForActions = useCallback(
    (e: any) => {
      if (e.isEnter) {
        tryAddField();
      }
    },
    [tryAddField]
  );

  useEffect(() => {
    getHitFields().then(suggestionFields => setSuggestions(suggestionFields.map(f => f.key)));
  }, [getHitFields]);

  return (
    <Stack spacing={1} width="100%" alignItems="stretch">
      {fields
        .map<[string, string]>(field => [field, lodash.get(hit, field)])
        .map(([field, data]) => {
          return (
            <Stack direction="row" spacing={1} key={field}>
              <Tooltip title={(config.indexes.hit[field].description ?? t('none')).split('\n')[0]}>
                <Typography variant="body1" fontWeight="bold">
                  {field}:
                </Typography>
              </Tooltip>
              <Typography variant="body1" whiteSpace="normal" sx={{ width: '100%', wordBreak: 'break-all' }}>
                {_.isObject(data) ? JSON.stringify(data) : data ?? 'N/A'}
              </Typography>
              <Tooltip title={t('button.delete')}>
                <IconButton size="medium" onClick={e => onRemove(field)} sx={{ marginLeft: 'auto' }}>
                  <Delete fontSize="medium" />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        })}
      <Stack direction="row" sx={{ '& > div': { flex: 1 } }} spacing={1}>
        <TuiPhrase
          suggestions={suggestions}
          value={phrase}
          onChange={setPhrase}
          onKeyDown={checkForActions}
          size="small"
        />
        <Button
          variant="outlined"
          size="small"
          sx={{ marginLeft: 'auto' }}
          startIcon={<Add fontSize="small" />}
          disabled={!suggestions.includes(phrase) || fields.includes(phrase)}
          onClick={tryAddField}
        >
          {t('button.add')}
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {t('route.templates.prompt')}
      </Typography>
    </Stack>
  );
};

export default memo(TemplateEditor);
