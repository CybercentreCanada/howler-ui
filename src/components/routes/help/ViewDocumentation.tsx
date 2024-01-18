import { Add, Clear, FavoriteBorder, Input, Star, StarOutline } from '@mui/icons-material';
import { Card } from '@mui/material';
import api from 'api';
import { HowlerSearchResponse } from 'api/search';
import { TuiQueryItem } from 'commons/addons/controls/query';
import { TuiQuery } from 'commons/addons/controls/query/TuiQuery';
import TuiIconButton from 'commons/addons/display/buttons/TuiIconButton';
import PageCenter from 'commons/components/pages/PageCenter';
import Markdown from 'components/elements/display/Markdown';
import { ViewTitle } from 'components/elements/view/ViewTitle';
import useMyApi from 'components/hooks/useMyApi';
import { Hit } from 'models/entities/generated/Hit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { delay } from 'utils/utils';
import { HowlerHitSearchRequest } from '../hits/search/HitSearch';
import { HitSearchMenu } from '../hits/search/HitSearchMenu';
import { useHowlerQueryStore } from '../hits/search/hooks/useHowlerQueryStore';

import VIEWS_EN from './markdown/en/views.md';
import VIEWS_FR from './markdown/fr/views.md';

const MockQuery = ({ searchString, request, response }) => {
  const store = useHowlerQueryStore();

  const storeOptionRenderer = useCallback(
    (item: TuiQueryItem) => {
      const view = store.provider.views.find(v => v.view_id === item.id);
      return view && <ViewTitle {...view} />;
    },
    [store.provider.views]
  );

  const storeOptionMenuRenderer = useCallback(
    (item: TuiQueryItem) => {
      const favourited = store.provider.favourites.some(view_id => view_id === item.id);
      return [
        <TuiIconButton key={item.id} onClick={() => {}}>
          {favourited ? <Star /> : <StarOutline />}
        </TuiIconButton>
      ];
    },
    [store]
  );

  return (
    <TuiQuery
      q="query"
      state={new URLSearchParams(searchString)}
      onChange={() => {}}
      store={store}
      PhraseProps={{
        endAdornment: (
          <HitSearchMenu
            hasError={false}
            dropdownView={null}
            request={request}
            response={response}
            onSort={() => {}}
            onAggregate={() => {}}
            onFilter={() => {}}
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
  );
};

const ViewDocumentation: FC = () => {
  const { t, i18n } = useTranslation();
  const store = useHowlerQueryStore();
  const { dispatchApi } = useMyApi();

  const [response, setResponse] = useState<HowlerSearchResponse<Hit>>();

  const md = useMemo(
    () => (i18n.language === 'en' ? VIEWS_EN : VIEWS_FR).replace(/\$CURRENT_URL/g, window.location.origin),
    [i18n.language]
  );

  const [view1, view2] = useMemo(
    () => [
      store.items[Math.floor(Math.random() * store.items.length)],
      store.items[Math.floor(Math.random() * store.items.length)]
    ],
    [store.items]
  );

  const request = useMemo<HowlerHitSearchRequest>(
    () => ({
      dispatch: false,
      offset: 0,
      rows: 25,
      query: 'howler.id:*',
      sort: 'event.created desc'
    }),
    []
  );

  useEffect(() => {
    dispatchApi(api.search.hit.post(request), { showError: false, throwError: false, logError: false })
      .then(setResponse)
      .then(() => delay(200))
      .then(() => {
        document.querySelectorAll('#saving span').forEach(span => {
          if (span.attributes.getNamedItem('aria-label')?.nodeValue === t('tui.query.save.alert')) {
            span.querySelector('button').click();
          }
        });
      });
  }, [dispatchApi, request, t]);

  return (
    <PageCenter margin={4} width="100%" textAlign="left">
      <Markdown
        md={md}
        components={{
          plus: (
            <TuiIconButton size="small">
              <Add fontSize="inherit" />
            </TuiIconButton>
          ),
          search_select: (
            <MockQuery
              searchString={`query=${encodeURIComponent('howler.id:*')}&qid=${view1?.id}`}
              request={request}
              response={response}
            />
          ),
          search_select_multiple: (
            <MockQuery
              searchString={`query=${encodeURIComponent('howler.id:*')}&qid=${view1?.id}&sep=AND&qid=${view2?.id}`}
              request={request}
              response={response}
            />
          ),
          load: (
            <TuiIconButton tooltip={t('tui.query.views.load')} size="small">
              <Input fontSize="inherit" />
            </TuiIconButton>
          ),
          clear: (
            <TuiIconButton tooltip={t('tui.query.views.clear')} size="small">
              <Clear fontSize="inherit" />
            </TuiIconButton>
          ),
          search_query: (
            <MockQuery
              searchString={`query=${encodeURIComponent(
                'howler.analytic:"Example Analytic" AND howler.status:resolved'
              )}&qid=${view1?.id}`}
              request={request}
              response={response}
            />
          ),
          heart: (
            <TuiIconButton tooltip={t('tui.query.save.alert')} size="small">
              <FavoriteBorder fontSize="small" />
            </TuiIconButton>
          ),
          search_saving: (
            <div id="saving">
              <MockQuery
                searchString={`query=${encodeURIComponent(
                  'howler.analytic:"Example Analytic" AND howler.status:resolved'
                )}&qid=${view1?.id}`}
                request={request}
                response={response}
              />
            </div>
          ),
          searching_saving_with_active_views: (
            <MockQuery
              searchString={`query=${encodeURIComponent('howler.id:*')}&qid=${view1?.id}&sep=AND&qid=${view2?.id}`}
              request={request}
              response={response}
            />
          ),
          query_result: (
            <Card variant="outlined" sx={{ p: 1 }}>
              <code>
                {'(('}
                {view1?.value}){' AND ('}
                {view2?.value}){') AND (howler.id:*)'}
              </code>
            </Card>
          )
        }}
      />
    </PageCenter>
  );
};
export default ViewDocumentation;
