import api from 'api';
import useMySitemap from 'components/hooks/useMySitemap';
import { capitalize } from 'lodash';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';

const useTitle = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const searchParams = useSearchParams()[0];
  const sitemap = useMySitemap();

  const setTitle = useCallback((title: string) => {
    document.querySelector('title').innerHTML = title;
  }, []);

  const runChecks = useCallback(async () => {
    const searchType = location.pathname.replace(/^\/(\w+)(\/.+)?$/, '$1').replace(/s$/, '');

    if (searchType === 'analytic') {
      if (params.id) {
        const result = await api.search.analytic.post({ query: `analytic_id:${params.id}`, rows: 1 });

        const analytic = result.items[0];

        setTitle(`${t('route.analytics.view')} - ${analytic.name}`);
      } else {
        setTitle(`Howler - ${t('route.analytics')}`);
      }
    } else if (searchType === 'hit' && params.id) {
      const result = await api.search.hit.post({ query: `howler.id:${params.id}`, rows: 1 });

      const hit = result.items[0];

      let newTitle = `${capitalize(hit.howler.escalation)} - ${hit.howler.analytic}`;
      if (hit.howler.detection) {
        newTitle += `: ${hit.howler.detection}`;
      }

      setTitle(newTitle);
    } else if (searchType === 'template' && location.pathname.endsWith('view') && searchParams.has('analytic')) {
      let title = t('route.templates.view');

      if (searchParams.has('analytic')) {
        title += ` - ${searchParams.get('analytic')}`;
      } else if (!searchParams.has('detection')) {
        title = `Howler - ${title}`;
      }

      if (searchParams.has('detection')) {
        title += `: ${searchParams.get('detection')}`;
      }

      setTitle(title);
    } else {
      const matchingRoute = sitemap.routes.find(_route => _route.path === location.pathname);

      if (matchingRoute) {
        setTitle(`Howler - ${t(matchingRoute.title)}`);
      }
    }
  }, [location.pathname, params.id, searchParams, setTitle, sitemap.routes, t]);

  useEffect(() => {
    runChecks();
  }, [runChecks]);
};

export default useTitle;
