import useLocalStorageItem from 'commons/components/utils/hooks/useLocalStorageItem';
import { createContext, ReactElement, useMemo, useState } from 'react';
import { AppStorageKeys } from '../AppConstants';
import { AppBarContextType } from '../AppContexts';
import { AppSearchService } from '../AppSearchService';
import useAppConfigs from '../hooks/useAppConfigs';
import AppBreadcrumbsProvider from './AppBreadcrumbsProvider';
import AppQuickSearchProvider from './AppQuickSearchProvider';
import AppSwitcherProvider from './AppSwitcherProvider';

const { LS_KEY_AUTOHIDE_APPBAR } = AppStorageKeys;

type AppTopNavProviderProps = {
  search?: AppSearchService;
  children: ReactElement | ReactElement[];
};

export const AppBarContext = createContext<AppBarContextType>(null);

export default function AppBarProvider({ search, children }: AppTopNavProviderProps) {
  const configs = useAppConfigs();
  const [show, setShow] = useState<boolean>(true);
  const [autoHide, setAutoHide] = useLocalStorageItem<boolean>(
    LS_KEY_AUTOHIDE_APPBAR,
    configs.preferences.defaultAutoHideAppbar
  );
  const context = useMemo(
    () => ({
      show,
      autoHide: configs.preferences.allowAutoHideTopbar && autoHide,
      setShow,
      setAutoHide,
      toggleAutoHide: () => setAutoHide(!autoHide)
    }),
    [configs.preferences.allowAutoHideTopbar, show, autoHide, setAutoHide]
  );
  return (
    <AppBarContext.Provider value={context}>
      <AppBreadcrumbsProvider>
        <AppSwitcherProvider>
          <AppQuickSearchProvider search={search}>{children}</AppQuickSearchProvider>
        </AppSwitcherProvider>
      </AppBreadcrumbsProvider>
    </AppBarContext.Provider>
  );
}
