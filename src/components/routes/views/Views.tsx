import {
  Autocomplete,
  Card,
  Checkbox,
  IconButton,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material';
import { FC, useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Clear, Edit, Search, Star, StarBorder } from '@mui/icons-material';
import api from 'api';
import { HowlerSearchResponse } from 'api/search';
import TuiIconButton from 'commons/addons/display/buttons/TuiIconButton';
import FlexOne from 'commons/addons/flexers/FlexOne';
import { TuiListItemProps, TuiListProvider } from 'commons/addons/lists';
import useTuiListMethods from 'commons/addons/lists/hooks/useTuiListMethods';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import SaveViewDrawer from 'components/app/drawers/SaveViewDrawer';
import useAppDrawer from 'components/app/hooks/useAppDrawer';
import { ViewContext } from 'components/app/providers/ViewProvider';
import HowlerAvatar from 'components/elements/display/HowlerAvatar';
import ItemManager from 'components/elements/display/ItemManager';
import { ViewTitle } from 'components/elements/view/ViewTitle';
import useMyApi from 'components/hooks/useMyApi';
import { View } from 'models/entities/generated/View';
import { HowlerUser } from 'models/entities/HowlerUser';
import { useSearchParams } from 'react-router-dom';
import { sanitizeLuceneQuery } from 'utils/stringUtils';

const ViewsBase: FC = () => {
  const { t } = useTranslation();
  const { user } = useAppUser<HowlerUser>();
  const { dispatchApi } = useMyApi();
  const { favourites, addFavourite, fetchViews, removeFavourite, removeView, views, defaultView, setDefaultView } =
    useContext(ViewContext);
  const drawer = useAppDrawer();
  const [searchParams, setSearchParams] = useSearchParams();
  const { load } = useTuiListMethods();

  const [phrase, setPhrase] = useState<string>('');
  const [offset, setOffset] = useState(parseInt(searchParams.get('offset')) || 0);
  const [response, setResponse] = useState<HowlerSearchResponse<View>>(null);
  const [type, setType] = useState<'all' | 'personal' | 'global'>('all');
  const [hasError, setHasError] = useState(false);
  const [searching, setSearching] = useState(false);
  const [favouritesOnly, setFavouritesOnly] = useState(false);

  const onSearch = useCallback(async () => {
    try {
      setSearching(true);
      setHasError(false);

      if (phrase) {
        searchParams.set('phrase', phrase);
      } else {
        searchParams.delete('phrase');
      }
      setSearchParams(searchParams, { replace: true });

      fetchViews();

      const phraseQuery = phrase ? `*:*${sanitizeLuceneQuery(phrase)}*` : '*:*';
      const typeQuery = `(type:global OR owner:(${user.username} OR none)) AND type:(${type === 'all' ? '*' : type})`;
      const favouritesQuery =
        favouritesOnly && favourites.length > 0 ? ` AND view_id:(${favourites.join(' OR ')})` : '';

      setResponse(
        await dispatchApi(
          api.search.view.post({
            query: `${phraseQuery} AND ${typeQuery}${favouritesQuery}`,
            rows: 25,
            offset
          })
        )
      );
    } catch (e) {
      setHasError(true);
    } finally {
      setSearching(false);
    }
  }, [
    dispatchApi,
    favourites,
    favouritesOnly,
    fetchViews,
    offset,
    phrase,
    searchParams,
    setSearchParams,
    type,
    user.username
  ]);

  // Load the items into list when response changes.
  // This hook should only trigger when the 'response' changes.
  useEffect(() => {
    if (response) {
      load(
        response.items.map(item => ({
          id: item.view_id,
          item,
          selected: false,
          cursor: false
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response, load]);

  const onPageChange = useCallback(
    (_offset: number) => {
      if (_offset !== offset) {
        searchParams.set('offset', _offset.toString());
        setSearchParams(searchParams, { replace: true });
        setOffset(_offset);
      }
    },
    [offset, searchParams, setSearchParams]
  );

  const onDelete = useCallback(
    async (id: string) => {
      await dispatchApi(removeView(id));

      onSearch();
    },
    [dispatchApi, onSearch, removeView]
  );

  const onFavourite = useCallback(
    async (id: string) => {
      if (favourites.includes(id)) {
        await dispatchApi(removeFavourite(id));
        if (favourites?.length < 2) {
          setFavouritesOnly(false);
        }
      } else {
        await dispatchApi(addFavourite(id));
      }
    },
    [addFavourite, dispatchApi, favourites, removeFavourite]
  );

  const onEdit = useCallback(
    (view: View) =>
      drawer.open({
        titleKey: 'hit.search.save.view',
        children: <SaveViewDrawer viewId={view.view_id} title={view.title} query={view.query} />,
        onClosed: onSearch
      }),
    [drawer, onSearch]
  );

  useEffect(() => {
    onSearch();

    if (!searchParams.has('offset')) {
      searchParams.set('offset', '0');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatchApi, type]);

  useEffect(() => {
    if (response?.total <= offset) {
      setOffset(0);
      searchParams.set('offset', '0');
      setSearchParams(searchParams, { replace: true });
    }
  }, [offset, response?.total, searchParams, setSearchParams]);

  useEffect(() => {
    if (!searching) {
      onSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, favouritesOnly]);

  return (
    <ItemManager
      onSearch={onSearch}
      onPageChange={onPageChange}
      phrase={phrase}
      setPhrase={setPhrase}
      hasError={hasError}
      searching={searching}
      searchAdornment={
        <InputAdornment position="end">
          <ToggleButtonGroup
            sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}
            size="small"
            exclusive
            value={type}
            onChange={(__, _type) => {
              if (_type) {
                setType(_type);
              }
            }}
          >
            <ToggleButton value="all" aria-label="all">
              {t('all')}
            </ToggleButton>
            <ToggleButton value="personal" aria-label="personal">
              {t('route.views.manager.personal')}
            </ToggleButton>
            <ToggleButton value="global" aria-label="global">
              {t('route.views.manager.global')}
            </ToggleButton>
          </ToggleButtonGroup>
        </InputAdornment>
      }
      aboveSearch={
        <Typography
          sx={theme => ({ fontStyle: 'italic', color: theme.palette.text.disabled, mb: 0.5 })}
          variant="body2"
        >
          {t('route.views.search.prompt')}
        </Typography>
      }
      afterSearch={
        views.length > 0 ? (
          <Autocomplete
            options={views}
            renderOption={(props, o) => (
              <li {...props}>
                <Stack>
                  <Typography variant="body1">{t(o.title)}</Typography>
                  <Typography variant="caption">
                    <code>{o.query}</code>
                  </Typography>
                </Stack>
              </li>
            )}
            renderInput={params => (
              <TextField {...params} label={t('route.views.manager.default')} sx={{ minWidth: '300px' }} />
            )}
            filterOptions={(_views, { inputValue }) =>
              _views.filter(
                v =>
                  t(v.title).toLowerCase().includes(inputValue.toLowerCase()) ||
                  v.query.toLowerCase().includes(inputValue.toLowerCase())
              )
            }
            getOptionLabel={(v: View) => t(v.title)}
            isOptionEqualToValue={(view, value) => view.view_id === value.view_id}
            value={views.find(v => v.view_id === defaultView) ?? null}
            onChange={(_, option: View) => setDefaultView(option?.view_id)}
          />
        ) : (
          <Skeleton variant="rounded" width="300px" height="initial" />
        )
      }
      belowSearch={
        <Stack direction="row" spacing={1} alignItems="center">
          <Checkbox
            size="small"
            disabled={favourites?.length < 1}
            checked={favouritesOnly}
            onChange={(_, checked) => setFavouritesOnly(checked)}
          />
          <Typography variant="body1" sx={theme => ({ color: theme.palette.text.disabled })}>
            {t('route.views.manager.favourites')}
          </Typography>
        </Stack>
      }
      renderer={({ item }: TuiListItemProps<View>, classRenderer) => (
        <Card key={item.item.view_id} variant="outlined" sx={{ p: 1, mb: 1 }} className={classRenderer()}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TuiIconButton route={`/hits?qid=${item.item.view_id}`} tooltip={t('route.views.manager.open')}>
              <Search />
            </TuiIconButton>
            <ViewTitle {...item.item} />
            <FlexOne />
            {((item.item.owner === user.username && item.item.type !== 'readonly') ||
              (item.item.type === 'global' && user.is_admin)) && (
              <Tooltip title={t('button.edit')}>
                <IconButton onClick={() => onEdit(item.item)}>
                  <Edit />
                </IconButton>
              </Tooltip>
            )}
            {item.item.owner === user.username && item.item.type !== 'readonly' && (
              <Tooltip title={t('button.delete')}>
                <IconButton onClick={() => onDelete(item.item.view_id)}>
                  <Clear />
                </IconButton>
              </Tooltip>
            )}
            {item.item.type === 'global' && item.item.owner !== user.username && (
              <Tooltip title={item.item.owner}>
                <div>
                  <HowlerAvatar
                    sx={{ width: 24, height: 24, marginRight: '8px !important', marginLeft: '8px !important' }}
                    userId={item.item.owner}
                  />
                </div>
              </Tooltip>
            )}
            <Tooltip title={t('button.favourite')}>
              <IconButton onClick={() => onFavourite(item.item.view_id)}>
                {favourites.includes(item.item.view_id) ? <Star /> : <StarBorder />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Card>
      )}
      response={response}
      searchPrompt="route.views.manager.search"
    />
  );
};

const Views = () => {
  return (
    <TuiListProvider>
      <ViewsBase />
    </TuiListProvider>
  );
};

export default Views;
