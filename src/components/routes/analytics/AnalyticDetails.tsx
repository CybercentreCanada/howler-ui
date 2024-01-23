import { OpenInNew, SsidChart } from '@mui/icons-material';
import { Autocomplete, Divider, Grid, Stack, Tab, Tabs, TextField, Tooltip, Typography, useTheme } from '@mui/material';
import api from 'api';
import TuiIconButton from 'commons/addons/display/buttons/TuiIconButton';
import PageCenter from 'commons/components/pages/PageCenter';
import HowlerAvatar from 'components/elements/display/HowlerAvatar';
import useMyApi from 'components/hooks/useMyApi';
import { Analytic } from 'models/entities/generated/Analytic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import AnalyticComments from './AnalyticComments';
import AnalyticHitComments from './AnalyticHitComments';
import AnalyticOverview from './AnalyticOverview';
import CorrelationView from './CorrelationView';

const AnalyticDetails = () => {
  const { t } = useTranslation();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dispatchApi } = useMyApi();
  const theme = useTheme();

  const [analytic, setAnalytic] = useState<Analytic>(null);
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'overview');

  const filteredContributors = useMemo(
    () => (analytic?.contributors ?? []).filter(user => user !== analytic?.owner),
    [analytic?.contributors, analytic?.owner]
  );

  useEffect(() => {
    dispatchApi(api.analytic.get(params.id) as Promise<Analytic>).then(setAnalytic);
  }, [dispatchApi, params.id]);

  const [filter, _setFilter] = useState<string | null>(searchParams.get('filter') ?? null);
  const setFilter = useCallback(
    (detection: string) => {
      if (filter === detection) {
        _setFilter(null);
      } else {
        _setFilter(detection);
      }
    },
    [filter]
  );

  useEffect(() => {
    if (searchParams.get('tab') !== tab) {
      searchParams.set('tab', tab);
    }

    if (searchParams.get('filter') !== filter) {
      if (filter) {
        searchParams.set('filter', filter);
      } else {
        searchParams.delete('filter');
      }
    }

    setSearchParams(searchParams, { replace: true });
  }, [filter, searchParams, setSearchParams, tab]);

  return (
    <PageCenter maxWidth="1500px" textAlign="left" height="100%">
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h3" mb={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <span>{analytic?.name}</span>
            {analytic?.correlation && (
              <Tooltip title={t('route.analytics.correlation')}>
                <SsidChart fontSize="large" color="info" />
              </Tooltip>
            )}
            <TuiIconButton size="large" route={`/hits?query=howler.analytic:"${analytic?.name}"`}>
              <OpenInNew />
            </TuiIconButton>
          </Stack>
        </Typography>
        <Stack direction="row" spacing={1} divider={<Divider flexItem orientation="vertical" />} mb={2}>
          <Stack spacing={1}>
            <Typography variant="body1" color="text.secondary">
              {t('owner')}
            </Typography>
            <HowlerAvatar userId={analytic?.owner} />
          </Stack>
          {filteredContributors.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="body1" color="text.secondary">
                {t('route.analytics.contributors')}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                {filteredContributors.map(user => (
                  <HowlerAvatar userId={user} />
                ))}
              </Stack>
            </Stack>
          )}
          {analytic?.correlation_crontab && (
            <Stack spacing={1}>
              <Typography variant="body1" color="text.secondary">
                {t('correlation.interval')}
              </Typography>
              <code
                style={{
                  backgroundColor: theme.palette.background.paper,
                  padding: theme.spacing(0.5),
                  alignSelf: 'start',
                  borderRadius: theme.shape.borderRadius,
                  border: `thin solid ${theme.palette.divider}`
                }}
              >
                {analytic.correlation_crontab}
              </code>
            </Stack>
          )}
        </Stack>
        <Grid container>
          <Grid item xs={12} md={9}>
            <Tabs value={tab} onChange={(_, _tab) => setTab(_tab)}>
              <Tab label={t('route.analytics.tab.overview')} value="overview" />
              <Tab label={t('route.analytics.tab.comments')} value="comments" />
              <Tab label={t('route.analytics.tab.hit_comments')} value="hit_comments" />
              {analytic?.correlation && <Tab label={t('route.analytics.tab.correlation')} value="correlation" />}
            </Tabs>
          </Grid>

          {['comments', 'hit_comments'].includes(tab) && (
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={analytic?.detections ?? []}
                renderInput={param => <TextField {...param} label="Detection" />}
                value={filter}
                onChange={(_, v) => setFilter(v)}
              />
            </Grid>
          )}
        </Grid>
        {
          {
            comments: <AnalyticComments analytic={analytic} setAnalytic={setAnalytic} />,
            hit_comments: <AnalyticHitComments analytic={analytic} />,
            overview: <AnalyticOverview analytic={analytic} setAnalytic={setAnalytic} />,
            correlation: <CorrelationView analytic={analytic} setAnalytic={setAnalytic} />
          }[tab]
        }
      </div>
    </PageCenter>
  );
};

export default AnalyticDetails;
