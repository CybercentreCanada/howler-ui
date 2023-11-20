import api from 'api';
import { FieldContext } from 'components/app/providers/FieldProvider';
import { TemplateContext } from 'components/app/providers/TemplateProvider';
import useMyApi from 'components/hooks/useMyApi';
import { FC, useCallback, useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Compact from './aggregate/Compact';
import Detailed from './aggregate/Detailed';

const HitAggregate: FC<{ query: string; compact?: boolean; onStart?: () => void; onComplete?: () => void }> = ({
  query,
  compact = false,
  onStart,
  onComplete
}) => {
  const { getMatchingTemplate, getTemplates } = useContext(TemplateContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const { dispatchApi } = useMyApi();
  const { hitFields } = useContext(FieldContext);

  const [loading, setLoading] = useState(false);
  const [keyCounts, setKeyCounts] = useState<{ [key: string]: number }>({});
  const [aggregateResults, setAggregateResults] = useState<{ [key: string]: { [value: string]: number } }>({});

  const performAggregation = useCallback(async () => {
    if (onStart) {
      onStart();
    }

    setLoading(true);
    setAggregateResults({});

    try {
      // Get a list of every key in every template of the first 100 hits we're searching
      const _keyCounts = (
        await dispatchApi(
          api.search.hit.post({
            query,
            rows: 100
          })
        )
      ).items
        .flatMap(h => getMatchingTemplate(h)?.keys ?? [])
        // Take that array and reduce it to unique keys and the number of times we see it
        .reduce((acc, val) => {
          if (acc[val]) {
            acc[val]++;
          } else {
            acc[val] = 1;
          }

          return acc;
        }, {} as { [index: string]: number });

      // We'll save this for later
      setKeyCounts(_keyCounts);

      // Sort the fields based on the number of occurrences, and maybe reduce the list to the five most frequent if we're using a compact view
      const sortedKeys = Object.keys(_keyCounts)
        .sort((a, b) => _keyCounts[b] - _keyCounts[a])
        .filter((_, i) => !compact || i < 5);

      // Facet each field
      for (const key of sortedKeys) {
        const result = await dispatchApi(
          api.search.facet.hit.post(key, {
            query,
            rows: compact ? 5 : 25
          })
        );

        setAggregateResults(_results => ({
          ..._results,
          [key]: result
        }));
      }
    } finally {
      setLoading(false);

      if (onComplete) {
        onComplete();
      }
    }
  }, [compact, dispatchApi, getMatchingTemplate, onComplete, onStart, query]);

  const setSearch = useCallback(
    (key, value) => {
      searchParams.set('query', `${key}:${value}`);
      setSearchParams(searchParams);
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    getTemplates();

    if (compact) {
      performAggregation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getTemplates]);

  useEffect(() => {
    setAggregateResults({});

    if (compact) {
      performAggregation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return compact ? (
    <Compact setSearch={setSearch} aggregateResults={aggregateResults} hitFields={hitFields} />
  ) : (
    <Detailed
      loading={loading}
      performAggregation={performAggregation}
      setSearch={setSearch}
      aggregateResults={aggregateResults}
      keyCounts={keyCounts}
      hitFields={hitFields}
    />
  );
};

export default HitAggregate;
