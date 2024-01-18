import { Star, StarOutline } from '@mui/icons-material';
import { Box, Collapse, Paper, Stack, Typography, emphasize } from '@mui/material';
import { grey } from '@mui/material/colors';
import api from 'api';
import { HowlerSearchRequest, HowlerSearchResponse } from 'api/search';
import { TuiQueryChangeReason, TuiQueryItem } from 'commons/addons/controls/query';
import { TuiQuery } from 'commons/addons/controls/query/TuiQuery';
import TuiIconButton from 'commons/addons/display/buttons/TuiIconButton';
import { TuiList, TuiListItemOnSelect, TuiListItemProps } from 'commons/addons/lists';
import useTuiListMethods from 'commons/addons/lists/hooks/useTuiListMethods';
import TuiSearchPagination from 'commons/addons/search/TuiSearchPagination';
import TuiSearchTotal from 'commons/addons/search/TuiSearchTotal';
import VSBox from 'commons/addons/vsbox/VSBox';
import VSBoxContent from 'commons/addons/vsbox/VSBoxContent';
import VSBoxHeader from 'commons/addons/vsbox/VSBoxHeader';
import { FieldContext } from 'components/app/providers/FieldProvider';
import { TemplateContext } from 'components/app/providers/TemplateProvider';
import HitAggregate from 'components/elements/hit/HitAggregate';
import { HitLayout } from 'components/elements/hit/HitLayout';
import HitOutline from 'components/elements/hit/HitOutline';
import { ViewTitle } from 'components/elements/view/ViewTitle';
import useMyApi from 'components/hooks/useMyApi';
import useMyLocalStorage from 'components/hooks/useMyLocalStorage';
import i18n from 'i18n';
import { Hit } from 'models/entities/generated/Hit';
import { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import { StorageKey } from 'utils/constants';
import HitFilters from './HitFilters';
import { HitSearchMenu } from './HitSearchMenu';
import HitSort, { SortData } from './HitSort';
import { useHowlerQueryStore } from './hooks/useHowlerQueryStore';

export type HowlerHitSearchRequest = HowlerSearchRequest & { dispatch: boolean };

const parseSort = (sortString: string): SortData =>
  (sortString ?? '').split(',').reduce((acc, val, index) => {
    const [key, sortDirection] = val.split(' ');

    if (key && sortDirection) {
      acc[key] = {
        direction: sortDirection as 'asc' | 'desc',
        priority: index
      };
    }

    return acc;
  }, {} as SortData);

const removeSelected = (_params: URLSearchParams) => {
  const copy = new URLSearchParams(_params);
  copy.delete('selected');
  return copy.toString();
};

const HitSearch: FC<{ onSelection: TuiListItemOnSelect<Hit>; top?: number }> = ({ onSelection, top }) => {
  const searchParams = new URLSearchParams(window.location.search);
  const store = useHowlerQueryStore();
  const location = useLocation();
  const routeParams = useParams();
  const paramsRef = useRef<URLSearchParams>();
  const { t } = useTranslation();
  const { dispatchApi } = useMyApi();
  const { load } = useTuiListMethods<Hit>();
  const { getHitFields } = useContext(FieldContext);
  const { refresh } = useContext(TemplateContext);
  const { get } = useMyLocalStorage();
  const [searching, setSearching] = useState<boolean>(false);
  const [aggregating, setAggregating] = useState<boolean>(false);
  const [dropdownView, setDropdownView] = useState<'sort' | 'aggregate' | 'filter'>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [response, setResponse] = useState<HowlerSearchResponse<Hit>>();

  // [params] -  initializing with default view/query if none was provided.
  const [params, setParams] = useSearchParams(
    !searchParams.has('query') &&
      !searchParams.has('qid') &&
      !location.pathname.startsWith('/bundles') &&
      store.provider.defaultView
      ? {
          qid: store.provider.defaultView
        }
      : {}
  );

  // [request] -  initializing state with created desc sorter.
  const [request, setRequest] = useState<HowlerHitSearchRequest>({
    dispatch: false,
    offset: 0,
    rows: 25,
    query: null,
    sort: 'event.created desc',
    track_total_hits: !!params.get('track_total_hits') && params.get('track_total_hits') !== 'false'
  });

  const layout: HitLayout = useMemo(
    () => (isMobile ? HitLayout.COMFY : get(StorageKey.HIT_LAYOUT) ?? HitLayout.NORMAL),
    [get]
  );

  // Load the index field for a hit in order to provide autocomplete suggestions.
  useEffect(() => {
    getHitFields().then(fields => setSuggestions(fields.map(f => f.key)));
    refresh();
  }, [getHitFields, refresh]);

  // Trigger a new search when the request state changes.
  useEffect(() => {
    if (request.dispatch) {
      setSearching(true);
      setHasError(false);
      dispatchApi(api.search.hit.post(request), { showError: false, throwError: true })
        .then(setResponse)
        .catch(() => setHasError(true))
        .finally(() => setSearching(false));
    }
  }, [request, dispatchApi]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response, load, window.location.search]);

  // Handler for downstream TuiQuery 'onChange' callback.
  const onQueryChange = useCallback(
    (reason: TuiQueryChangeReason, query: string, nextState: URLSearchParams) => {
      if (query === 'woof!') {
        i18n.changeLanguage('woof');
      }

      // Detect whether only the 'selected' parameter changed.
      const selectionOnly = reason === 'init' && removeSelected(nextState) === removeSelected(paramsRef.current);

      // Remember the last time we came through here.
      paramsRef.current = new URLSearchParams(nextState);

      // Ensure we update 'query' parameter.
      setParams(nextState);

      // Don't trigger search if only the 'selected' parameter changed.
      if (!selectionOnly) {
        const bundle = location.pathname.startsWith('/bundles') && routeParams.id;
        setRequest(_request => ({
          ..._request,
          dispatch: true,
          query: bundle ? `(howler.bundles:${bundle}) AND (${query || '*:*'})` : query,
          offset: nextState.has('offset') ? parseInt(nextState.get('offset')) : 0,
          filters: nextState.has('filter') ? nextState.getAll('filter') : []
        }));
      }
    },
    [location.pathname, routeParams.id, setParams]
  );

  // Update the request object when the pagination component's page changes.
  const onPageChange = useCallback(
    (offset: number) => {
      params.set('offset', `${offset}`);
      setParams(params);
    },
    [params, setParams]
  );

  // Handler for when changes occur in the lookup component
  const onLookupChange = useCallback(
    (filters: string[]) => {
      if (filters.length > 0) {
        params.delete('filter');
        filters.forEach(filter => params.append('filter', filter));
      } else {
        params.delete('filter');
      }
      setParams(params);
    },
    [params, setParams]
  );

  // Handler for filter toggling button.
  const onFilter = useCallback(() => {
    setShowDropdown(dropdownView !== 'filter' ? true : !showDropdown);
    setDropdownView(dropdownView !== 'filter' ? 'filter' : dropdownView);
  }, [dropdownView, showDropdown]);

  // Handler for aggregate toggling button.
  const onAggregate = useCallback(() => {
    setShowDropdown(dropdownView !== 'aggregate' ? true : !showDropdown);
    setDropdownView(dropdownView !== 'aggregate' ? 'aggregate' : dropdownView);
  }, [dropdownView, showDropdown]);

  // Handler for aggregate toggling button.
  const onSort = useCallback(() => {
    setShowDropdown(dropdownView !== 'sort' ? true : !showDropdown);
    setDropdownView(dropdownView !== 'sort' ? 'sort' : dropdownView);
  }, [dropdownView, showDropdown]);

  // Handlder for when sorting criteria changes.
  const onSortChange = useCallback(
    (sortData: SortData) => {
      setRequest({
        ...request,
        sort: Object.keys(sortData)
          .sort((a, b) => sortData[a].priority - sortData[b].priority)
          .map(k => `${k} ${sortData[k].direction}`)
          .join(',')
      });
    },
    [request]
  );

  // Render the TuiQueryStore option items.
  // Essentially renderer for each saved views.
  const storeOptionRenderer = useCallback(
    (item: TuiQueryItem) => {
      const view = store.provider.views.find(v => v.view_id === item.id);
      return view && <ViewTitle {...view} />;
    },
    [store.provider.views]
  );

  // Render the TuiQueryStore menu option items.
  // This builds the action menu at the end of each options.
  const storeOptionMenuRenderer = useCallback(
    (item: TuiQueryItem) => {
      const favourited = store.provider.favourites.some(view_id => view_id === item.id);
      return [
        <TuiIconButton
          key={item.id}
          onClick={() => (favourited ? store.provider.removeFavourite(item.id) : store.provider.addFavourite(item.id))}
        >
          {favourited ? <Star /> : <StarOutline />}
        </TuiIconButton>
      ];
    },
    [store]
  );

  // Search result list item renderer.
  const renderer = useCallback(
    ({ item }: TuiListItemProps<Hit>, classRenderer: () => string) => {
      return (
        <Box
          id={item.id as string}
          key={item.id}
          className={classRenderer()}
          sx={[
            {
              mb: 2,
              '& .MuiPaper-root': { border: '4px solid transparent' },
              '& .MuiCardContent-root': {
                p: 1,
                pb: 1
              },
              '& .MuiCardContent-root:last-child': {
                paddingBottom: 'inherit' // prevents slight height variation on selected card.
              }
            },
            item.cursor && {
              '& .MuiPaper-root': { borderColor: grey[500] }
            },
            item.selected && {
              '& .MuiPaper-root': { borderColor: 'primary.main' }
            }
          ]}
        >
          <HitOutline hit={item.item} layout={layout} />
        </Box>
      );
    },
    [layout]
  );

  return (
    store.ready && (
      <VSBox top={top}>
        <VSBoxHeader mb={1} ml={-1} mr={-1}>
          <Box mb={2} mt={2}>
            <Typography
              sx={theme => ({ color: theme.palette.text.secondary, fontSize: '0.9em', fontStyle: 'italic', mb: 0.5 })}
              variant="body2"
            >
              {t('hit.search.prompt')}
            </Typography>

            <TuiQuery
              q="query"
              state={params}
              store={store}
              searching={searching || aggregating}
              onChange={onQueryChange}
              PhraseProps={{
                suggestions,
                endAdornment: (
                  <HitSearchMenu
                    hasError={hasError}
                    dropdownView={dropdownView}
                    request={request}
                    response={response}
                    onSort={onSort}
                    onAggregate={onAggregate}
                    onFilter={onFilter}
                  />
                )
              }}
              StoreProps={{
                OptionProps: {
                  renderer: storeOptionRenderer,
                  menuRenderer: storeOptionMenuRenderer
                }
              }}
            />
            <Collapse in={showDropdown} unmountOnExit>
              <Paper
                sx={theme => ({
                  backgroundColor: emphasize(theme.palette.background.default, 0.025),
                  p: 2,
                  border: '1px solid',
                  borderColor: emphasize(theme.palette.background.default, 0.1),
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  borderTop: 0,
                  marginTop: '-2px'
                })}
                elevation={0}
              >
                {
                  {
                    aggregate: (
                      <HitAggregate
                        query={request.query}
                        compact
                        onStart={() => setAggregating(true)}
                        onComplete={() => setAggregating(false)}
                      />
                    ),
                    filter: <HitFilters onChange={onLookupChange} />,
                    sort: <HitSort sort={parseSort(request.sort)} suggestions={suggestions} onChange={onSortChange} />
                  }[dropdownView]
                }
              </Paper>
            </Collapse>

            {response && (
              <>
                <Stack direction="row" alignItems="center" sx={{ pt: 0.5 }}>
                  <TuiSearchTotal
                    total={response.total}
                    pageLength={response.items.length}
                    offset={response.offset}
                    sx={theme => ({ color: theme.palette.text.secondary, fontSize: '0.9em', fontStyle: 'italic' })}
                  />
                  <Box flex={1} />
                  <TuiSearchPagination
                    total={response.total}
                    limit={response.rows}
                    offset={response.offset}
                    onChange={onPageChange}
                  />
                </Stack>
              </>
            )}
          </Box>
        </VSBoxHeader>
        <VSBoxContent mr={-1} ml={-1}>
          <TuiList keyboard onSelection={onSelection}>
            {renderer}
          </TuiList>
        </VSBoxContent>
      </VSBox>
    )
  );
};

export default HitSearch;
