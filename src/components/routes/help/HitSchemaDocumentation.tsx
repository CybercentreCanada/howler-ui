import { Clear } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import Throttler from 'commons/addons/utils/Throttler';
import Markdown from 'components/elements/display/Markdown';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import raw from 'raw.macro';
import { ChangeEventHandler, FC, memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

const THROTTLER = new Throttler(300);

const TableHeader: FC = () => {
  const { t } = useTranslation();

  return (
    <TableHead>
      <TableRow>
        <TableCell width="100">{t('help.hit.schema.table.name')}</TableCell>
        <TableCell>{t('help.hit.schema.table.type')}</TableCell>
        <TableCell>{t('help.hit.schema.table.description')}</TableCell>
      </TableRow>
    </TableHead>
  );
};

const RowEntry: FC<{ field: string }> = memo(({ field }) => {
  const { t } = useTranslation();
  const { config } = useMyApiConfig();

  return (
    <TableRow>
      <TableCell width="350" style={{ wordBreak: 'break-word' }}>
        <Stack direction="row" spacing={1}>
          <Typography>{field}</Typography>
          {config.indexes.hit[field].list && <Chip color="warning" size="small" label={t('list')} />}
          {config.indexes.hit[field].deprecated && <Chip color="error" size="small" label={t('deprecated')} />}
        </Stack>
      </TableCell>
      <TableCell width="75">
        <Typography>{config.indexes.hit[`${field}.key_a`] ? 'dict' : config.indexes.hit[field].type}</Typography>
      </TableCell>
      <TableCell>
        <Markdown md={config.indexes.hit[field].description ?? t('help.hit.schema.description.missing')} />
        {config.indexes.hit[field].deprecated_description && (
          <Alert variant="outlined" color="error">
            <AlertTitle>{t('deprecation.instructions')}</AlertTitle>
            <Markdown md={config.indexes.hit[field].deprecated_description} />
          </Alert>
        )}
      </TableCell>
    </TableRow>
  );
});

const HitSchemaDocumentation: FC = () => {
  const { i18n, t } = useTranslation();
  const { config } = useMyApiConfig();

  const [searchParams, setSearchParams] = useSearchParams();
  const [phrase, setPhrase] = useState(searchParams.get('phrase') || '');

  const md = useMemo(() => {
    return i18n.language === 'en' ? raw(`./markdown/en/schema.md`) : raw(`./markdown/fr/schema.md`);
  }, [i18n.language]);

  const onSearchChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback(
    e => {
      setPhrase(e.target.value);
      THROTTLER.debounce(() => {
        if (e.target.value) {
          searchParams.set('phrase', e.target.value);
        } else {
          searchParams.delete('phrase');
        }
        setSearchParams(searchParams);
      });
    },
    [searchParams, setSearchParams]
  );

  const onClear = useCallback(() => {
    setPhrase('');
    searchParams.delete('phrase');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const filterSearch = useCallback(
    (field: string) => {
      if (!phrase) {
        return true;
      }

      const _phrase = phrase.toLowerCase();
      if (field.includes(_phrase)) {
        return true;
      }

      const indexData = config.indexes.hit[field];
      if (indexData.type.includes(_phrase) || indexData.description?.toLowerCase().includes(_phrase)) {
        return true;
      }

      return false;
    },
    [config.indexes.hit, phrase]
  );

  const howlerFields = useMemo(
    () =>
      Object.keys(config.indexes.hit)
        .filter(field => field.startsWith('howler') && !field.endsWith('key_a'))
        .filter(filterSearch),
    [config.indexes.hit, filterSearch]
  );

  const assemblylineFields = useMemo(
    () =>
      Object.keys(config.indexes.hit)
        .filter(field => field.startsWith('assemblyline') && !field.endsWith('key_a'))
        .filter(filterSearch),
    [config.indexes.hit, filterSearch]
  );

  const ecsFields = useMemo(
    () =>
      Object.keys(config.indexes.hit)
        .filter(field => !field.startsWith('howler') && !field.startsWith('assemblyline') && !field.endsWith('key_a'))
        .filter(filterSearch),
    [config.indexes.hit, filterSearch]
  );

  return (
    <Stack spacing={1}>
      <Markdown md={md} />

      <Box sx={{ py: 2 }} />

      <TextField
        fullWidth
        value={phrase}
        onChange={onSearchChange}
        label={t('help.hit.schema.search.prompt')}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton disabled={!phrase} onClick={onClear}>
                <Clear />
              </IconButton>
            </InputAdornment>
          )
        }}
      />

      {howlerFields.length > 0 && (
        <>
          <Typography variant="h5" pt={3}>
            {t('help.hit.schema.table.howler')}
          </Typography>

          <Table size="small">
            <TableHeader />
            <TableBody>
              {howlerFields.map(field => (
                <RowEntry key={field} field={field} />
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {assemblylineFields.length > 0 && (
        <>
          <Typography variant="h5" pt={3}>
            {t('help.hit.schema.table.assemblyline')}
          </Typography>

          <Table size="small">
            <TableHeader />
            <TableBody>
              {assemblylineFields.map(field => (
                <RowEntry key={field} field={field} />
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {ecsFields.length > 0 && (
        <>
          <Typography variant="h5" pt={3}>
            {t('help.hit.schema.table.ecs')}
          </Typography>

          <Table size="small">
            <TableHeader />
            <TableBody>
              {ecsFields.map(field => (
                <RowEntry key={field} field={field} />
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Stack>
  );
};
export default HitSchemaDocumentation;
