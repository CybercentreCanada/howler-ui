import { ChevronLeft, Close, ManageSearch } from '@mui/icons-material';
import {
  Box,
  Card,
  Checkbox,
  Drawer,
  Fab,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import api from 'api';
import type { HowlerSearchResponse } from 'api/search';
import FlexOne from 'commons/addons/flexers/FlexOne';
import FlexPort from 'commons/addons/flexers/FlexPort';
import Throttler from 'commons/addons/utils/Throttler';
import PageCenter from 'commons/components/pages/PageCenter';
import { HitContext } from 'components/app/providers/HitProvider';
import ParameterProvider, { ParameterContext } from 'components/app/providers/ParameterProvider';
import { ViewContext } from 'components/app/providers/ViewProvider';
import HitSummary from 'components/elements/hit/HitSummary';
import useMyApi from 'components/hooks/useMyApi';
import { useMyLocalStorageItem } from 'components/hooks/useMyLocalStorage';
import ErrorBoundary from 'components/routes/ErrorBoundary';
import i18n from 'i18n';
import { isNull, isUndefined } from 'lodash-es';
import type { Hit } from 'models/entities/generated/Hit';
import type { FC, ReactNode } from 'react';
import { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';
import { StorageKey } from 'utils/constants';
import { convertCustomDateRangeToLucene, convertDateToLucene } from 'utils/utils';
import InformationPane from './InformationPane';
import SearchPane from './SearchPane';

const THROTTLER = new Throttler(500);

// https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/display-name.md
const Wrapper = memo<{ show: boolean; showDrawer: boolean; children: ReactNode; onClose: () => void }>(
  function Wrapper({ show, showDrawer, children, onClose }) {
    return (
      <ErrorBoundary>
        {showDrawer ? (
          <Drawer
            onClose={onClose}
            open={show}
            anchor="right"
            PaperProps={{ sx: { backgroundImage: 'none', overflow: 'hidden', width: '75vw' } }}
          >
            {children}
          </Drawer>
        ) : (
          <FlexPort disableOverflow>{children}</FlexPort>
        )}
      </ErrorBoundary>
    );
  }
);

const HitBrowser: FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const viewContext = useContext(ViewContext);

  const selected = useContextSelector(ParameterContext, ctx => ctx.selected);
  const setSelected = useContextSelector(ParameterContext, ctx => ctx.setSelected);
  const query = useContextSelector(ParameterContext, ctx => ctx.query);
  const setQuery = useContextSelector(ParameterContext, ctx => ctx.setQuery);
  const offset = useContextSelector(ParameterContext, ctx => ctx.offset);
  const setOffset = useContextSelector(ParameterContext, ctx => ctx.setOffset);
  const trackTotalHits = useContextSelector(ParameterContext, ctx => ctx.trackTotalHits);
  const sort = useContextSelector(ParameterContext, ctx => ctx.sort);
  const span = useContextSelector(ParameterContext, ctx => ctx.span);
  const filter = useContextSelector(ParameterContext, ctx => ctx.filter);
  const startDate = useContextSelector(ParameterContext, ctx => ctx.startDate);
  const endDate = useContextSelector(ParameterContext, ctx => ctx.endDate);

  const loadHits = useContextSelector(HitContext, ctx => ctx.loadHits);
  const selectedHits = useContextSelector(HitContext, ctx => ctx.selectedHits);
  const addHitToSelection = useContextSelector(HitContext, ctx => ctx.addHitToSelection);
  const removeHitFromSelection = useContextSelector(HitContext, ctx => ctx.removeHitFromSelection);
  const clearSelectedHits = useContextSelector(HitContext, ctx => ctx.clearSelectedHits);

  const pageCount = useMyLocalStorageItem(StorageKey.PAGE_COUNT, 25)[0];
  const searchPaneWidth = useMyLocalStorageItem(StorageKey.SEARCH_PANE_WIDTH, null)[0];
  const forceDrawer = useMyLocalStorageItem(StorageKey.FORCE_DRAWER, false)[0];
  const showDrawer = useMediaQuery(theme.breakpoints.down(1600)) || forceDrawer;

  const location = useLocation();
  const routeParams = useParams();

  const viewId = useMemo(
    () => (location.pathname.startsWith('/views') ? routeParams.id : null),
    [location.pathname, routeParams.id]
  );

  const bundleId = useMemo(
    () => (location.pathname.startsWith('/bundles') ? routeParams.id : null),
    [location.pathname, routeParams.id]
  );

  const [show, setShow] = useState(!!selected);
  useEffect(() => setShow(!!selected), [selected]);

  const { dispatchApi } = useMyApi();
  const [searching, setSearching] = useState<boolean>(false);
  const [error, setError] = useState<string>(null);
  const [response, setResponse] = useState<HowlerSearchResponse<Hit>>();

  // State that makes up the request

  const summaryQuery = useMemo(() => {
    const bundle = location.pathname.startsWith('/bundles') && routeParams.id;

    let _fullQuery = query;
    if (bundle) {
      _fullQuery = `(howler.bundles:${bundle}) AND (${_fullQuery})`;
    } else if (viewId) {
      _fullQuery = `(${viewContext.views.find(_view => _view.view_id === viewId)?.query || 'howler.id:*'}) AND (${_fullQuery})`;
    }

    return _fullQuery;
  }, [location.pathname, query, routeParams.id, viewContext.views, viewId]);

  const showSelectBar = useMemo(() => {
    if (selectedHits.length > 1) {
      return true;
    }

    if (selectedHits.length === 1 && selectedHits[0]?.howler.id !== routeParams.id) {
      return true;
    }

    return false;
  }, [routeParams.id, selectedHits]);

  const search = useCallback(
    async (_query?: string) => {
      THROTTLER.debounce(async () => {
        if (_query === 'woof!') {
          i18n.changeLanguage('woof');
          return;
        }

        if (isNull(sort) || isNull(span)) {
          return;
        }

        if (!isNull(_query) && !isUndefined(_query) && _query !== query) {
          setQuery(_query);
        }

        setSearching(true);
        setError(null);

        const filters: string[] = [];

        if (span && !span.endsWith('custom')) {
          filters.push(`event.created:${convertDateToLucene(span)}`);
        } else if (startDate && endDate) {
          filters.push(`event.created:${convertCustomDateRangeToLucene(startDate, endDate)}`);
        }

        if (filter) {
          filters.push(filter);
        }

        try {
          const bundle = location.pathname.startsWith('/bundles') && routeParams.id;

          let fullQuery = _query || 'howler.id:*';
          if (bundle) {
            fullQuery = `(howler.bundles:${bundle}) AND (${fullQuery})`;
          } else if (viewId) {
            fullQuery = `(${
              viewContext.views.find(_view => _view.view_id === viewId)?.query || 'howler.id:*'
            }) AND (${fullQuery})`;
          }

          const _response = await dispatchApi(
            api.search.hit.post({
              offset,
              rows: pageCount,
              query: fullQuery,
              sort,
              filters,
              track_total_hits: trackTotalHits
            }),
            { showError: false, throwError: true }
          );

          if (_response.total < offset) {
            setOffset(0);
          }

          loadHits(_response.items);
          setResponse(_response);
        } catch (e) {
          setError(e.message);
        } finally {
          setSearching(false);
        }
      });
    },
    [
      dispatchApi,
      endDate,
      filter,
      loadHits,
      location.pathname,
      offset,
      pageCount,
      query,
      routeParams.id,
      setOffset,
      setQuery,
      sort,
      span,
      startDate,
      trackTotalHits,
      viewContext.views,
      viewId
    ]
  );

  // We only run this when ancillary properties (i.e. filters, sorting) change
  useEffect(() => {
    // We're being asked to present a view, but we don't currently have the views loaded
    if (viewId && !viewContext.ready) {
      return;
    }

    if (span.endsWith('custom') && (!startDate || !endDate)) {
      return;
    }

    if (viewId || bundleId || query || offset > 0) {
      search(query);
    } else {
      setResponse(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, offset, pageCount, sort, span, bundleId, location.pathname, viewContext.ready, startDate, endDate]);

  useEffect(() => {
    if (location.pathname.startsWith('/views') && !viewContext.ready) {
      viewContext.fetchViews(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, viewContext.ready]);

  const onClose = useCallback(() => {
    setSelected(null);
  }, [setSelected]);

  useEffect(() => {
    if (
      selected &&
      response &&
      !response.items.some(_hit => _hit.howler.id === selected) &&
      (!location.pathname.startsWith('/bundles') || routeParams.id !== selected)
    ) {
      setSelected(null);
      if (selectedHits.length < 2) {
        removeHitFromSelection(selected);
      }
      return;
    }

    if (selected && !selectedHits.some(_hit => _hit?.howler.id === selected)) {
      addHitToSelection(selected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addHitToSelection, location.pathname, removeHitFromSelection, response, routeParams.id, selected, setSelected]);

  return (
    <Stack direction="row" flex={1} sx={{ overflow: 'hidden' }}>
      <Box
        position="relative"
        flex={1}
        height="100%"
        display="flex"
        sx={[!isNull(searchPaneWidth) && { maxWidth: searchPaneWidth }]}
      >
        <FlexPort>
          <ErrorBoundary>
            <PageCenter textAlign="left" mt={0} mb={6} ml={0} mr={0}>
              <SearchPane triggerSearch={search} error={error} response={response} searching={searching} />
            </PageCenter>
          </ErrorBoundary>
        </FlexPort>
        {showSelectBar && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: theme.palette.background.paper,
              p: 1
            }}
          >
            <Tooltip title={t('hit.search.select.all')}>
              <Checkbox
                size="small"
                checked={
                  !!response?.items.every(_hit1 => selectedHits.some(_hit2 => _hit1.howler.id === _hit2.howler.id))
                }
                onChange={(__, checked) =>
                  checked ? response.items.forEach(_hit => addHitToSelection(_hit.howler.id)) : clearSelectedHits()
                }
              />
            </Tooltip>
            <Typography>
              <Trans i18nKey="hit.search.selected" values={{ size: selectedHits.length }} />
            </Typography>

            <FlexOne />

            <Tooltip title={t('hit.search.select.clear')}>
              <IconButton
                size="small"
                onClick={() => {
                  setSelected(null);
                  clearSelectedHits();
                }}
              >
                <Close />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('hit.search.select.view')}>
              <IconButton
                size="small"
                onClick={() => {
                  setOffset(0);
                  setQuery(`howler.id:(${selectedHits.map(hit => hit.howler.id).join(' OR ')})`);
                }}
              >
                <ManageSearch />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Box>
      <Wrapper show={show} showDrawer={showDrawer} onClose={() => setShow(false)}>
        <HitSummary query={summaryQuery} response={response} execute={!!response && !error} />
        <Card
          variant="outlined"
          sx={[
            {
              zIndex: 100,
              overflow: 'visible',
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '100%',
              right: 0,
              borderTop: 0,
              borderBottom: 0,
              transition: theme.transitions.create(['left'])
            },
            selected && {
              left: theme.spacing(5)
            },
            location.pathname.startsWith('/bundles') &&
              routeParams.id && {
                left: 0
              }
          ]}
        >
          <InformationPane onClose={onClose} />
          {selected && !(location.pathname.startsWith('/bundles') && routeParams.id) && (
            <Box
              onClick={onClose}
              sx={{
                cursor: 'pointer',
                position: 'absolute',
                right: '100%',
                width: theme.spacing(5),
                top: 0,
                bottom: 0,
                background: `linear-gradient(to right, transparent, ${theme.palette.background.paper})`
              }}
            />
          )}
        </Card>
      </Wrapper>
      {showDrawer && (
        <Fab
          onClick={() => setShow(_show => !_show)}
          color="primary"
          sx={{ position: 'fixed', right: theme.spacing(2), bottom: theme.spacing(1), zIndex: 1201 }}
        >
          <ChevronLeft sx={{ transition: 'rotate 250ms', rotate: show ? '180deg' : '0deg' }} />
        </Fab>
      )}
    </Stack>
  );
};

const HitBrowserProvider: FC = () => {
  return (
    <ParameterProvider>
      <HitBrowser />
    </ParameterProvider>
  );
};

export default HitBrowserProvider;
