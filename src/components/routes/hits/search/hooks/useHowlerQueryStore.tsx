import { TuiQueryItem, TuiQueryStoreService } from 'commons/addons/controls/query';
import { ViewContext, ViewContextType } from 'components/app/providers/ViewProvider';
import { View } from 'models/entities/generated/View';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

export const useHowlerQueryStore = (): TuiQueryStoreService & { provider: ViewContextType } => {
  const { t } = useTranslation();
  const searchParams = useSearchParams()[0];
  const viewProvider = useContext(ViewContext);

  const convert = useCallback(
    (v: View): TuiQueryItem => ({
      id: v.view_id,
      type: 'query',
      name: t(v.title),
      value: v.query
    }),
    [t]
  );

  const [items, setItems] = useState<{ ready: boolean; items: TuiQueryItem[] }>({
    ready: viewProvider.ready,
    items: viewProvider.views?.map(convert)
  });

  useEffect(() => {
    if (viewProvider.ready) {
      setItems({ ready: true, items: viewProvider.views?.map(convert) });
    }
  }, [convert, viewProvider.ready, viewProvider.views]);

  const onCreate = useCallback(
    async (name: string, query: string, global: boolean) => {
      const addedFilters = searchParams.getAll('filter').join(' AND ');

      const newView = await viewProvider.addView({
        query: query + (addedFilters ? ` AND (${addedFilters})` : ''),
        title: name,
        type: global ? 'global' : 'personal'
      });

      return newView.view_id;
    },
    [searchParams, viewProvider]
  );

  const onSave = useCallback(
    async (item: TuiQueryItem) => {
      await viewProvider.editView(item.id, item.name, item.value);
      return item.id;
    },
    [viewProvider]
  );

  const onDelete = useCallback(
    async (id: string) => {
      await viewProvider.removeView(id);
      return true;
    },
    [viewProvider]
  );

  return useMemo(
    () => ({
      ...items,
      provider: viewProvider,
      onCreate,
      onSave,
      onDelete
    }),
    [items, viewProvider, onCreate, onSave, onDelete]
  );
};
