import type { FC } from 'react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Save } from '@mui/icons-material';
import {
  Alert,
  CircularProgress,
  Divider,
  LinearProgress,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import api from 'api';
import type { HowlerSearchResponse } from 'api/search';
import TuiButton from 'commons/addons/display/buttons/TuiButton';
import FlexPort from 'commons/addons/flexers/FlexPort';
import TuiListEmpty from 'commons/addons/lists/TuiListEmpty';
import TuiSearchTotal from 'commons/addons/search/TuiSearchTotal';
import VSBox from 'commons/addons/vsbox/VSBox';
import VSBoxContent from 'commons/addons/vsbox/VSBoxContent';
import VSBoxHeader from 'commons/addons/vsbox/VSBoxHeader';
import PageCenter from 'commons/components/pages/PageCenter';
import { HitContext } from 'components/app/providers/HitProvider';
import { ParameterContext } from 'components/app/providers/ParameterProvider';
import { ViewContext } from 'components/app/providers/ViewProvider';
import HitCard from 'components/elements/hit/HitCard';
import { HitLayout } from 'components/elements/hit/HitLayout';
import useMyApi from 'components/hooks/useMyApi';
import { useMyLocalStorageItem } from 'components/hooks/useMyLocalStorage';
import useMySnackbar from 'components/hooks/useMySnackbar';
import type { Hit } from 'models/entities/generated/Hit';
import { useParams } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';
import { StorageKey } from 'utils/constants';
import HitQuery from '../hits/search/HitQuery';
import HitSort from '../hits/search/HitSort';
import SearchSpan from '../hits/search/SearchSpan';

const ViewComposer: FC = () => {
  const { t } = useTranslation();
  const { dispatchApi } = useMyApi();
  const { showSuccessMessage, showErrorMessage } = useMySnackbar();
  const viewContext = useContext(ViewContext);
  const routeParams = useParams();
  const pageCount = useMyLocalStorageItem(StorageKey.PAGE_COUNT, 25)[0];

  const loadHits = useContextSelector(HitContext, ctx => ctx.loadHits);

  // view state
  const [title, setTitle] = useState('');
  const [type, setType] = useState('global');

  const query = useContextSelector(ParameterContext, ctx => ctx.query);
  const setQuery = useContextSelector(ParameterContext, ctx => ctx.setQuery);
  const sort = useContextSelector(ParameterContext, ctx => ctx.sort);
  const setSort = useContextSelector(ParameterContext, ctx => ctx.setSort);
  const span = useContextSelector(ParameterContext, ctx => ctx.span);
  const setSpan = useContextSelector(ParameterContext, ctx => ctx.setSpan);

  // Non-view state
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [error, setError] = useState<string>(null);
  const [response, setResponse] = useState<HowlerSearchResponse<Hit>>();

  const onSave = useCallback(async () => {
    setLoading(true);

    try {
      if (!routeParams.id) {
        await viewContext.addView({
          title,
          type,
          query,
          sort: sort || null,
          span: span || null
        });
      } else {
        await viewContext.editView(routeParams.id, title, query, sort || null, span || null);
      }

      showSuccessMessage(t('route.views.create.success'));
    } catch (e) {
      showErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  }, [query, routeParams.id, showErrorMessage, showSuccessMessage, sort, span, t, title, type, viewContext]);

  const search = useCallback(
    async (_query: string) => {
      setQuery(_query);

      setSearching(true);
      setError(null);

      try {
        const _response = await dispatchApi(
          api.search.hit.post({
            rows: pageCount,
            query: _query,
            sort,
            filters: span ? [span] : []
          }),
          { showError: false, throwError: true }
        );

        loadHits(_response.items);
        setResponse(_response);
      } catch (e) {
        setError(e.message);
      } finally {
        setSearching(false);
      }
    },
    [dispatchApi, loadHits, pageCount, setQuery, sort, span]
  );

  useEffect(() => {
    search(query || 'howler.id:*');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // We only run this when ancillary properties (i.e. filters, sorting) change
  useEffect(() => {
    if (query) {
      search(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, span]);

  useEffect(() => {
    if (routeParams.id) {
      const viewToEdit = viewContext.views?.find(_view => _view.view_id === routeParams.id);

      if (!viewToEdit && viewContext.views?.length > 0) {
        setError('route.views.missing');
        return;
      } else {
        setError(null);
      }

      if (viewToEdit) {
        setTitle(viewToEdit.title);
        setQuery(viewToEdit.query);

        if (viewToEdit.sort) {
          setSort(viewToEdit.sort);
        }

        if (viewToEdit.span) {
          setSpan(viewToEdit.span);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeParams.id, viewContext.views]);

  return (
    <FlexPort>
      <PageCenter maxWidth="1500px" textAlign="left" height="100%">
        <VSBox top={0}>
          <VSBoxHeader pb={1}>
            <Stack spacing={1}>
              {error && (
                <Alert variant="outlined" severity="error">
                  {t(error)}
                </Alert>
              )}
              <Stack direction="row" spacing={1}>
                <TextField
                  label={t('route.views.name')}
                  size="small"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  fullWidth
                />
                <ToggleButtonGroup
                  sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}
                  size="small"
                  exclusive
                  value={type}
                  onChange={(__, _type) => {
                    if (_type) {
                      setType(_type);
                    }
                  }}
                >
                  <ToggleButton value="personal" aria-label="personal">
                    {t('route.views.manager.personal')}
                  </ToggleButton>
                  <ToggleButton value="global" aria-label="global">
                    {t('route.views.manager.global')}
                  </ToggleButton>
                </ToggleButtonGroup>
                <TuiButton
                  variant="outlined"
                  disabled={!title || !type || !query || !response || loading || searching}
                  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                  onClick={onSave}
                >
                  {t('save')}
                </TuiButton>
              </Stack>
              <Typography
                sx={theme => ({
                  color: theme.palette.text.secondary,
                  fontSize: '0.9em',
                  fontStyle: 'italic',
                  mb: 0.5
                })}
                variant="body2"
              >
                {t('hit.search.prompt')}
              </Typography>
              <HitQuery triggerSearch={search} searching={searching} />
              <Stack
                direction="row"
                spacing={1}
                sx={{ '& > :not(.MuiDivider-root)': { flex: 1 } }}
                divider={<Divider flexItem orientation="vertical" />}
              >
                <HitSort />
                <SearchSpan useDefault={false} />
              </Stack>
              {response?.total ? (
                <TuiSearchTotal
                  total={response.total}
                  pageLength={response.items.length}
                  offset={response.offset}
                  sx={theme => ({ color: theme.palette.text.secondary, fontSize: '0.9em', fontStyle: 'italic' })}
                />
              ) : null}
              <LinearProgress sx={[!searching && { opacity: 0 }]} />
            </Stack>
          </VSBoxHeader>
          <VSBoxContent>
            <Stack spacing={1}>
              {!response?.total && <TuiListEmpty />}
              {response?.items.map(hit => <HitCard key={hit.howler.id} id={hit.howler.id} layout={HitLayout.DENSE} />)}
            </Stack>
          </VSBoxContent>
        </VSBox>
      </PageCenter>
    </FlexPort>
  );
};

export default ViewComposer;
