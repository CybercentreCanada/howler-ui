import { OpenInNew } from '@mui/icons-material';
import { Autocomplete, Grid, Tab, Tabs, TextField, Typography } from '@mui/material';
import api from 'api';
import TuiIconButton from 'commons/addons/display/buttons/TuiIconButton';
import PageCenter from 'commons/components/pages/PageCenter';
import useMyApi from 'components/hooks/useMyApi';
import { Analytic } from 'models/entities/generated/Analytic';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import AnalyticComments from './AnalyticComments';
import AnalyticHitComments from './AnalyticHitComments';
import AnalyticOverview from './AnalyticOverview';

const AnalyticDetails = () => {
  const { t } = useTranslation();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dispatchApi } = useMyApi();

  const [analytic, setAnalytic] = useState<Analytic>(null);
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'overview');

  useEffect(() => {
    dispatchApi(api.analytic.get(params.id) as Promise<Analytic>).then(setAnalytic);
  }, [dispatchApi, params.id]);

  const [filter, _setFilter] = useState<string>(searchParams.get('filter') ?? null);
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
        <Typography variant="h3" mb={3}>
          {analytic?.name}
          <TuiIconButton sx={{ ml: 1 }} route={`/hits?query=howler.analytic:"${analytic?.name}"`}>
            <OpenInNew />
          </TuiIconButton>
        </Typography>
        <Grid container>
          <Grid item xs={12} md={9}>
            <Tabs value={tab} onChange={(_, _tab) => setTab(_tab)}>
              <Tab label={t('route.analytics.tab.overview')} value="overview" />
              <Tab label={t('route.analytics.tab.comments')} value="comments" />
              <Tab label={t('route.analytics.tab.hit_comments')} value="hit_comments" />
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
            overview: <AnalyticOverview analytic={analytic} setAnalytic={setAnalytic} />
          }[tab]
        }
      </div>
    </PageCenter>
  );
};

export default AnalyticDetails;
