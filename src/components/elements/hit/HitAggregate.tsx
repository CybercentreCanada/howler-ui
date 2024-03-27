import { Alert, AlertTitle, Box, Chip, Divider, Fade, Grid, Stack, Typography } from '@mui/material';
import api from 'api';
import { HowlerSearchResponse } from 'api/search';
import { FieldContext } from 'components/app/providers/FieldProvider';
import { TemplateContext } from 'components/app/providers/TemplateProvider';
import useMyApi from 'components/hooks/useMyApi';
import { useMyLocalStorageItem } from 'components/hooks/useMyLocalStorage';
import { Hit } from 'models/entities/generated/Hit';
import { FC, useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { StorageKey } from 'utils/constants';
import { getTimeRange } from 'utils/utils';
import HitGraph from './aggregate/HitGraph';

const HitAggregate: FC<{
  query: string;
  response?: HowlerSearchResponse<Hit>;
  execute?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
}> = ({ query, response, execute = true, onStart, onComplete }) => {
  const { t } = useTranslation();
  const { getMatchingTemplate, getTemplates } = useContext(TemplateContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const { dispatchApi } = useMyApi();
  const { hitFields } = useContext(FieldContext);
  const pageCount = useMyLocalStorageItem(StorageKey.PAGE_COUNT, 25)[0];

  const [keyCounts, setKeyCounts] = useState<{ [key: string]: number }>({});
  const [aggregateResults, setAggregateResults] = useState<{ [key: string]: { [value: string]: number } }>({});

  const performAggregation = useCallback(async () => {
    if (onStart) {
      onStart();
    }

    setAggregateResults({});

    try {
      // Get a list of every key in every template of the hits we're searching
      const _keyCounts = (response?.items ?? [])
        .flatMap(h => getMatchingTemplate(h)?.keys ?? [])
        // Take that array and reduce it to unique keys and the number of times we see it
        .reduce((acc, val) => {
          if (acc[val]) {
            acc[val]++;
          } else {
            acc[val] = 1;
          }

          return acc;
        }, {} as { [index: string]: number });

      // We'll save this for later
      setKeyCounts(_keyCounts);

      // Sort the fields based on the number of occurrences
      const sortedKeys = Object.keys(_keyCounts).sort((a, b) => _keyCounts[b] - _keyCounts[a]);

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
  }, [dispatchApi, getMatchingTemplate, onComplete, onStart, pageCount, query, response?.items]);

  const setSearch = useCallback(
    (key, value) => {
      searchParams.set('query', `${key}:${value}`);
      setSearchParams(searchParams);
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    getTemplates();
  }, [getTemplates]);

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
        {Object.keys(aggregateResults).length < 1 && (
          <Alert severity="info" variant="outlined">
            <AlertTitle>{t('hit.summary.aggregate.nokeys.title')}</AlertTitle>
            {t('hit.summary.aggregate.nokeys.description')}
          </Alert>
        )}
        {Object.keys(aggregateResults).flatMap(key => [
          <Fade in key={key + '-refs'}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography key={key + '-title'} variant="body1">
                {key}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({keyCounts[key]} {t('references')})
              </Typography>
            </Stack>
          </Fade>,
          <Fade in key={key + '-results'}>
            {hitFields.find(f => f.key === key)?.type !== 'date' ? (
              <Box>
                <Grid container key={key + '-list'} style={{ marginTop: 0 }} sx={{ mr: 1 }} spacing={1}>
                  {Object.keys(aggregateResults[key]).map(_key => (
                    <Grid key={_key} item xs="auto">
                      <Chip
                        size="small"
                        label={`${_key} (${aggregateResults[key][_key]})`}
                        onClick={() => setSearch(key, `"${_key}"`)}
                      />
                    </Grid>
                  ))}
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

export default HitAggregate;
