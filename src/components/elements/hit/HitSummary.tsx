import { InfoOutlined } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  Fade,
  Grid,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import api from 'api';
import type { HowlerSearchResponse } from 'api/search';
import { FieldContext } from 'components/app/providers/FieldProvider';
import { TemplateContext } from 'components/app/providers/TemplateProvider';
import useMyApi from 'components/hooks/useMyApi';
import { useMyLocalStorageItem } from 'components/hooks/useMyLocalStorage';
import type { Hit } from 'models/entities/generated/Hit';
import type { FC } from 'react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { StorageKey } from 'utils/constants';
import { getTimeRange } from 'utils/utils';
import HitGraph from './aggregate/HitGraph';

const HitSummary: FC<{
  query: string;
  response?: HowlerSearchResponse<Hit>;
  execute?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
}> = ({ query, response, execute = true, onStart, onComplete }) => {
  const { t } = useTranslation();
  const { getMatchingTemplate } = useContext(TemplateContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const { dispatchApi } = useMyApi();
  const { hitFields } = useContext(FieldContext);
  const pageCount = useMyLocalStorageItem(StorageKey.PAGE_COUNT, 25)[0];
  const [providedVal, setProvidedVal] = useState('');

  const [keyCounts, setKeyCounts] = useState<{ [key: string]: { count: number; sources: string[] } }>({});
  const [aggregateResults, setAggregateResults] = useState<{
    [key: string]: { [value: string]: number };
  }>({});

  const performAggregation = useCallback(
    async (value?: string) => {
      if (onStart) {
        onStart();
      }

      setAggregateResults({});

      try {
        // Get a list of every key in every template of the hits we're searching
        const _keyCounts = (response?.items ?? [])
          .flatMap(h => {
            const matchingTemplate = getMatchingTemplate(h);
            if (matchingTemplate && value && !matchingTemplate.keys.includes(value)) {
              matchingTemplate.keys.push(value + 'custom');
            }
            return (matchingTemplate?.keys ?? [])
              .filter(key => !['howler.id', 'howler.hash'].includes(key))
              .map(key => ({
                key,
                source: `${matchingTemplate.analytic}: ${matchingTemplate.detection ?? t('any')}`
              }));
          })

          // Take that array and reduce it to unique keys and the number of times we see it,
          // as well as the templates we sourced this key from
          .reduce(
            (acc, val) => {
              if (acc[val.key]) {
                acc[val.key].count++;

                if (!acc[val.key].sources.includes(val.source) && !val.key.endsWith('custom')) {
                  acc[val.key].sources.push(val.source);
                }
              } else if (val.key.endsWith('custom')) {
                const trueVal = val.key.replace('custom', '');
                delete acc[val.key];
                acc[trueVal] = {
                  count: -1,
                  sources: [val.source]
                };
              } else {
                acc[val.key] = {
                  count: 1,
                  sources: [val.source]
                };
              }

              return acc;
            },
            {} as { [index: string]: { count: number; sources: string[] } }
          );

        // We'll save this for later
        setKeyCounts(_keyCounts);

        // Sort the fields based on the number of occurrences
        const sortedKeys = Object.keys(_keyCounts).sort(
          (a, b) => (_keyCounts[b]?.count ?? 0) - (_keyCounts[a]?.count ?? 0)
        );

        // Facet each field
        for (const key of sortedKeys) {
          const result = await dispatchApi(
            api.search.facet.hit.post(key, {
              query,
              rows: pageCount
            }),
            {
              throwError: false,
              logError: true,
              showError: false
            }
          );

          if (result) {
            setAggregateResults(_results => ({
              ..._results,
              [key]: result
            }));
          }
        }
      } finally {
        if (onComplete) {
          onComplete();
        }
      }
    },
    [dispatchApi, getMatchingTemplate, onComplete, onStart, pageCount, query, response?.items, t]
  );

  const setSearch = useCallback(
    (key, value) => {
      searchParams.set('query', `${key}:${value}`);
      setSearchParams(searchParams);
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    if (!query || !execute) {
      return;
    }

    performAggregation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, execute]);

  return (
    <Stack sx={{ mx: 2, height: '100%' }} spacing={1}>
      <Typography variant="h6">{t('hit.summary.aggregate.title')}</Typography>
      <Divider flexItem />
      <HitGraph query={query} execute={execute} />
      <Divider flexItem />
      <Stack sx={{ overflow: 'auto' }} spacing={1}>
        <Stack direction="row" spacing={2} mb={2} alignItems="stretch">
          <Autocomplete
            fullWidth
            sx={{ minWidth: '175px' }}
            size="small"
            value={null}
            options={hitFields.map(_field => _field.key)}
            renderInput={_params => <TextField {..._params} label={t('hit.summary.adhoc')} />}
            onChange={(_, value) => setProvidedVal(value)}
          />
          <Button variant="outlined" onClick={() => performAggregation(providedVal)}>
            {t('button.add')}
          </Button>
        </Stack>
        {Object.keys(aggregateResults).length < 1 && (
          <Alert severity="info" variant="outlined">
            <AlertTitle>{t('hit.summary.aggregate.nokeys.title')}</AlertTitle>
            {t('hit.summary.aggregate.nokeys.description')}
          </Alert>
        )}
        {Object.keys(aggregateResults)
          .filter(key => !!keyCounts[key])
          .flatMap(key => [
            <Fade in key={key + '-refs'}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography key={key + '-title'} variant="body1">
                  {key}
                </Typography>
                {keyCounts[key]?.count < 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    ({t('hit.summary.adhoc.custom')})
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    ({keyCounts[key]?.count} {t('references')})
                  </Typography>
                )}

                <Tooltip
                  title={
                    <Stack>
                      <Typography variant="caption">{t('hit.summary.aggregate.sources')}</Typography>
                      {keyCounts[key].sources.map(source => (
                        <Typography key={source} variant="caption">
                          {source}
                        </Typography>
                      ))}
                    </Stack>
                  }
                >
                  <InfoOutlined fontSize="inherit" />
                </Tooltip>
              </Stack>
            </Fade>,
            <Fade in key={key + '-results'}>
              {hitFields.find(f => f.key === key)?.type !== 'date' ? (
                <Box>
                  <Grid container key={key + '-list'} style={{ marginTop: 0 }} sx={{ mr: 1 }} spacing={1}>
                    {Object.keys(aggregateResults[key]).map(_key => {
                      return <Grid key={_key} item xs="auto"></Grid>;
                    })}
                  </Grid>
                </Box>
              ) : (
                <Chip
                  size="small"
                  sx={theme => ({ ml: `${theme.spacing(1)} !important`, alignSelf: 'start' })}
                  label={getTimeRange(Object.keys(aggregateResults[key]))
                    .map(d => new Date(d).toLocaleString())
                    .join(' - ')}
                  onClick={() => setSearch(key, `[${getTimeRange(Object.keys(aggregateResults[key])).join(' TO ')}]`)}
                />
              )}
            </Fade>
          ])}
      </Stack>
    </Stack>
  );
};

export default HitSummary;
