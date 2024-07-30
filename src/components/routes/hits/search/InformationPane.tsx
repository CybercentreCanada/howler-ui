import { Clear, KeyboardArrowDown, OpenInNew, QueryStats } from '@mui/icons-material';
import { Box, Collapse, Divider, Skeleton, Stack, Tab, Tabs } from '@mui/material';
import api from 'api';
import TuiIconButton from 'commons/addons/display/buttons/TuiIconButton';

import FlexOne from 'commons/addons/flexers/FlexOne';
import FlexPort from 'commons/addons/flexers/FlexPort';
import useTuiListMethods from 'commons/addons/lists/hooks/useTuiListMethods';
import { AnalyticContext } from 'components/app/providers/AnalyticProvider';
import type { RecievedDataType } from 'components/app/providers/SocketProvider';
import { SocketContext } from 'components/app/providers/SocketProvider';
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
import HitSummary from 'components/elements/hit/HitSummary';
import HitWorklog from 'components/elements/hit/HitWorklog';
import RelatedLink from 'components/elements/hit/related/RelatedLink';
import useMyApi from 'components/hooks/useMyApi';
import { useMyLocalStorageProvider } from 'components/hooks/useMyLocalStorage';
import useMyUserList from 'components/hooks/useMyUserList';
import type { Analytic } from 'models/entities/generated/Analytic';
import type { Hit } from 'models/entities/generated/Hit';
import type { HitUpdate } from 'models/socket/HitUpdate';
import type { FC } from 'react';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import { StorageKey } from 'utils/constants';
import { getUserList } from 'utils/hitFunctions';
import { tryParse } from 'utils/utils';

const InformationPane: FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { dispatchApi } = useMyApi();
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { values, set } = useMyLocalStorageProvider();
  const { replaceById } = useTuiListMethods<Hit>();
  const { addListener, removeListener, emit, isOpen } = useContext(SocketContext);
  const { getAnalyticFromName } = useContext(AnalyticContext);

  const [userIds, setUserIds] = useState<Set<string>>(new Set());
  const [analytic, setAnalytic] = useState<Analytic>();
  const [tab, setTab] = useState<string>('hit_comments');
  const [hit, _setHit] = useState<Hit>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const users = useMyUserList(userIds);

  // remember last hit selection.
  const hitIdRef = useRef<string>();

  // check to see if we have selected a hit.
  const hitId = useMemo(() => {
    if (searchParams.has('selected')) {
      hitIdRef.current = searchParams.get('selected');
    } else if (location.pathname.startsWith('/bundles') && params.id) {
      hitIdRef.current = params.id;
    } else {
      hitIdRef.current = null;
    }

    return hitIdRef.current;
  }, [location.pathname, params.id, searchParams]);

  // Show header details indicator.
  const showDetails = useMemo(() => values[StorageKey.SHOW_DETAILS] as boolean, [values]);

  // Fetch hit data handler.
  const fetchHit = useCallback(
    async (_hitId: string, enableLoading: boolean = true) => {
      if (enableLoading) {
        setLoading(true);
      }

      try {
        const _hit = await dispatchApi(api.hit.get(_hitId));
        _setHit(_hit);
        setUserIds(getUserList(_hit));
        setAnalytic(await getAnalyticFromName(_hit.howler.analytic));
        if (tab === 'hit_aggregate' && !_hit.howler.is_bundle) {
          setTab('hit_comments');
        }
      } finally {
        setLoading(false);
      }
    },
    [dispatchApi, getAnalyticFromName, tab]
  );

  const handler = useMemo(
    () => (data: RecievedDataType<HitUpdate>) => {
      if (!hitId) {
        _setHit(null);
      } else if (data.hit?.howler.id === hitId) {
        _setHit(data.hit);
      }
    },
    [hitId]
  );

  useEffect(() => {
    addListener<HitUpdate>('infoPane', handler);

    return () => removeListener('infoPane');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handler]);

  useEffect(() => {
    if (hitId && isOpen()) {
      emit({
        broadcast: false,
        action: 'viewing',
        id: hitId
      });

      return () =>
        emit({
          broadcast: false,
          action: 'stop_viewing',
          id: hitId
        });
    }
  }, [emit, hitId, isOpen]);

  // Effect to trigger fetching of hit data when hitId changes.
  // This will cause loading effect to activate.
  useEffect(() => {
    if (hitId) {
      fetchHit(hitId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hitId]);

  // Effect to trigger fetching of hit data when tab changes.
  // This will not cause loading effect to activate.
  useEffect(() => {
    // If the websocket is enabled, the hit will reload automatically
    if (isOpen()) {
      return;
    }

    if (hitIdRef.current) {
      fetchHit(hitIdRef.current, false);
    }
  }, [tab, fetchHit, isOpen]);

  // Memoized callback for HitAction to update 'hit.howler' schema.
  const setHit = useCallback(
    (newHit: Hit) => {
      replaceById({ id: hitId, item: hit }, { id: hitId, item: newHit });
      _setHit(newHit);
    },
    [hit, hitId, replaceById]
  );

  /**
   * What to show as the header? If loading a skeleton, then it depends on bundle or not. Bundles don't
   * show anything while normal hits do
   */
  const header = useMemo(() => {
    if (loading && !hit?.howler?.is_bundle) {
      return <Skeleton variant="rounded" height={152} />;
    } else if (!!hit && !hit.howler.is_bundle) {
      return <HitBanner layout={HitLayout.DENSE} hit={hit} />;
    } else {
      return null;
    }
  }, [hit, loading]);

  return (
    <Stack direction="column" flex={1} height="100%" position="relative" spacing={1} ml={2}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        flexShrink={0}
        pr={2}
        sx={[hit?.howler?.is_bundle && { position: 'absolute', top: 1, right: 0, zIndex: 10 }]}
      >
        <FlexOne />
        {onClose && (
          <TuiIconButton size="small" onClick={onClose} tooltip={t('hit.panel.details.exit')}>
            <Clear />
          </TuiIconButton>
        )}
        {hit && !hit.howler.is_bundle && (
          <TuiIconButton
            size="small"
            tooltip={t(`hit.panel.details.${showDetails ? 'hide' : 'show'}`)}
            onClick={() => set(StorageKey.SHOW_DETAILS, !showDetails)}
          >
            <KeyboardArrowDown sx={{ transition: 'rotate 250ms', rotate: showDetails ? '180deg' : '0deg' }} />
          </TuiIconButton>
        )}
        <SocketBadge size="small" />
        {analytic && (
          <TuiIconButton
            size="small"
            tooltip={t('hit.panel.analytic.open')}
            disabled={!analytic || loading}
            onClick={() => navigate(`/analytics/${analytic.analytic_id}`)}
          >
            <QueryStats />
          </TuiIconButton>
        )}
        {hit?.howler.bundles?.length > 0 && <BundleButton ids={hit.howler.bundles} disabled={loading} />}
        {!!hit && !hit.howler.is_bundle && (
          <TuiIconButton
            tooltip={t('hit.panel.open')}
            href={`/hits/${hitIdRef.current}`}
            disabled={!hit || loading}
            size="small"
          >
            <OpenInNew />
          </TuiIconButton>
        )}
      </Stack>
      <Box pr={2}>{header}</Box>
      {!!hit && !hit.howler.is_bundle && (
        <Collapse in={showDetails} sx={{ overflow: 'auto', maxHeight: '40vh', pr: 2 }} unmountOnExit>
          {!loading ? (
            <>
              <HitDetails hit={hit} layout={HitLayout.DENSE} />
              <HitLabels hit={hit} setHit={setHit} />
            </>
          ) : (
            <Skeleton height={124} />
          )}
        </Collapse>
      )}
      {(hit?.howler?.links?.length > 0) && (
        <Stack direction="row" spacing={1} pr={2}>
          {hit?.howler?.links?.length > 0 &&
            hit.howler.links.slice(0, 3).map(l => <RelatedLink key={l.href} compact {...l} />)}
        </Stack>
      )}
      <Stack direction="row" alignItems="center" pr={2}>
        <Tabs value={tab}>
          {hit?.howler?.is_bundle && (
            <Tab label={t('hit.viewer.aggregate')} value="hit_aggregate" onClick={() => setTab('hit_aggregate')} />
          )}
          <Tab
            label={
              t('hit.viewer.comments') +
              ((hit?.howler?.comment?.length ?? 0) > 0 ? ` (${hit.howler.comment.length})` : '')
            }
            value="hit_comments"
            onClick={() => setTab('hit_comments')}
          />
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
      </Stack>
      <Stack flex={1} minHeight={'20%'}>
        <FlexPort>
          {{
            hit_comments: () => <HitComments hit={hit} users={users} />,
            hit_raw: () => <JSONViewer data={!loading && hit} />,
            hit_data: () => (
              <JSONViewer data={!loading && hit?.howler?.data?.map(entry => tryParse(entry))} collapse={false} />
            ),
            hit_worklog: () => <HitWorklog hit={!loading && hit} users={users} />,
            hit_aggregate: () => <HitSummary query={`howler.bundles:(${hit?.howler?.id})`} />,
            hit_related: () => <HitRelated hit={hit} />
          }[tab]()}
        </FlexPort>
      </Stack>

      {!!hit && hit?.howler && (
        <Box pr={2}>
          <Divider orientation="horizontal" />
          <HitActions hit={hit} setHit={setHit} />
        </Box>
      )}
    </Stack>
  );
};

export default InformationPane;
