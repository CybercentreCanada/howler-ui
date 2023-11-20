import { Card, CardContent, CardHeader, Chip, Grid, Typography } from '@mui/material';
import api from 'api';
import { HowlerSearchResponse } from 'api/search';
import { TuiListItemProps, TuiListProvider } from 'commons/addons/lists';
import useTuiListMethods from 'commons/addons/lists/hooks/useTuiListMethods';
import ItemManager from 'components/elements/display/ItemManager';
import useMyApi from 'components/hooks/useMyApi';
import { Analytic } from 'models/entities/generated/Analytic';
import { FC, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import { sanitizeLuceneQuery } from 'utils/stringUtils';

const AnalyticSearchBase: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { dispatchApi } = useMyApi();
  const { load } = useTuiListMethods();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searching, setSearching] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [phrase, setPhrase] = useState(searchParams.get('phrase') || '');
  const [offset, setOffset] = useState(parseInt(searchParams.get('offset')) || 0);
  const [response, setResponse] = useState<HowlerSearchResponse<Analytic>>(null);

  // Search Handler.
  const onSearch = useCallback(async () => {
    setSearching(true);
    setHasError(false);

    if (phrase) {
      searchParams.set('phrase', phrase);
    } else {
      searchParams.delete('phrase');
    }
    setSearchParams(searchParams, { replace: true });

    try {
      const sanitizedPhrase = sanitizeLuceneQuery(phrase);
      const _response = await dispatchApi(
        api.search.analytic.post({
          query: `name:*${sanitizedPhrase}* OR detections:*${sanitizedPhrase}*`,
          rows: 25,
          offset
        })
      );
      setResponse(_response);
      load(_response.items.map(u => ({ id: u.analytic_id, item: u })));
    } catch (e) {
      setHasError(true);
    } finally {
      setSearching(false);
    }
  }, [dispatchApi, load, offset, phrase, searchParams, setSearchParams]);

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

  // Effect to initialize list of users.
  useEffect(
    () => {
      onSearch();

      if (!searchParams.has('offset')) {
        searchParams.set('offset', '0');
        setSearchParams(searchParams, { replace: true });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

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
  }, [offset]);

  // Search result list item renderer.
  const renderer = useCallback(
    ({ item }: TuiListItemProps<Analytic>, classRenderer: () => string) => {
      return (
        <Card
          key={item.item.name}
          onClick={() => navigate(`/analytics/${item.item.analytic_id}`)}
          variant="outlined"
          className={classRenderer()}
          sx={{
            '&:hover': { borderColor: 'primary.main' },
            transitionProperty: 'border-color',
            cursor: 'pointer',
            mt: 1
          }}
        >
          <CardHeader title={item.item.name} />
          <CardContent sx={{ paddingTop: 0 }}>
            <Grid container spacing={1}>
              {item.item.detections.slice(0, 10).map(d => (
                <Grid item key={d}>
                  <Chip size="small" label={d} />
                </Grid>
              ))}
              {item.item.detections.length > 10 && (
                <Grid item>
                  <Chip size="small" label={`+ ${item.item.detections.length - 10}`} />
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      );
    },
    [navigate]
  );

  return (
    <ItemManager
      onSearch={onSearch}
      onPageChange={onPageChange}
      phrase={phrase}
      setPhrase={setPhrase}
      hasError={hasError}
      searching={searching}
      aboveSearch={
        <Typography
          sx={theme => ({ fontStyle: 'italic', color: theme.palette.text.disabled, mb: 0.5 })}
          variant="body2"
        >
          {t('route.analytics.search.prompt')}
        </Typography>
      }
      renderer={renderer}
      response={response}
      searchPrompt="route.analytics.manager.search"
    />
  );
};

const AnalyticSearch: FC = () => {
  return (
    <TuiListProvider>
      <AnalyticSearchBase />
    </TuiListProvider>
  );
};

export default AnalyticSearch;
