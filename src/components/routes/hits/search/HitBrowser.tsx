import { ChevronLeft } from '@mui/icons-material';
import { Box, Card, Drawer, Fab, Stack, useMediaQuery, useTheme } from '@mui/material';
import api from 'api';
import type { HowlerSearchResponse } from 'api/search';
import FlexPort from 'commons/addons/flexers/FlexPort';
import type { TuiListItemOnSelect } from 'commons/addons/lists';
import { TuiListProvider } from 'commons/addons/lists';
import useTuiListItems from 'commons/addons/lists/hooks/useTuiListItems';
import useTuiListMethods from 'commons/addons/lists/hooks/useTuiListMethods';
import PageCenter from 'commons/components/pages/PageCenter';
import { ViewContext } from 'components/app/providers/ViewProvider';
import HitSummary from 'components/elements/hit/HitSummary';
import useMyApi from 'components/hooks/useMyApi';
import { useMyLocalStorageItem } from 'components/hooks/useMyLocalStorage';
import ErrorBoundary from 'components/routes/ErrorBoundary';
import i18n from 'i18n';
import { isNull, isUndefined } from 'lodash';
import type { Hit } from 'models/entities/generated/Hit';
import type { FC, ReactNode } from 'react';
import { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { StorageKey } from 'utils/constants';
import InformationPane from './InformationPane';
import SearchPane from './SearchPane';

// https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/display-name.md
const Wrapper = memo<{ show: boolean; isMd: boolean; children: ReactNode; onClose: () => void }>(function Wrapper({
  show,
  isMd,
  children,
  onClose
}) {
  return (
    <ErrorBoundary>
      {isMd ? (
        <Drawer
          onClose={onClose}
          open={show}
          anchor="right"
          PaperProps={{ sx: { backgroundImage: 'none', overflow: 'hidden' } }}
        >
          {children}
        </Drawer>
      ) : (
        <FlexPort disableOverflow>{children}</FlexPort>
      )}
    </ErrorBoundary>
  );
});

const HitBrowser: FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const viewContext = useContext(ViewContext);
  const isMd = useMediaQuery(theme.breakpoints.down('lg'));
  const { items } = useTuiListItems<Hit>();
  const location = useLocation();
  const routeParams = useParams();
  const { load } = useTuiListMethods<Hit>();
  const [params, setParams] = useSearchParams();

  const pageCount = useMyLocalStorageItem(StorageKey.PAGE_COUNT, 25)[0];

  const viewId = useMemo(
    () => (location.pathname.startsWith('/views') ? routeParams.id : null),
    [location.pathname, routeParams.id]
  );

  const bundleId = useMemo(
    () => (location.pathname.startsWith('/bundles') ? routeParams.id : null),
    [location.pathname, routeParams.id]
  );

  const [show, setShow] = useState(items?.some(item => item.selected));

  const { dispatchApi } = useMyApi();
  const [searching, setSearching] = useState<boolean>(false);
  const [error, setError] = useState<string>(null);
  const [response, setResponse] = useState<HowlerSearchResponse<Hit>>();

  // State that makes up the request
  const [query, setQuery] = useState(params.get('query') || '');
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState<string | null>(null);
  const [span, setSpan] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const summaryQuery = useMemo(() => {
    const bundle = location.pathname.startsWith('/bundles') && routeParams.id;

    let _fullQuery = query || '*:*';
    if (bundle) {
      _fullQuery = `(howler.bundles:${bundle}) AND (${_fullQuery})`;
    } else if (viewId) {
      _fullQuery = `(${viewContext.views.find(_view => _view.view_id === viewId)?.query || '*:*'}) AND (${_fullQuery})`;
    }

    return _fullQuery;
  }, [location.pathname, query, routeParams.id, viewContext.views, viewId]);

  const search = useCallback(
    async (_query?: string) => {
      if (_query === 'woof!') {
        i18n.changeLanguage('woof');
        return;
      }

      if (isNull(sort) || isNull(span)) {
        return;
      }

      if (!isNull(_query) && !isUndefined(_query)) {
        setQuery(_query);
        setParams(
          _currentParams => {
            _currentParams.set('query', _query);
            return _currentParams;
          },
          { replace: true }
        );
      }

      setSearching(true);
      setError(null);

      const filters: string[] = [];

      if (span) {
        filters.push(span);
      }

      if (filter) {
        filters.push(filter);
      }

      try {
        const bundle = location.pathname.startsWith('/bundles') && routeParams.id;

        let fullQuery = _query || '*:*';
        if (bundle) {
          fullQuery = `(howler.bundles:${bundle}) AND (${fullQuery})`;
        } else if (viewId) {
          fullQuery = `(${
            viewContext.views.find(_view => _view.view_id === viewId)?.query || '*:*'
          }) AND (${fullQuery})`;
        }

        const _response = await dispatchApi(
          api.search.hit.post({
            offset,
            rows: pageCount,
            query: fullQuery,
            sort,
            filters,
            track_total_hits: !!params.get('track_total_hits') && params.get('track_total_hits') !== 'false'
          }),
          { showError: false, throwError: true }
        );

        if (_response.total < offset) {
          setOffset(0);
          setParams(
            _currentParams => {
              _currentParams.delete('offset');
              return _currentParams;
            },
            { replace: true }
          );
        }

        setResponse(_response);
      } catch (e) {
        setError(e.message);
      } finally {
        setSearching(false);
      }
    },
    [
      dispatchApi,
      filter,
      location.pathname,
      offset,
      pageCount,
      params,
      routeParams.id,
      setParams,
      sort,
      span,
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

    if (viewId || bundleId) {
      search(params.get('query') || '');
    } else if (query || params.has('query')) {
      search(query || params.get('query'));
    } else {
      setResponse(null);
      load([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, offset, pageCount, sort, span, bundleId, location.pathname, viewContext.ready]);

  // Load the items into list when response changes.
  // This hook should only trigger when the 'response' changes.
  useEffect(() => {
    if (response) {
      // Here we do not use the params hook in order to ensure this hook doesn't trigger on param changes.
      // Having a dependency on 'params' hook causes list to be reset from response objects.
      // This can cause issue in cases there were 'replace' issues in between response changes.
      const _params = new URLSearchParams(window.location.search);
      load(
        response.items.map((h: Hit) => ({
          id: h.howler.id,
          item: h,
          selected: _params.get('selected') === h.howler.id,
          cursor: _params.get('selected') === h.howler.id
        }))
      );
    }
  }, [response, load]);

  useEffect(() => setShow(items?.some(item => item.selected)), [items]);

  useEffect(() => {
    if (location.pathname.startsWith('/views') && !viewContext.ready) {
      viewContext.fetchViews(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, viewContext.ready]);

  const onPageChange = useCallback(
    (_offset: number) => {
      setOffset(_offset);
      params.set('offset', `${_offset}`);
      setParams(params);
    },
    [params, setParams]
  );

  const onSelection: TuiListItemOnSelect<Hit> = useCallback(
    selection => {
      if (selection.item.howler.is_bundle) {
        navigate(`/bundles/${selection.item.howler.id}?span=date.range.all&query=howler.id%3A*`);
      } else {
        params.set('selected', selection.item.howler.id);
        setParams(new URLSearchParams(params));
      }
    },
    [navigate, params, setParams]
  );

  const onClose = useCallback(() => {
    params.delete('selected');
    setParams(new URLSearchParams(params));
  }, [params, setParams]);

  return (
    <Stack direction="row" flex={1} sx={{ overflow: 'hidden' }}>
      <FlexPort>
        <ErrorBoundary>
          <PageCenter textAlign="left" mt={0} ml={0} mr={0}>
            <SearchPane
              triggerSearch={search}
              error={error}
              onSelection={onSelection}
              onSortChange={setSort}
              onLookupChange={setFilter}
              onSpanChange={setSpan}
              onPageChange={onPageChange}
              params={params}
              setParams={setParams}
              response={response}
              searching={searching}
            />
          </PageCenter>
        </ErrorBoundary>
      </FlexPort>
      <Wrapper show={show} isMd={isMd} onClose={() => setShow(false)}>
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
            params.get('selected') && {
              left: theme.spacing(5)
            },
            location.pathname.startsWith('/bundles') &&
              routeParams.id && {
                left: 0
              }
          ]}
        >
          <InformationPane onClose={onClose} />
          {params.get('selected') && !(location.pathname.startsWith('/bundles') && routeParams.id) && (
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
      {isMd && (
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
    <TuiListProvider>
      <HitBrowser />
    </TuiListProvider>
  );
};

export default HitBrowserProvider;
