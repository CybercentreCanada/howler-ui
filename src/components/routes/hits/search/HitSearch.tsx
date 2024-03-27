import { Close, Edit, ErrorOutline, SavedSearch } from '@mui/icons-material';
import {
  Alert,
  Box,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import { grey } from '@mui/material/colors';
import api from 'api';
import { HowlerSearchResponse } from 'api/search';
import FlexOne from 'commons/addons/flexers/FlexOne';
import { TuiList, TuiListItemOnSelect, TuiListItemProps } from 'commons/addons/lists';
import TuiSearchPagination from 'commons/addons/search/TuiSearchPagination';
import TuiSearchTotal from 'commons/addons/search/TuiSearchTotal';
import VSBox from 'commons/addons/vsbox/VSBox';
import VSBoxContent from 'commons/addons/vsbox/VSBoxContent';
import VSBoxHeader from 'commons/addons/vsbox/VSBoxHeader';
import { TemplateContext } from 'components/app/providers/TemplateProvider';
import { ViewContext } from 'components/app/providers/ViewProvider';
import HowlerCard from 'components/elements/display/HowlerCard';
import HitHeader from 'components/elements/hit/HitHeader';
import { HitLayout } from 'components/elements/hit/HitLayout';
import HitOutline from 'components/elements/hit/HitOutline';
import useMyLocalStorage from 'components/hooks/useMyLocalStorage';
import { Hit } from 'models/entities/generated/Hit';
import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Link, SetURLSearchParams, useSearchParams } from 'react-router-dom';
import { StorageKey } from 'utils/constants';
import BundleParentMenu from './BundleParentMenu';
import HitContextMenu from './HitContextMenu';
import HitFilter from './HitFilter';
import HitQuery from './HitQuery';
import HitSort from './HitSort';
import SearchSpan from './SearchSpan';

const HitSearch: FC<{
  error?: string;
  onSelection: TuiListItemOnSelect<Hit>;
  onSortChange: (sort: string) => void;
  onLookupChange: (filter: string) => void;
  onSpanChange: (span: string) => void;
  onPageChange: (offset: number) => void;
  triggerSearch: (query: string) => void;
  params: URLSearchParams;
  setParams: SetURLSearchParams;
  response: HowlerSearchResponse<Hit>;
  searching: boolean;
  top?: number;
}> = ({
  error,
  onSelection,
  onSortChange,
  onLookupChange,
  onPageChange,
  onSpanChange,
  triggerSearch,
  response,
  searching,
  top = 0
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const routeParams = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { refresh } = useContext(TemplateContext);
  const viewContext = useContext(ViewContext);
  const { get } = useMyLocalStorage();

  const verticalSorters = useMediaQuery('(max-width: 1919px)');

  const [bundleHit, setBundleHit] = useState<Hit>(null);

  const viewId = useMemo(
    () => (location.pathname.startsWith('/views') ? routeParams.id : null),
    [location.pathname, routeParams.id]
  );

  const selectedView = useMemo(
    () => viewContext.views?.find(_view => _view.view_id === viewId),
    [viewContext.views, viewId]
  );

  const layout: HitLayout = useMemo(
    () => (isMobile ? HitLayout.COMFY : get(StorageKey.HIT_LAYOUT) ?? HitLayout.NORMAL),
    [get]
  );

  const viewUrl = useMemo(() => {
    if (viewId) {
      return `/views/${viewId}/edit`;
    }

    const keys = [];
    if (searchParams.has('query')) {
      keys.push(`query=${searchParams.get('query')}`);
    }

    if (searchParams.has('sort')) {
      keys.push(`sort=${searchParams.get('sort')}`);
    }

    if (searchParams.has('span')) {
      keys.push(`span=${searchParams.get('span')}`);
    }

    return keys.length > 0 ? `/views/create?${keys.join('&')}` : '/views/create';
  }, [searchParams, viewId]);

  useEffect(() => {
    if (location.pathname.startsWith('/bundles') && routeParams.id) {
      api.hit.get(routeParams.id).then(result => {
        setBundleHit(result);
      });
    } else {
      setBundleHit(null);
    }
  }, [location.pathname, routeParams.id]);

  // Load the index field for a hit in order to provide autocomplete suggestions.
  useEffect(() => {
    refresh();
  }, [refresh]);

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
            searchParams.get('selected') === item.id && {
              '& .MuiPaper-root': { borderColor: 'primary.main' }
            }
          ]}
        >
          <HitOutline hit={item.item} layout={layout} />
        </Box>
      );
    },
    [layout, searchParams]
  );

  const viewButton = (
    <Tooltip title={viewId ? t('route.views.edit') : t('route.views.create')}>
      <IconButton size="small" component={Link} disabled={!viewId && !searchParams.has('query')} to={viewUrl}>
        {viewId ? <Edit fontSize="small" /> : <SavedSearch />}
      </IconButton>
    </Tooltip>
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
          ))}

        {bundleHit && (
          <Stack spacing={1} sx={{ mx: -1 }}>
            <HowlerCard
              sx={[
                { p: 1, border: '4px solid transparent', cursor: 'pointer' },
                location.pathname.startsWith('/bundles') &&
                  !searchParams.has('selected') && { borderColor: 'primary.main' }
              ]}
              onClick={() => {
                searchParams.delete('selected');
                setSearchParams(searchParams);
              }}
            >
              <HitHeader hit={bundleHit} layout={HitLayout.DENSE} useListener />
            </HowlerCard>
          </Stack>
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
        </Stack>

        <HitQuery disabled={viewId && !selectedView} searching={searching} triggerSearch={triggerSearch} />

        <Box sx={{ position: 'relative', pb: 1.5 }}>
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
            <HitSort onChange={onSortChange} useDefault={!viewId} />
            <HitFilter onChange={onLookupChange} />
            <SearchSpan onChange={onSpanChange} useDefault={!viewId} />
          </Stack>
          {searching && (
            <LinearProgress sx={theme => ({ position: 'absolute', bottom: theme.spacing(0.5), left: 0, right: 0 })} />
          )}
        </Box>
      </Stack>

      <VSBoxHeader ml={-1} mr={-1} pb={1}>
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
              onChange={onPageChange}
            />
          </Stack>
        )}
      </VSBoxHeader>
      <VSBoxContent mr={-1} ml={-1}>
        <HitContextMenu>
          <TuiList keyboard onSelection={onSelection}>
            {renderer}
          </TuiList>
        </HitContextMenu>
      </VSBoxContent>
    </VSBox>
  );
};

export default HitSearch;
