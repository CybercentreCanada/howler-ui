import { CenterFocusWeak, Refresh } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import api from 'api';
import type { Chart, ChartDataset, ChartOptions } from 'chart.js';
import 'chartjs-adapter-moment';
import useMyApi from 'components/hooks/useMyApi';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import useMyChart from 'components/hooks/useMyChart';
import { capitalize } from 'lodash';
import moment from 'moment';
import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Scatter } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { stringToColor } from 'utils/utils';

const MAX_ROWS = 2500;
const OVERRIDE_ROWS = 10000;
const MAX_QUERY_SIZE = 50000;
const FILTER_FIELDS = [
  'howler.analytic',
  'howler.status',
  'howler.escalation',
  'howler.assessment',
  'howler.detection'
];

const HitGraph: FC<{ query: string; execute?: boolean }> = ({ query, execute = true }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { dispatchApi } = useMyApi();
  const { scatter } = useMyChart();
  const { config } = useMyApiConfig();
  const [searchParams, setSearchParams] = useSearchParams();

  const chartRef = useRef<Chart<'scatter'>>();

  const [loading, setLoading] = useState(false);
  const [filterField, setFilterField] = useState<string>(FILTER_FIELDS[0]);
  const [data, setData] = useState<ChartDataset<'scatter'>[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [override, setOverride] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);

  const [escalationFilter, setEscalationFilter] = useState<string>(null);

  const performQuery = useCallback(async () => {
    setLoading(true);
    setSearchTotal(0);

    try {
      const total = (
        await dispatchApi(
          api.search.count.hit.post({
            query
          })
        )
      ).count;

      if (total > MAX_QUERY_SIZE) {
        setDisabled(true);
        setSearchTotal(total);
        return;
      } else {
        setDisabled(false);
      }

      const subQueries = [query || 'howler.id:*'];

      if (escalationFilter) {
        subQueries.push(`howler.escalation:${escalationFilter}`);
      }

      const graphQuery = subQueries.map(_query => `(${_query})`).join(' AND ');

      const _data = await dispatchApi(
        api.search.grouped.hit.post(filterField, {
          query: graphQuery,
          fl: 'event.created,howler.assessment,howler.analytic,howler.detection,howler.outline.threat,howler.outline.target,howler.outline.summary,howler.id',
          // We want a generally random sample across all date ranges, so we use hash.
          // If we used event.created instead, when 1 million hits/hour are created, you'd only see hits from this past minute
          sort: 'howler.hash desc',
          group_sort: 'howler.hash desc',
          limit: override ? OVERRIDE_ROWS : MAX_ROWS,
          rows: override ? OVERRIDE_ROWS : MAX_ROWS
        })
      );

      if (_data.total > MAX_ROWS && !override) {
        setShowWarning(true);
      }

      const processed = _data.items.map(category => {
        const label = capitalize(category.value ?? 'None');

        return {
          label: `${label} (${category.total})`,
          data: category.items.map(hit => {
            const createdMoment = moment(hit.event?.created ?? hit.timestamp);

            return {
              x: createdMoment.clone().hour(0).minute(0).second(0).toISOString(),
              y: createdMoment.hour() + createdMoment.minute() / 60 + createdMoment.second() / 3600,
              hit
            };
          }) as any[],
          borderColor: theme.palette.divider,
          pointRadius: 5,
          backgroundColor: alpha(stringToColor(label), 0.6)
        };
      });

      setData(processed);
    } finally {
      setLoading(false);
    }
  }, [dispatchApi, escalationFilter, filterField, override, query, theme.palette.divider]);

  useEffect(() => {
    if (!query || !execute) {
      return;
    }

    performQuery();
  }, [execute, performQuery, query]);

  const options: ChartOptions<'scatter'> = useMemo(() => {
    const parentOptions = scatter('hit.summary.title', 'hit.summary.subtitle');

    return {
      ...parentOptions,
      animation: false,
      onClick: (__, elements) => {
        const ids = elements.map(element => (data[element.datasetIndex].data[element.index] as any).hit.howler.id);
        if (ids.length < 1) {
          return;
        }

        if (ids.length < 2) {
          searchParams.set('selected', ids[0]);
        } else {
          searchParams.set('query', `howler.id:(${ids.join(' OR ')})`);
        }

        setSearchParams(new URLSearchParams(searchParams));
      },
      onHover: (event, chartElement) =>
        ((event.native.target as any).style.cursor = chartElement[0] ? 'pointer' : 'default'),
      interaction: {
        mode: 'nearest'
      },
      plugins: {
        ...parentOptions.plugins,
        tooltip: {
          callbacks: {
            title: entries => `${entries.length} ${t('hits')}`,
            label: entry =>
              `${(entry.raw as any).hit.howler.analytic}: ${(entry.raw as any).hit.howler.detection} (${moment(
                (entry.raw as any).hit.event.created
              ).format('MMM D HH:mm:ss')})`,
            afterLabel: entry =>
              `${(entry.raw as any).hit.howler.outline.threat} ${(entry.raw as any).hit.howler.outline.target}`
          }
        },
        zoom: {
          ...parentOptions.plugins.zoom,
          zoom: {
            ...parentOptions.plugins.zoom.zoom,
            mode: 'y'
          },
          limits: {
            y: { min: 0, max: 24 }
          }
        }
      },
      scales: {
        ...parentOptions.scales,
        y: {
          ...parentOptions.scales.y,
          grid: {
            display: true,
            color: theme.palette.divider
          },
          ticks: {
            callback: (value: number) => {
              const [hour, minute] = [Math.floor(value), Math.floor((value - Math.floor(value)) * 60)];

              return moment().hour(hour).minute(minute).format('HH:mm');
            }
          }
        }
      }
    };
  }, [data, scatter, searchParams, setSearchParams, t, theme.palette.divider]);

  return (
    <Stack sx={{ position: 'relative' }} spacing={1}>
      <Scatter
        ref={chartRef}
        options={options}
        data={{
          datasets: data
        }}
      />
      <Stack direction="row" spacing={1} sx={{ pt: 2 }}>
        <Autocomplete
          sx={{ flex: 1 }}
          options={FILTER_FIELDS}
          renderInput={params => <TextField {...params} label={t('hit.summary.filter.field')} size="small" />}
          value={filterField}
          onChange={(__, option) => setFilterField(option)}
        />
        <Autocomplete
          sx={{ flex: 1 }}
          options={config.lookups['howler.escalation']}
          renderInput={params => <TextField {...params} label={t('hit.summary.filter.escalation')} size="small" />}
          value={escalationFilter}
          onChange={(__, option) => setEscalationFilter(option)}
        />
      </Stack>
      {showWarning && (
        <Alert
          severity="warning"
          variant="outlined"
          action={
            <Button
              variant="outlined"
              color="warning"
              onClick={() => {
                setOverride(true);
                setShowWarning(false);
              }}
            >
              {t('hit.summary.render.limit.override')}
            </Button>
          }
        >
          <AlertTitle>{t('hit.summary.render.limit', { number: MAX_ROWS })}</AlertTitle>
          {t(`hit.summary.render.limit.description`, { number: MAX_ROWS, max: OVERRIDE_ROWS })}
        </Alert>
      )}
      {disabled && (
        <Box
          sx={{
            position: 'absolute',
            top: theme.spacing(-1),
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: alpha(theme.palette.background.paper, 0.75),
            zIndex: 11,
            display: 'flex',
            alignItems: 'start'
          }}
        >
          <Alert
            severity="warning"
            variant="outlined"
            sx={{ m: 3, mr: 7, backgroundColor: theme.palette.background.paper }}
          >
            <AlertTitle>{t('hit.summary.server.limit', { number: searchTotal })}</AlertTitle>
            {t(`hit.summary.server.limit.description`, { max: MAX_QUERY_SIZE })}
          </Alert>
        </Box>
      )}
      <Stack direction="row" sx={{ position: 'absolute', right: theme.spacing(1), top: 0, zIndex: 12 }} spacing={1}>
        <Tooltip title={t('hit.summary.zoom.reset')}>
          <IconButton disabled={loading} onClick={() => chartRef.current?.resetZoom()}>
            <CenterFocusWeak />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('hit.summary.refresh')}>
          <IconButton disabled={loading} onClick={performQuery}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
};

export default HitGraph;
