import { loader } from '@monaco-editor/react';
import api from 'api';
import type { AppPreferenceConfigs, AppSiteMapConfigs, AppThemeConfigs } from 'commons/components/app/AppConfigs';
import AppProvider from 'commons/components/app/AppProvider';
import type { AppSearchService } from 'commons/components/app/AppSearchService';
import LayoutSkeleton from 'commons/components/app/AppSkeleton';
import type { AppUserService } from 'commons/components/app/AppUserService';
import { useAppLayout, useAppSwitcher, useAppUser } from 'commons/components/app/hooks';
import Modal from 'components/elements/display/Modal';
import useMyApi from 'components/hooks/useMyApi';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import useMyLocalStorage from 'components/hooks/useMyLocalStorage';
import useMyPreferences from 'components/hooks/useMyPreferences';
import useMySitemap from 'components/hooks/useMySitemap';
import useMyTheme from 'components/hooks/useMyTheme';
import useMyUser from 'components/hooks/useMyUser';
import LoginScreen from 'components/logins/Login';
import useLogin from 'components/logins/hooks/useLogin';
import NotFoundPage from 'components/routes/404';
import ErrorBoundary from 'components/routes/ErrorBoundary';
import Logout from 'components/routes/Logout';
import ActionEditor from 'components/routes/action/edit/ActionEditor';
import ActionDetails from 'components/routes/action/view/ActionDetails';
import ActionSearchProvider from 'components/routes/action/view/ActionSearch';
import UserEditor from 'components/routes/admin/users/UserEditor';
import UserSearchProvider from 'components/routes/admin/users/UserSearch';
import QueryBuilder from 'components/routes/advanced/QueryBuilder';
import AnalyticDetails from 'components/routes/analytics/AnalyticDetails';
import AnalyticSearch from 'components/routes/analytics/AnalyticSearch';
import ActionDocumentation from 'components/routes/help/ActionDocumentation';
import ApiDocumentation from 'components/routes/help/ApiDocumentation';
import AuthDocumentation from 'components/routes/help/AuthDocumentation';
import ClientDocumentation from 'components/routes/help/ClientDocumentation';
import HelpDashboard from 'components/routes/help/Help';
import HitDocumentation from 'components/routes/help/HitDocumentation';
import SearchDocumentation from 'components/routes/help/SearchDocumentation';
import TemplateDocumentation from 'components/routes/help/TemplateDocumentation';
import ViewDocumentation from 'components/routes/help/ViewDocumentation';
import HitBrowser from 'components/routes/hits/search/HitBrowser';
import HitViewer from 'components/routes/hits/view/HitViewer';
import Home from 'components/routes/home';
import OverviewViewer from 'components/routes/overviews/OverviewViewer';
import Overviews from 'components/routes/overviews/Overviews';
import Settings from 'components/routes/settings/Settings';
import TemplateViewer from 'components/routes/templates/TemplateViewer';
import Templates from 'components/routes/templates/Templates';
import ViewComposer from 'components/routes/views/ViewComposer';
import Views from 'components/routes/views/Views';
import type { HowlerUser } from 'models/entities/HowlerUser';
import type { Hit } from 'models/entities/generated/Hit';
import * as monaco from 'monaco-editor';
import { useEffect, type FC, type PropsWithChildren } from 'react';
import { createBrowserRouter, Outlet, RouterProvider, useLocation, useNavigate } from 'react-router-dom';
import { StorageKey } from 'utils/constants';
import useMySearch from '../hooks/useMySearch';
import AppContainer from './AppContainer';
import AnalyticProvider from './providers/AnalyticProvider';
import ApiConfigProvider from './providers/ApiConfigProvider';
import AvatarProvider from './providers/AvatarProvider';
import FavouriteProvider from './providers/FavouritesProvider';
import FieldProvider from './providers/FieldProvider';
import LocalStorageProvider from './providers/LocalStorageProvider';
import ModalProvider from './providers/ModalProvider';
import OverviewProvider from './providers/OverviewProvider';
import SocketProvider from './providers/SocketProvider';
import TemplateProvider from './providers/TemplateProvider';
import UserListProvider from './providers/UserListProvider';
import ViewProvider from './providers/ViewProvider';

loader.config({ monaco });

const RoleRoute = ({ role }) => {
  const appUser = useAppUser<HowlerUser>();

  if (appUser.user?.roles?.includes(role)) {
    return <Outlet />;
  }
  return <NotFoundPage />;
};

// Your application's initialization flow.
const MyApp: FC = () => {
  // From this point on, we use the commons' hook.
  const { getUser } = useLogin();
  const { dispatchApi } = useMyApi();
  const appLayout = useAppLayout();
  const appUser = useAppUser<HowlerUser>();
  const location = useLocation();
  const navigate = useNavigate();
  const apiConfig = useMyApiConfig();
  const { setItems } = useAppSwitcher();
  const { get, set, remove } = useMyLocalStorage();

  // Simulate app loading time...
  // e.g. fetching initial app data, etc.
  useEffect(() => {
    dispatchApi(api.configs.get()).then(data => {
      apiConfig.setConfig(data);

      if (data?.configuration?.ui?.apps) {
        setItems(data.configuration.ui.apps);
      }
    });

    if (appUser.isReady() || (!get(StorageKey.APP_TOKEN) && !get(StorageKey.REFRESH_TOKEN))) {
      return;
    }

    getUser();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (appUser.isReady()) {
      appLayout.setReady(true);

      // TODO: Remove in a little while
      remove(StorageKey.ETAG);
    } else if (!get(StorageKey.APP_TOKEN) && !get(StorageKey.REFRESH_TOKEN)) {
      if (location.pathname !== '/login') {
        set(StorageKey.NEXT_LOCATION, location.pathname);
        set(StorageKey.NEXT_SEARCH, location.search);
        navigate('/login');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser.isReady()]);

  // we don't display the skeleton for certain paths
  return (appLayout.ready && apiConfig.config?.indexes) ||
    location.pathname === '/login' ||
    location.pathname === '/logout' ? (
    <AppContainer />
  ) : (
    <LayoutSkeleton />
  );
};

const MyAppProvider: FC<PropsWithChildren> = ({ children }) => {
  const myPreferences: AppPreferenceConfigs = useMyPreferences();
  const myTheme: AppThemeConfigs = useMyTheme();
  const mySitemap: AppSiteMapConfigs = useMySitemap();
  const myUser: AppUserService<HowlerUser> = useMyUser();
  const mySearch: AppSearchService<Hit> = useMySearch();

  return (
    <ErrorBoundary>
      <AppProvider preferences={myPreferences} theme={myTheme} sitemap={mySitemap} user={myUser} search={mySearch}>
        <ErrorBoundary>
          <ViewProvider>
            <AvatarProvider>
              <ModalProvider>
                <FieldProvider>
                  <LocalStorageProvider>
                    <SocketProvider>
                      <TemplateProvider>
                        <OverviewProvider>
                          <AnalyticProvider>
                            <FavouriteProvider>
                              <UserListProvider>{children}</UserListProvider>
                            </FavouriteProvider>
                          </AnalyticProvider>
                        </OverviewProvider>
                      </TemplateProvider>
                    </SocketProvider>
                  </LocalStorageProvider>
                </FieldProvider>
              </ModalProvider>
            </AvatarProvider>
          </ViewProvider>
        </ErrorBoundary>
      </AppProvider>
    </ErrorBoundary>
  );
};

const AppProviderWrapper = () => {
  return (
    <ApiConfigProvider>
      <MyAppProvider>
        <MyApp />
        <Modal />
      </MyAppProvider>
    </ApiConfigProvider>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppProviderWrapper />,
    children: [
      {
        path: 'login',
        element: <LoginScreen />
      },
      {
        path: 'logout',
        element: <Logout />
      },
      {
        index: true,
        element: <Home />
      },
      {
        path: 'hits',
        element: <HitBrowser />
      },
      {
        path: 'search',
        element: <HitBrowser />
      },
      {
        path: 'hits/:id',
        element: <HitViewer />
      },
      {
        path: 'bundles/:id',
        element: <HitBrowser />
      },
      {
        path: 'templates',
        element: <Templates />
      },
      {
        path: 'templates/view',
        element: <TemplateViewer />
      },
      {
        path: 'overviews',
        element: <Overviews />
      },
      {
        path: 'overviews/view',
        element: <OverviewViewer />
      },
      {
        path: 'views',
        element: <Views />
      },
      {
        path: 'views/create',
        element: <ViewComposer />
      },
      {
        path: 'views/:id',
        element: <HitBrowser />
      },
      {
        path: 'views/:id/edit',
        element: <ViewComposer />
      },
      {
        path: 'admin/users',
        element: <UserSearchProvider />
      },
      {
        path: 'admin/users/:id',
        element: <UserEditor />
      },
      {
        path: 'analytics',
        element: <AnalyticSearch />
      },
      {
        path: 'analytics/:id',
        element: <AnalyticDetails />
      },
      {
        path: 'help',
        element: <HelpDashboard />
      },
      {
        path: 'help/search',
        element: <SearchDocumentation />
      },
      {
        path: 'help/api',
        element: <ApiDocumentation />
      },
      {
        path: 'help/auth',
        element: <AuthDocumentation />
      },
      {
        path: 'help/client',
        element: <ClientDocumentation />
      },
      {
        path: 'help/hit',
        element: <HitDocumentation />
      },
      {
        path: 'help/templates',
        element: <TemplateDocumentation />
      },
      {
        path: 'help/actions',
        element: <ActionDocumentation />
      },
      {
        path: 'help/views',
        element: <ViewDocumentation />
      },
      {
        path: 'settings',
        element: <Settings />
      },
      {
        path: 'advanced',
        element: <QueryBuilder />
      },
      {
        path: 'settings',
        element: <Settings />
      },
      {
        path: 'action',
        element: <RoleRoute role="automation_basic" />,
        children: [
          {
            index: true,
            element: <ActionSearchProvider />
          },
          {
            path: 'execute',
            element: <ActionEditor />
          },
          {
            path: ':id',
            children: [
              {
                index: true,
                element: <ActionDetails />
              },
              {
                path: 'edit',
                element: <ActionEditor />
              }
            ]
          }
        ]
      },
      {
        path: '*',
        element: <NotFoundPage />
      }
    ]
  }
]);

const App: FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
