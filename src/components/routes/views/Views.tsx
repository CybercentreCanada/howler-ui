import {
  Autocomplete,
  Button,
  Card,
  Checkbox,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material';
import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Clear, Edit, Star, StarBorder } from '@mui/icons-material';
import api from 'api';
import { HowlerSearchResponse } from 'api/search';
import FlexOne from 'commons/addons/flexers/FlexOne';
import { TuiListItemProps, TuiListProvider } from 'commons/addons/lists';
import useTuiListMethods from 'commons/addons/lists/hooks/useTuiListMethods';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import { ViewContext } from 'components/app/providers/ViewProvider';
import HowlerAvatar from 'components/elements/display/HowlerAvatar';
import ItemManager from 'components/elements/display/ItemManager';
import { ViewTitle } from 'components/elements/view/ViewTitle';
import useMyApi from 'components/hooks/useMyApi';
import { useMyLocalStorageItem } from 'components/hooks/useMyLocalStorage';
import { View } from 'models/entities/generated/View';
import { HowlerUser } from 'models/entities/HowlerUser';
import { Link, useSearchParams } from 'react-router-dom';
import { StorageKey } from 'utils/constants';
import { sanitizeLuceneQuery } from 'utils/stringUtils';

const ViewsBase: FC = () => {
  const { t } = useTranslation();
  const { user } = useAppUser<HowlerUser>();
  const { dispatchApi } = useMyApi();
  const { addFavourite, fetchViews, removeFavourite, removeView, views, defaultView, setDefaultView } =
    useContext(ViewContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const { load } = useTuiListMethods();
  const pageCount = useMyLocalStorageItem(StorageKey.PAGE_COUNT, 25)[0];

  const [phrase, setPhrase] = useState<string>('');
  const [offset, setOffset] = useState(parseInt(searchParams.get('offset')) || 0);
  const [response, setResponse] = useState<HowlerSearchResponse<View>>(null);
  const [types, setTypes] = useState<('personal' | 'global')[]>([]);
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
      const typeQuery = `(type:global OR owner:(${user.username} OR none)) AND type:(${types.join(' OR ') || '*'}${
        types.includes('personal') ? ' OR readonly' : ''
      })`;
      const favouritesQuery =
        favouritesOnly && user.favourite_views.length > 0 ? ` AND view_id:(${user.favourite_views.join(' OR ')})` : '';

      setResponse(
        await dispatchApi(
          api.search.view.post({
            query: `${phraseQuery} AND ${typeQuery}${favouritesQuery}`,
            rows: pageCount,
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
    phrase,
    setSearchParams,
    searchParams,
    fetchViews,
    user.username,
    user.favourite_views,
    types,
    favouritesOnly,
    dispatchApi,
    pageCount,
    offset
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
    async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, id: string) => {
      event.preventDefault();

      if (user.favourite_views?.includes(id)) {
        await dispatchApi(removeFavourite(id));
        if (user.favourite_views?.length < 2) {
          setFavouritesOnly(false);
        }
      } else {
        await dispatchApi(addFavourite(id));
      }
    },
    [addFavourite, dispatchApi, removeFavourite, user.favourite_views]
  );

  useEffect(() => {
    onSearch();

    if (!searchParams.has('offset')) {
      searchParams.set('offset', '0');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatchApi, types]);

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
      searchFilters={
        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup
            sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}
            size="small"
            value={types}
            onChange={(__, _types) => {
              if (_types) {
                setTypes(_types.length < 2 ? _types : []);
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
        </Stack>
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
        <Stack direction="row" spacing={1}>
          {views.length > 0 ? (
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
          )}
          <Button variant="outlined" component={Link} to="/views/create">
            {t('route.views.create')}
          </Button>
        </Stack>
      }
      belowSearch={
        <Stack direction="row" spacing={1} alignItems="center">
          <Checkbox
            size="small"
            disabled={user.favourite_views?.length < 1}
            checked={favouritesOnly}
            onChange={(_, checked) => setFavouritesOnly(checked)}
          />
          <Typography variant="body1" sx={theme => ({ color: theme.palette.text.disabled })}>
            {t('route.views.manager.favourites')}
          </Typography>
        </Stack>
      }
      renderer={({ item }: TuiListItemProps<View>, classRenderer) => (
        <Card
          key={item.item.view_id}
          variant="outlined"
          sx={{ p: 1, mb: 1, transitionProperty: 'border-color', '&:hover': { borderColor: 'primary.main' } }}
          className={classRenderer()}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ color: 'inherit', textDecoration: 'none' }}
            component={Link}
            to={`/views/${item.item.view_id}`}
          >
            <ViewTitle {...item.item} />
            <FlexOne />
            {((item.item.owner === user.username && item.item.type !== 'readonly') ||
              (item.item.type === 'global' && user.is_admin)) && (
              <Tooltip title={t('button.edit')}>
                <IconButton component={Link} to={`/views/${item.item.view_id}/edit`}>
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
            <Tooltip title={t('button.pin')}>
              <IconButton onClick={e => onFavourite(e, item.item.view_id)}>
                {user.favourite_views?.includes(item.item.view_id) ? <Star /> : <StarBorder />}
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
