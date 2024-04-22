import { QueryStats, ViewAgenda } from '@mui/icons-material';
import {
  Box,
  CardContent,
  Collapse,
  IconButton,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import api from 'api';
import PageCenter from 'commons/components/pages/PageCenter';
import { AnalyticContext } from 'components/app/providers/AnalyticProvider';
import { RecievedDataType, SocketContext } from 'components/app/providers/SocketProvider';
import { TemplateContext } from 'components/app/providers/TemplateProvider';
import HowlerCard from 'components/elements/display/HowlerCard';
import JSONViewer from 'components/elements/display/JSONViewer';
import BundleButton from 'components/elements/display/icons/BundleButton';
import SocketBadge from 'components/elements/display/icons/SocketBadge';
import HitActions from 'components/elements/hit/HitActions';
import HitBanner from 'components/elements/hit/HitBanner';
import HitComments from 'components/elements/hit/HitComments';
import HitDetails from 'components/elements/hit/HitDetails';
import HitLabels from 'components/elements/hit/HitLabels';
import { HitLayout } from 'components/elements/hit/HitLayout';
import HitRelated from 'components/elements/hit/HitRelated';
import HitWorklog from 'components/elements/hit/HitWorklog';
import RelatedLink from 'components/elements/hit/related/RelatedLink';
import useMyApi from 'components/hooks/useMyApi';
import { useMyLocalStorageItem } from 'components/hooks/useMyLocalStorage';
import useMyUserList from 'components/hooks/useMyUserList';
import { Analytic } from 'models/entities/generated/Analytic';
import { Hit } from 'models/entities/generated/Hit';
import { HitUpdate } from 'models/socket/HitUpdate';
import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { StorageKey } from 'utils/constants';
import { getUserList } from 'utils/hitFunctions';
import { tryParse } from 'utils/utils';

export enum Orientation {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal'
}

const HitViewer: FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isUnderLg = useMediaQuery(theme.breakpoints.down('lg'));
  const [orientation, setOrientation] = useMyLocalStorageItem(StorageKey.VIEWER_ORIENTATION, Orientation.VERTICAL);
  const { dispatchApi } = useMyApi();
  const { addListener, removeListener } = useContext(SocketContext);
  const { refresh } = useContext(TemplateContext);
  const { getAnalyticFromName } = useContext(AnalyticContext);

  const [hit, setHit] = useState<Hit>(null);
  const [userIds, setUserIds] = useState<Set<string>>(new Set());
  const users = useMyUserList(userIds);
  const [tab, setTab] = useState<string>('hit_comments');
  const [analytic, setAnalytic] = useState<Analytic>();

  const fetchData = useCallback(async () => {
    try {
      const _hit = await dispatchApi(api.hit.get(params.id), { showError: true, throwError: true });
      setHit(_hit);
      setUserIds(getUserList(_hit));

      setAnalytic(await getAnalyticFromName(_hit.howler.analytic));
    } catch (err) {
      if (err.cause?.api_status_code === 404) {
        navigate('/404');
      }
    }
  }, [dispatchApi, params.id, getAnalyticFromName, navigate]);

  useEffect(() => {
    if (isUnderLg) {
      setOrientation(Orientation.HORIZONTAL, false);
    }
  }, [isUnderLg, setOrientation]);

  useEffect(() => {
    fetchData();
  }, [params.id, fetchData]);

  const onOrientationChange = useCallback(
    () => setOrientation(orientation === Orientation.VERTICAL ? Orientation.HORIZONTAL : Orientation.VERTICAL),
    [orientation, setOrientation]
  );

  const handler = useMemo(
    () => (data: RecievedDataType<HitUpdate>) => {
      if (data.hit?.howler.id === params.id) {
        setHit(data.hit);
        setUserIds(getUserList(data.hit));
      }
    },
    [params.id]
  );

  useEffect(() => {
    if (!hit) {
      return;
    }

    addListener<HitUpdate>('hitDetails', handler);

    return () => removeListener('hitDetails');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handler, hit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!hit) {
    return (
      <PageCenter>
        <Skeleton variant="rounded" height="520px" />
      </PageCenter>
    );
  }

  return (
    <PageCenter maxWidth="1500px">
      <Box
        sx={{
          display: 'grid',
          position: 'relative',
          gridTemplateColumns: `1fr ${orientation === 'vertical' ? '300px' : '0px'}`,
          alignItems: 'stretch',
          gap: theme.spacing(2),
          transition: `${theme.transitions.duration.standard}ms`,
          mb: 1
        }}
        textAlign="left"
      >
        <Collapse
          sx={{ gridColumn: '1 / span 2', '& [class*=MuiStack-root]': { padding: '0 !important' } }}
          in={orientation === 'horizontal'}
        >
          <HitActions hit={hit} setHit={setHit} orientation="horizontal" />
        </Collapse>
        <Box
          sx={{
            display: 'flex',
            '& > .MuiPaper-root': { flex: 1 },
            mr: orientation === 'vertical' ? 0 : -2
          }}
        >
          <HowlerCard tabIndex={0} sx={{ position: 'relative' }}>
            <CardContent>
              <HitBanner hit={hit} layout={HitLayout.COMFY} useListener />
              <HitDetails hit={hit} layout={HitLayout.COMFY} />
              <HitLabels hit={hit} setHit={setHit} />
              {(hit?.howler?.links?.length > 0) && (
                <Stack direction="row" spacing={1}>
                  {hit?.howler?.links?.length > 0 &&
                    hit.howler.links.slice(0, 3).map(l => <RelatedLink compact {...l} />)}
                </Stack>
              )}
            </CardContent>
          </HowlerCard>
          {!isUnderLg && (
            <Stack
              spacing={1}
              sx={{
                position: 'absolute',
                top: theme.spacing(2),
                right: theme.spacing(-6)
              }}
            >
              <Tooltip title={t('page.hits.view.layout')}>
                <IconButton onClick={onOrientationChange}>
                  <ViewAgenda
                    sx={{ transition: 'rotate 250ms', rotate: orientation === 'vertical' ? '90deg' : '0deg' }}
                  />
                </IconButton>
              </Tooltip>
              <SocketBadge size="medium" />
              {analytic && (
                <Tooltip title={t('hit.panel.analytic.open')}>
                  <IconButton onClick={() => navigate(`/analytics/${analytic.analytic_id}`)}>
                    <QueryStats />
                  </IconButton>
                </Tooltip>
              )}
              {hit?.howler.bundles?.length > 0 && <BundleButton ids={hit.howler.bundles} />}
            </Stack>
          )}
        </Box>
        <HowlerCard sx={[orientation === 'horizontal' && { height: '0px' }]}>
          <CardContent sx={{ padding: 1, position: 'relative' }}>
            <HitActions hit={hit} setHit={setHit} orientation="vertical" />
          </CardContent>
        </HowlerCard>
        <Box sx={{ gridColumn: '1 / span 2', mb: 1 }}>
          <Tabs value={tab}>
            <Tab label={t('hit.viewer.comments')} value="hit_comments" onClick={() => setTab('hit_comments')} />
            <Tab label={t('hit.viewer.json')} value="hit_raw" onClick={() => setTab('hit_raw')} />
            <Tab
              label={t('hit.viewer.data')}
              value="hit_data"
              onClick={() => setTab('hit_data')}
              disabled={!hit?.howler?.data}
            />
            <Tab label={t('hit.viewer.worklog')} value="hit_worklog" onClick={() => setTab('hit_worklog')} />
            <Tab label={t('hit.viewer.related')} value="hit_related" onClick={() => setTab('hit_related')} />
          </Tabs>
        </Box>
        <Box
          sx={{
            gridColumn: '1 / span 2',
            '& > div': { padding: 0 },
            '& .react-json-view': { backgroundColor: 'transparent !important' }
          }}
        >
          {
            {
              hit_comments: <HitComments hit={hit} users={users} />,
              hit_raw: <JSONViewer data={hit} />,
              hit_data: <JSONViewer data={(hit?.howler?.data ?? []).map(entry => tryParse(entry))} />,
              hit_worklog: <HitWorklog hit={hit} users={users} />,
              hit_related: <HitRelated hit={hit} />
            }[tab]
          }
        </Box>
      </Box>
    </PageCenter>
  );
};

export default HitViewer;
