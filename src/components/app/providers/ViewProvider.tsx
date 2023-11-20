import api from 'api';
import { AppLeftNavElement, AppLeftNavGroup, AppLeftNavItem } from 'commons/components/app/AppConfigs';
import useAppLeftNav from 'commons/components/app/hooks/useAppLeftNav';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import useMyApi from 'components/hooks/useMyApi';
import { useMyLocalStorageItem } from 'components/hooks/useMyLocalStorage';
import useMyPreferences from 'components/hooks/useMyPreferences';
import { View } from 'models/entities/generated/View';
import { HowlerUser } from 'models/entities/HowlerUser';
import { createContext, FC, PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StorageKey } from 'utils/constants';

export interface ViewContextType {
  ready: boolean;
  defaultView: string;
  setDefaultView: (viewId: string) => void;
  views: View[];
  favourites: string[];
  setFavourites: (ids: string[]) => void;
  addFavourite: (id: string) => Promise<void>;
  removeFavourite: (id: string) => Promise<void>;
  fetchViews: () => Promise<void>;
  addView: (v: View) => Promise<View>;
  editView: (id: string, title: string, query: string) => Promise<View>;
  removeView: (id: string) => Promise<void>;
}

export const ViewContext = createContext<ViewContextType>(null);

const ViewProvider: FC<PropsWithChildren> = ({ children }) => {
  const { t } = useTranslation();
  const { dispatchApi } = useMyApi();
  const preferences = useMyPreferences();
  const leftNav = useAppLeftNav();
  const appUser = useAppUser<HowlerUser>();
  const [defaultView, setDefaultView] = useMyLocalStorageItem<string>(StorageKey.DEFAULT_VIEW);
  const [views, setViews] = useState<{ ready: boolean; views: View[] }>({ ready: false, views: [] });
  const [favourites, setFavourites] = useState<string[]>();
  const fetchViews = useCallback(async () => setViews({ ready: true, views: await api.view.get() }), []);

  useEffect(() => {
    if (appUser.isReady()) {
      api.view.get().then((_views: View[]) => {
        const fav = appUser.user.favourite_views;
        setFavourites(fav);
        setViews({ ready: true, views: _views });
        const viewElements = (preferences.leftnav?.elements ?? leftNav.elements).map(e => {
          if (e.element?.id === 'views') {
            return {
              ...e,
              element: {
                ...e.element,
                items: fav
                  ?.map(vid => {
                    const view = _views.find(v => v.view_id === vid);
                    return view
                      ? {
                          id: view.view_id,
                          text: t(view.title),
                          route: `/hits?qid=${view.view_id}`,
                          nested: true
                        }
                      : null;
                  })
                  .filter(v => !!v)
              }
            };
          }
          return e;
        });
        leftNav.setElements(viewElements);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser.isReady(), preferences.leftnav?.elements]);

  useEffect(() => {
    if (defaultView && views.views.length > 0 && !views.views.find(v => v.view_id === defaultView)) {
      setDefaultView(undefined);
    }
  });

  const setFavouriteNavItem = useCallback((id: string, elements: AppLeftNavElement[], item: AppLeftNavItem) => {
    return elements.map(e => {
      if (e.element?.id === 'views') {
        const groupitems = (e.element as AppLeftNavGroup).items;
        const newItems = groupitems.some(i => i.id === id)
          ? groupitems.map(i => (i.id === id ? item : i)).filter(i => !!i)
          : [...groupitems, item];
        return {
          ...e,
          element: {
            ...e.element,
            items: newItems
          }
        };
      }
      return e;
    });
  }, []);

  const addView = useCallback(
    async (view: View) => {
      const newView = await dispatchApi(api.view.post(view));

      setViews(_views => ({ ..._views, views: [..._views.views, newView] }));

      if (newView.type === 'personal') {
        setFavourites([...favourites, newView.view_id]);
      }

      return newView;
    },
    [dispatchApi, favourites]
  );

  const editView = useCallback(async (id: string, title: string, query: string) => {
    const result = await api.view.put(id, title, query);

    setViews(_views => ({ ..._views, views: _views.views.map(v => (v.view_id === id ? { ...v, title, query } : v)) }));

    return result;
  }, []);

  const removeView = useCallback(async (id: string) => {
    const result = await api.view.del(id);

    setViews(_views => ({ ..._views, views: _views.views.filter(v => v.view_id !== id) }));

    return result;
  }, []);

  const addFavourite = useCallback(
    async (id: string) => {
      await api.view.favourite.post(id);

      setFavourites([...favourites, id]);

      const view = views.views.find(f => f.view_id === id);
      const navItem = {
        id: view.view_id,
        text: t(view.title),
        route: `/hits?qid=${view.view_id}`,
        nested: true
      };
      leftNav.setElements(setFavouriteNavItem(navItem.id, leftNav.elements, navItem));
    },
    [favourites, views, t, leftNav, setFavouriteNavItem]
  );

  const removeFavourite = useCallback(
    async (id: string) => {
      await api.view.favourite.del(id);

      setFavourites(favourites.filter(f => f !== id));
      leftNav.setElements(setFavouriteNavItem(id, leftNav.elements, null));
    },
    [favourites, leftNav, setFavouriteNavItem]
  );

  return (
    <ViewContext.Provider
      value={{
        ...views,
        favourites,
        addFavourite,
        removeFavourite,
        fetchViews,
        addView,
        editView,
        removeView,
        defaultView,
        setDefaultView,
        setFavourites
      }}
    >
      {children}
    </ViewContext.Provider>
  );
};

export default ViewProvider;
