import api from 'api';
import { HowlerSearchResponse } from 'api/search';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import { HowlerUser } from 'models/entities/HowlerUser';
import { Analytic } from 'models/entities/generated/Analytic';
import { FC, PropsWithChildren, createContext, useCallback, useEffect, useState } from 'react';
import { sanitizeLuceneQuery } from 'utils/stringUtils';

interface AnalyticContextType {
  ready: boolean;
  analytics: Analytic[];
  addFavourite: (analytic: Analytic) => Promise<void>;
  removeFavourite: (analytic: Analytic) => Promise<void>;
  getIdFromName: (name: string) => Promise<string>;
  getAnalyticFromName: (name: string) => Promise<Analytic>;
}

export const AnalyticContext = createContext<AnalyticContextType>(null);

/**
 * A set of promises for each analytic search. This is to stop several identical
 * requests from going due to issues with react state updates not happening fast enough
 */
const PROMISES: { [index: string]: Promise<HowlerSearchResponse<Analytic>> } = {};

const AnalyticProvider: FC<PropsWithChildren> = ({ children }) => {
  const appUser = useAppUser<HowlerUser>();
  const [analytics, setAnalytics] = useState<{ ready: boolean; analytics: Analytic[] }>({
    ready: false,
    analytics: []
  });

  const fetchAnalytics = useCallback(
    async () => setAnalytics({ ready: true, analytics: (await api.analytic.get()) as Analytic[] }),
    []
  );

  useEffect(() => {
    if (!analytics.ready) {
      fetchAnalytics();
    }
  }, [analytics.ready, fetchAnalytics]);

  const addFavourite = useCallback(
    async (analytic: Analytic) => {
      await api.analytic.favourite.post(analytic.analytic_id);

      appUser.setUser({
        ...appUser.user,
        favourite_analytics: [...appUser.user.favourite_analytics, analytic.analytic_id]
      });
    },
    [appUser]
  );

  const removeFavourite = useCallback(
    async (analytic: Analytic) => {
      await api.analytic.favourite.del(analytic.analytic_id);

      appUser.setUser({
        ...appUser.user,
        favourite_analytics: appUser.user.favourite_analytics.filter(v => v !== analytic.analytic_id)
      });
    },
    [appUser]
  );

  const getAnalyticFromName = useCallback(
    async (name: string) => {
      if (analytics[name]) {
        return analytics[name];
      }

      // We check to see if there's already a request in progress
      if (!PROMISES[name]) {
        PROMISES[name] = api.search.analytic.post({
          query: `name:(${sanitizeLuceneQuery(name)})`
        });
      }

      try {
        const result = await PROMISES[name];

        const analytic = result.items?.[0];

        if (analytic) {
          setAnalytics({ ...analytics, [name]: analytic });
          return analytic;
        }
      } catch (e) {}

      return null;
    },
    [analytics]
  );

  const getIdFromName = useCallback(
    async (name: string) => {
      return (await getAnalyticFromName(name))?.analytic_id;
    },
    [getAnalyticFromName]
  );

  return (
    <AnalyticContext.Provider
      value={{ ...analytics, addFavourite, removeFavourite, getAnalyticFromName, getIdFromName }}
    >
      {children}
    </AnalyticContext.Provider>
  );
};

export default AnalyticProvider;
