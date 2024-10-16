import api from 'api';
import { useAppUser } from 'commons/components/app/hooks';
import useMyApi from 'components/hooks/useMyApi';
import { useMyLocalStorageItem } from 'components/hooks/useMyLocalStorage';
import type { HowlerUser } from 'models/entities/HowlerUser';
import type { View } from 'models/entities/generated/View';
import { createContext, useCallback, useEffect, useState, type FC, type PropsWithChildren } from 'react';
import { StorageKey } from 'utils/constants';

export interface ViewContextType {
  ready: boolean;
  defaultView: string;
  setDefaultView: (viewId: string) => void;
  views: View[];
  addFavourite: (id: string) => Promise<void>;
  removeFavourite: (id: string) => Promise<void>;
  fetchViews: (force?: boolean) => Promise<void>;
  addView: (v: View) => Promise<View>;
  editView: (id: string, title: string, query: string, sort: string, span: string) => Promise<View>;
  removeView: (id: string) => Promise<void>;
}

export const ViewContext = createContext<ViewContextType>(null);

const ViewProvider: FC<PropsWithChildren> = ({ children }) => {
  const { dispatchApi } = useMyApi();
  const appUser = useAppUser<HowlerUser>();
  const [defaultView, setDefaultView] = useMyLocalStorageItem<string>(StorageKey.DEFAULT_VIEW);

  const [loading, setLoading] = useState(false);
  const [views, setViews] = useState<{ ready: boolean; views: View[] }>({ ready: false, views: [] });

  const fetchViews = useCallback(
    async (force = false) => {
      if (views.ready && !force) {
        return;
      }

      setLoading(true);
      try {
        setViews({ ready: true, views: await api.view.get() });
      } finally {
        setLoading(false);
      }
    },
    [views.ready]
  );

  useEffect(() => {
    if (!views.ready && !loading) {
      fetchViews();
    }
  }, [fetchViews, views.ready, appUser, loading]);

  useEffect(() => {
    if (defaultView && views.views?.length > 0 && !views.views?.find(v => v.view_id === defaultView)) {
      setDefaultView(undefined);
    }
  });

  const editView = useCallback(async (id: string, title: string, query: string, sort: string, span: string) => {
    const result = await api.view.put(id, title, query, sort, span);

    setViews(_views => ({ ..._views, views: _views.views.map(v => (v.view_id === id ? { ...v, title, query } : v)) }));

    return result;
  }, []);

  const addFavourite = useCallback(
    async (id: string) => {
      await api.view.favourite.post(id);

      appUser.setUser({
        ...appUser.user,
        favourite_views: [...appUser.user.favourite_views, id]
      });
    },
    [appUser]
  );

  const addView = useCallback(
    async (view: View) => {
      const newView = await dispatchApi(api.view.post(view));

      setViews(_views => ({ ..._views, views: [..._views.views, newView] }));

      addFavourite(newView.view_id);

      return newView;
    },
    [addFavourite, dispatchApi]
  );

  const removeFavourite = useCallback(
    async (id: string) => {
      await api.view.favourite.del(id);

      appUser.setUser({
        ...appUser.user,
        favourite_views: appUser.user.favourite_views.filter(v => v !== id)
      });
    },
    [appUser]
  );

  const removeView = useCallback(
    async (id: string) => {
      const result = await api.view.del(id);

      setViews(_views => ({ ..._views, views: _views.views.filter(v => v.view_id !== id) }));

      if (appUser.user?.favourite_views.includes(id)) {
        removeFavourite(id);
      }

      return result;
    },
    [appUser.user?.favourite_views, removeFavourite]
  );

  return (
    <ViewContext.Provider
      value={{
        ...views,
        addFavourite,
        removeFavourite,
        fetchViews,
        addView,
        editView,
        removeView,
        defaultView,
        setDefaultView
      }}
    >
      {children}
    </ViewContext.Provider>
  );
};

export default ViewProvider;
