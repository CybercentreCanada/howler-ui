import api from 'api';
import { AppPreferenceConfigs, AppSiteMapConfigs, AppThemeConfigs } from 'commons/components/app/AppConfigs';
import AppProvider from 'commons/components/app/AppProvider';
import { AppSearchService } from 'commons/components/app/AppSearchService';
import LayoutSkeleton from 'commons/components/app/AppSkeleton';
import { AppUserService } from 'commons/components/app/AppUserService';
import useAppLayout from 'commons/components/app/hooks/useAppLayout';
import useAppSwitcher from 'commons/components/app/hooks/useAppSwitcher';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import Modal from 'components/elements/display/Modal';
import useMyApi from 'components/hooks/useMyApi';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import useMyLocalStorage from 'components/hooks/useMyLocalStorage';
import useMyPreferences from 'components/hooks/useMyPreferences';
import useMySitemap from 'components/hooks/useMySitemap';
import useMyTheme from 'components/hooks/useMyTheme';
import useMyUser from 'components/hooks/useMyUser';
import useLogin from 'components/logins/hooks/useLogin';
import LoginScreen from 'components/logins/Login';
import NotFoundPage from 'components/routes/404';
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
import HitDocumentation from 'components/routes/help/HitDocumentation';
import NotebookDocumentation from 'components/routes/help/NotebookDocumentation';
import SearchDocumentation from 'components/routes/help/SearchDocumentation';
import TemplateDocumentation from 'components/routes/help/TemplateDocumentation';
import ViewDocumentation from 'components/routes/help/ViewDocumentation';
import HitBrowser from 'components/routes/hits/search/HitBrowser';
import HitViewer from 'components/routes/hits/view/HitViewer';
import Home from 'components/routes/home';
import Logout from 'components/routes/Logout';
import Settings from 'components/routes/settings/Settings';
import Templates from 'components/routes/templates/Templates';
import TemplateViewer from 'components/routes/templates/TemplateViewer';
import Views from 'components/routes/views/Views';
import { Hit } from 'models/entities/generated/Hit';
import { HowlerUser } from 'models/entities/HowlerUser';
import { FC, PropsWithChildren, useEffect } from 'react';
import { Routes, useLocation, useNavigate } from 'react-router';
import { BrowserRouter, Route } from 'react-router-dom';
import { StorageKey } from 'utils/constants';
import useMySearch from '../hooks/useMySearch';
import AppContainer from './AppContainer';
import AnalyticProvider from './providers/AnalyticProvider';
import ApiConfigProvider from './providers/ApiConfigProvider';
import AvatarProvider from './providers/AvatarProvider';
import FieldProvider from './providers/FieldProvider';
import LocalStorageProvider from './providers/LocalStorageProvider';
import ModalProvider from './providers/ModalProvider';
import SocketProvider from './providers/SocketProvider';
import TemplateProvider from './providers/TemplateProvider';
import UserListProvider from './providers/UserListProvider';
import ViewProvider from './providers/ViewProvider';


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

  // Register the routes
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/logout" element={<Logout />} />
      <Route
        path="/"
        element={
          appUser.isReady() && appLayout.ready && apiConfig.config.indexes ? <AppContainer /> : <LayoutSkeleton />
        }
      >
        <Route index element={<Home />} />
        <Route path="hits" element={<HitBrowser />} />
        <Route path="hits/:id" element={<HitViewer />} />
        <Route path="bundles/:id" element={<HitBrowser />} />
        <Route path="templates" element={<Templates />} />
        <Route path="templates/view" element={<TemplateViewer />} />
        <Route path="views" element={<Views />} />
        <Route path="admin/users" element={<UserSearchProvider />} />
        <Route path="admin/users/:id" element={<UserEditor />} />
        <Route path="analytics" element={<AnalyticSearch />} />
        <Route path="analytics/:id" element={<AnalyticDetails />} />
        <Route path="help/search" element={<SearchDocumentation />} />
        <Route path="help/api" element={<ApiDocumentation />} />
        <Route path="help/auth" element={<AuthDocumentation />} />
        <Route path="help/client" element={<ClientDocumentation />} />
        <Route path="help/hit" element={<HitDocumentation />} />
        <Route path="help/templates" element={<TemplateDocumentation />} />
        <Route path="help/actions" element={<ActionDocumentation />} />
        <Route path="help/notebook" element={<NotebookDocumentation />} />
        <Route path="help/views" element={<ViewDocumentation />} />
        <Route path="settings" element={<Settings />} />
        <Route path="advanced" element={<QueryBuilder />} />
        {appUser.user?.roles?.includes('automation_basic') && (
          <Route path="action">
            <Route index element={<ActionSearchProvider />} />
            <Route path="create" element={<ActionEditor />} />
            <Route path=":id">
              <Route index element={<ActionDetails />} />
              <Route path="edit" element={<ActionEditor />} />
            </Route>
            <Route path="execute" element={<ActionEditor />} />
          </Route>
        )}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

const MyAppProvider: FC<PropsWithChildren> = ({ children }) => {
  const myPreferences: AppPreferenceConfigs = useMyPreferences();
  const myTheme: AppThemeConfigs = useMyTheme();
  const mySitemap: AppSiteMapConfigs = useMySitemap();
  const myUser: AppUserService<HowlerUser> = useMyUser();
  const mySearch: AppSearchService<Hit> = useMySearch();
  return (
    <AppProvider preferences={myPreferences} theme={myTheme} sitemap={mySitemap} user={myUser} search={mySearch}>
      <ViewProvider>
        <AvatarProvider>
          <ModalProvider>
            <FieldProvider>
              <LocalStorageProvider>
                <SocketProvider>
                  <TemplateProvider>
                    <AnalyticProvider>
                      <UserListProvider>{children}</UserListProvider>
                    </AnalyticProvider>
                  </TemplateProvider>
                </SocketProvider>
              </LocalStorageProvider>
            </FieldProvider>
          </ModalProvider>
        </AvatarProvider>
      </ViewProvider>
    </AppProvider>
  );
};

const App: FC = () => {
  return (
    <BrowserRouter>
      <ApiConfigProvider>
        <MyAppProvider>
          <MyApp />
          <Modal />
        </MyAppProvider>
      </ApiConfigProvider>
    </BrowserRouter>
  );
};

export default App;
