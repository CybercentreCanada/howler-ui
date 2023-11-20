import api from 'api';
import { HowlerSearchResponse } from 'api/search';
import { Analytic } from 'models/entities/generated/Analytic';
import { createContext, FC, PropsWithChildren, useCallback, useState } from 'react';
import { sanitizeLuceneQuery } from 'utils/stringUtils';

interface AnalyticContextType {
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
  const [analytics, setAnalytics] = useState<{ [name: string]: Analytic }>({});

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

      const result = await PROMISES[name];

      const analytic = result.items?.[0];

      if (analytic) {
        setAnalytics({ ...analytics, [name]: analytic });
        return analytic;
      } else {
        return null;
      }
    },
    [analytics]
  );

  const getIdFromName = useCallback(
    async (name: string) => {
      return (await getAnalyticFromName(name))?.analytic_id;
    },
    [getAnalyticFromName]
  );

  return <AnalyticContext.Provider value={{ getAnalyticFromName, getIdFromName }}>{children}</AnalyticContext.Provider>;
};

export default AnalyticProvider;
