import { Refresh } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Chip, Divider, Fade, Grid, Stack, Typography } from '@mui/material';
import { SearchField } from 'api/search/fields';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { getTimeRange } from 'utils/utils';

const Detailed: FC<{
  loading: boolean;
  performAggregation: () => void;
  setSearch: (key, value) => void;
  aggregateResults: {
    [key: string]: {
      [value: string]: number;
    };
  };
  keyCounts: { [key: string]: number };
  hitFields: SearchField[];
}> = ({ loading, performAggregation, aggregateResults, hitFields, keyCounts, setSearch }) => {
  const { t } = useTranslation();

  return (
    <Stack sx={{ p: 2, maxWidth: '100%', overflow: 'hidden' }} spacing={1}>
      <LoadingButton
        loadingPosition="end"
        loading={loading}
        variant="outlined"
        endIcon={<Refresh />}
        onClick={() => performAggregation()}
        sx={{ alignSelf: 'start' }}
      >
        {t('hit.panel.aggregation.run')}
      </LoadingButton>
      <Divider orientation="horizontal" />
      {Object.keys(aggregateResults).flatMap(key => [
        <Fade in>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography key={key + '-title'} variant="body1">
              {key}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({keyCounts[key]} {t('references')})
            </Typography>
          </Stack>
        </Fade>,
        <Fade in>
          {hitFields.find(f => f.key === key)?.type !== 'date' ? (
            <Grid container key={key + '-list'} style={{ marginTop: 0 }} spacing={1}>
              {Object.keys(aggregateResults[key]).map(_key => (
                <Grid item xs="auto">
                  <Chip
                    key={_key}
                    size="small"
                    label={`${_key} (${aggregateResults[key][_key]})`}
                    onClick={() => setSearch(key, `"${_key}"`)}
                  />
                </Grid>
              ))}
            </Grid>
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
  );
};

export default Detailed;
