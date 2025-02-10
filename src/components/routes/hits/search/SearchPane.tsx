import { Close, Edit, ErrorOutline, SavedSearch, Terminal } from '@mui/icons-material';
import {
  Alert,
  Box,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { grey } from '@mui/material/colors';
import type { HowlerSearchResponse } from 'api/search';
import FlexOne from 'commons/addons/flexers/FlexOne';
import TuiListEmpty from 'commons/addons/lists/TuiListEmpty';
import TuiSearchPagination from 'commons/addons/search/TuiSearchPagination';
import TuiSearchTotal from 'commons/addons/search/TuiSearchTotal';
import VSBox from 'commons/addons/vsbox/VSBox';
import VSBoxContent from 'commons/addons/vsbox/VSBoxContent';
import VSBoxHeader from 'commons/addons/vsbox/VSBoxHeader';
import type { AppSiteMapRoute } from 'commons/components/app/AppConfigs';
import { useAppBreadcrumbs } from 'commons/components/app/hooks';
import { HitContext } from 'components/app/providers/HitProvider';
import { ParameterContext } from 'components/app/providers/ParameterProvider';
import { TemplateContext } from 'components/app/providers/TemplateProvider';
import { ViewContext } from 'components/app/providers/ViewProvider';
import HowlerCard from 'components/elements/display/HowlerCard';
import HitBanner from 'components/elements/hit/HitBanner';
import HitCard from 'components/elements/hit/HitCard';
import { HitLayout } from 'components/elements/hit/HitLayout';
import useMyLocalStorage, { useMyLocalStorageItem } from 'components/hooks/useMyLocalStorage';
import useMySitemap from 'components/hooks/useMySitemap';
import type { Hit } from 'models/entities/generated/Hit';
import type { FC } from 'react';
import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';
import { StorageKey } from 'utils/constants';
import BundleParentMenu from './BundleParentMenu';
import CustomSpan from './CustomSpan';
import HitContextMenu from './HitContextMenu';
import HitFilter from './HitFilter';
import HitQuery from './HitQuery';
import HitSort from './HitSort';
import SearchSpan from './SearchSpan';

const Item: FC<{
  hit: Hit;
  response: HowlerSearchResponse<Hit>;
  lastSelected: string;
  setLastSelected: (value: string) => void;
}> = memo(({ hit, response, lastSelected, setLastSelected }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { get } = useMyLocalStorage();

  const { setItems } = useAppBreadcrumbs();
  const { routes } = useMySitemap();

  const selectedHits = useContextSelector(HitContext, ctx => ctx.selectedHits);
  const addHitToSelection = useContextSelector(HitContext, ctx => ctx.addHitToSelection);
  const removeHitFromSelection = useContextSelector(HitContext, ctx => ctx.removeHitFromSelection);
  const clearSelectedHits = useContextSelector(HitContext, ctx => ctx.clearSelectedHits);

  const selected = useContextSelector(ParameterContext, ctx => ctx.selected);
  const setSelected = useContextSelector(ParameterContext, ctx => ctx.setSelected);

  const layout: HitLayout = useMemo(
    () => (isMobile ? HitLayout.COMFY : (get(StorageKey.HIT_LAYOUT) ?? HitLayout.NORMAL)),
    [get]
  );

  const checkMiddleClick = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>, id: string | number) => {
    if (e.button === 1) {
      window.open(`${window.origin}/hits/${id}`, '_blank');
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  const onClick: React.MouseEventHandler<HTMLDivElement> = useCallback(
    e => {
      setLastSelected(hit.howler.id);

      if (e.ctrlKey) {
        document.getSelection().removeAllRanges();

        if (selectedHits.some(_hit => _hit.howler.id === hit.howler.id)) {
          removeHitFromSelection(hit.howler.id);
        } else {
          addHitToSelection(hit.howler.id);
        }

        e.stopPropagation();
        return;
      }

      if (e.shiftKey) {
        document.getSelection().removeAllRanges();

        if (selectedHits.length < 1) {
          addHitToSelection(hit.howler.id);
        } else if (lastSelected) {
          const lastSelectedIndex = response?.items.findIndex(_hit => _hit.howler.id === lastSelected);
          const currentIndex = response?.items.findIndex(_hit => _hit.howler.id === hit.howler.id);

          const lowerBound = lastSelectedIndex < currentIndex ? lastSelectedIndex : currentIndex;
          const upperBound = lastSelectedIndex > currentIndex ? lastSelectedIndex : currentIndex;

          for (let i = lowerBound; i <= upperBound; i++) {
            addHitToSelection(response.items[i]?.howler.id);
          }
        }

        e.stopPropagation();
        return;
      }

      if (hit.howler.is_bundle) {
        const searchRoute = routes.find(_route =>
          _route.path.startsWith(location.pathname.replace(/^(\/.*)\/.+/, '$1'))
        );

        const newBreadcrumb: AppSiteMapRoute = {
          ...searchRoute,
          path: location.pathname + location.search
        };
        setItems([{ route: newBreadcrumb, matcher: null }]);

        navigate(`/bundles/${hit.howler.id}?span=date.range.all&query=howler.id%3A*&offset=0`);
        clearSelectedHits(hit.howler.id);
      } else {
        clearSelectedHits(hit.howler.id);
        setSelected(hit.howler.id);
      }
    },
    [
      addHitToSelection,
      clearSelectedHits,
      hit.howler.id,
      hit.howler.is_bundle,
      lastSelected,
      navigate,
      removeHitFromSelection,
      response.items,
      routes,
      selectedHits,
      setItems,
      setLastSelected,
      setSelected
    ]
  );

  // Search result list item renderer.
  return (
    <Box
      id={hit.howler.id}
      onMouseUp={e => checkMiddleClick(e, hit.howler.id)}
      onClick={onClick}
      sx={[
        {
          mb: 2,
          cursor: 'pointer',
          '& span,p,h6': {
            cursor: 'text'
          },
          '& .MuiPaper-root': {
            border: '4px solid transparent',
            boxShadow: `0px 0px 0px 0px transparent`,
            transition: theme.transitions.create(['border-color', 'box-shadow'])
          },
          '& .MuiCardContent-root': {
            p: 1,
            pb: 1
          },
          '& .MuiCardContent-root:last-child': {
            paddingBottom: 'inherit' // prevents slight height variation on selected card.
          }
        },
        selectedHits.some(_hit => _hit.howler.id === hit.howler.id) && {
          '& .MuiPaper-root': { borderColor: grey[500], boxShadow: `0px 0px 5px 2px ${grey[500]}` }
        },
        selected === hit.howler.id && {
          '& .MuiPaper-root': {
            borderColor: 'primary.main',
            boxShadow: `0px 0px 5px 2px ${theme.palette.primary.main}`
          }
        }
      ]}
    >
      <HitCard id={hit.howler.id} layout={layout} />
    </Box>
  );
});

const SearchPane: FC<{
  error?: string;
  triggerSearch: (query: string) => void;
  response: HowlerSearchResponse<Hit>;
  searching: boolean;
  top?: number;
}> = ({ error, triggerSearch, response, searching, top = 0 }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const routeParams = useParams();
  const refresh = useContextSelector(TemplateContext, ctx => ctx.refresh);
  const viewContext = useContext(ViewContext);

  const selected = useContextSelector(ParameterContext, ctx => ctx.selected);
  const setSelected = useContextSelector(ParameterContext, ctx => ctx.setSelected);
  const query = useContextSelector(ParameterContext, ctx => ctx.query);
  const sort = useContextSelector(ParameterContext, ctx => ctx.sort);
  const span = useContextSelector(ParameterContext, ctx => ctx.span);

  const setOffset = useContextSelector(ParameterContext, ctx => ctx.setOffset);

  const getHit = useContextSelector(HitContext, ctx => ctx.getHit);
  const clearSelectedHits = useContextSelector(HitContext, ctx => ctx.clearSelectedHits);
  const bundleHit = useContextSelector(HitContext, ctx =>
    location.pathname.startsWith('/bundles') ? ctx.hits[routeParams.id] : null
  );

  const searchPaneWidth = useMyLocalStorageItem(StorageKey.SEARCH_PANE_WIDTH, null)[0];

  const [lastSelected, setLastSelected] = useState<string>(null);

  const verticalSorters = useMediaQuery('(max-width: 1919px)') || searchPaneWidth < 900;

  const viewId = useMemo(
    () => (location.pathname.startsWith('/views') ? routeParams.id : null),
    [location.pathname, routeParams.id]
  );

  const selectedView = useMemo(
    () => viewContext.views?.find(_view => _view.view_id === viewId),
    [viewContext.views, viewId]
  );

  const viewUrl = useMemo(() => {
    if (viewId) {
      return `/views/${viewId}/edit`;
    }

    const keys = [];
    if (query) {
      keys.push(`query=${query}`);
    }

    if (sort) {
      keys.push(`sort=${sort}`);
    }

    if (span) {
      keys.push(`span=${span}`);
    }

    return keys.length > 0 ? `/views/create?${keys.join('&')}` : '/views/create';
  }, [query, sort, span, viewId]);

  const getSelectedId = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const target = event.target as HTMLElement;
    const selectedElement = target.closest('[id]') as HTMLElement;

    if (!selectedElement) {
      return;
    }

    return selectedElement.id;
  }, []);

  // Load the index field for a hit in order to provide autocomplete suggestions.
  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (location.pathname.startsWith('/bundles')) {
      getHit(routeParams.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, routeParams.id]);

  const viewButton = useMemo(
    () => (
      <Tooltip title={viewId ? t('route.views.edit') : t('route.views.create')}>
        <IconButton
          size="small"
          component={Link}
          disabled={(!viewId && !query) || span?.endsWith('custom')}
          to={viewUrl}
        >
          {viewId ? <Edit fontSize="small" /> : <SavedSearch />}
        </IconButton>
      </Tooltip>
    ),
    [query, span, t, viewId, viewUrl]
  );

  return (
    <VSBox top={top}>
      <Stack ml={-1} mr={-1} sx={{ '& .overflowingContentWidgets > *': { zIndex: '2000 !important' } }} spacing={1}>
        {viewId &&
          (selectedView ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={selectedView.query}>
                <Typography
                  sx={theme => ({ color: theme.palette.text.primary })}
                  variant="body1"
                  component={Link}
                  to={`/views/${selectedView.view_id}/edit`}
                >
                  {t(selectedView.title)}
                </Typography>
              </Tooltip>
              {viewButton}
            </Stack>
          ) : (
            viewContext.ready && (
              <Alert
                variant="outlined"
                severity="error"
                action={
                  <IconButton size="small" component={Link} to="/search">
                    <Close fontSize="small" />
                  </IconButton>
                }
              >
                {t('view.notfound')}
              </Alert>
            )
          ))}

        {bundleHit && (
          <HitContextMenu getSelectedId={() => bundleHit.howler.id}>
            <Stack spacing={1} sx={{ mx: -1 }}>
              <HowlerCard
                sx={[
                  { p: 1, border: '4px solid transparent', cursor: 'pointer' },
                  location.pathname.startsWith('/bundles') &&
                    selected === routeParams.id && { borderColor: 'primary.main' }
                ]}
                onClick={() => {
                  clearSelectedHits(bundleHit.howler.id);
                  setSelected(bundleHit.howler.id);
                }}
              >
                <HitBanner hit={bundleHit} layout={HitLayout.DENSE} useListener />
              </HowlerCard>
            </Stack>
          </HitContextMenu>
        )}

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography
            sx={theme => ({ color: theme.palette.text.secondary, fontSize: '0.9em', fontStyle: 'italic', mb: 0.5 })}
            variant="body2"
          >
            {t('hit.search.prompt')}
          </Typography>
          {error && (
            <Tooltip title={`${t('route.advanced.error')}: ${error}`}>
              <ErrorOutline fontSize="small" color="error" />
            </Tooltip>
          )}
          <FlexOne />
          {bundleHit?.howler.bundles.length > 0 && <BundleParentMenu bundle={bundleHit} />}
          {bundleHit && (
            <Tooltip title={t('hit.bundle.close')}>
              <IconButton size="small" onClick={() => navigate('/search')}>
                <Close />
              </IconButton>
            </Tooltip>
          )}
          {!viewId && viewButton}
          <Tooltip title={t('route.actions.save')}>
            <IconButton component={Link} disabled={!query} to={`/action/execute?query=${query}`}>
              <Terminal />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <VSBoxHeader ml={-3} mr={-3} px={2} pb={1} sx={{ zIndex: 999 }}>
        <HitQuery disabled={viewId && !selectedView} searching={searching} triggerSearch={triggerSearch} />

        <Box sx={{ position: 'relative', pb: 1.5, pt: 1.5 }}>
          <Stack
            direction={verticalSorters ? 'column' : 'row'}
            justifyContent="space-between"
            spacing={1}
            divider={!verticalSorters && <Divider flexItem orientation="vertical" />}
            sx={[
              { '& > :not(.MuiDivider-root )': { flex: 1 } },
              viewId &&
                !selectedView && {
                  opacity: 0.25,
                  pointerEvents: 'none'
                }
            ]}
          >
            <HitSort />
            <HitFilter />
            <SearchSpan useDefault={!selectedView?.span} />
          </Stack>

          <CustomSpan />

          {searching && (
            <LinearProgress sx={theme => ({ position: 'absolute', bottom: theme.spacing(0.5), left: 0, right: 0 })} />
          )}
        </Box>

        {response && (
          <Stack direction="row" alignItems="center">
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
              onChange={nextOffset => setOffset(nextOffset)}
            />
          </Stack>
        )}
      </VSBoxHeader>
      <VSBoxContent mr={-1} ml={-1} mt={1}>
        <HitContextMenu getSelectedId={getSelectedId}>
          {!response ? (
            <TuiListEmpty />
          ) : (
            response.items.map(hit => (
              <Item
                key={hit.howler.id}
                hit={hit}
                response={response}
                lastSelected={lastSelected}
                setLastSelected={setLastSelected}
              />
            ))
          )}
        </HitContextMenu>
      </VSBoxContent>
    </VSBox>
  );
};

export default memo(SearchPane);
