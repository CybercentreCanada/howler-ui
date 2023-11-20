import { PaletteMode } from '@mui/material';
import { Dispatch, SetStateAction } from 'react';
import { AppConfigs, AppLayoutMode, AppLeftNavElement, AppSwitcherItem } from './AppConfigs';
import { AppSearchItem, AppSearchMode, AppSearchService } from './AppSearchService';
import { BreadcrumbItem } from './hooks/useAppSitemap';

export type AppContextType = {
  // configs as provided by client application.
  configs: AppConfigs; // app specific configurations.
  theme: PaletteMode; // provided theme config.
  toggleTheme: () => void; // toggle between light/dark theme mode.
  toggleLanguage: () => void; // toggle between french/english language.
};

export type AppSwitcherContextType = {
  empty: boolean; // is the items list empty?
  items: AppSwitcherItem[]; // the items to render in the app switcher.
  setItems: (items: AppSwitcherItem[]) => void; // updates the items rendered by the app switcher.
};

export type AppQuickSearchContextType = {
  show: boolean; // is the quick search shown in the app bar?
  setShow: (show: boolean) => void; // specify whether to show the quick search in the app bar.
  toggle: () => void; // hide/show the quick search in the app bar.
};

export type AppSearchServiceContextType<T = any> = {
  provided: boolean; // has a search service been provided? - if false, then it means the default service is being used.
  service: AppSearchService<T>; // the search service implementation to use.
  state: AppSearchServiceState<T>; // the state of the search service.
};

export type AppLeftNavContextType = {
  open: boolean; // left nav is open/expanded?
  elements: AppLeftNavElement[]; // the elements to render in the left nav.
  toggle: () => void; // minimize/expand left nav.
  setOpen: (show: boolean) => void; // specify whether the left nav should be expanded[true] or minimized[false]
  setElements: (elements: AppLeftNavElement[]) => void; // specify the elements to render in the left nav.
};

export type AppLayoutContextType = {
  ready: boolean; // is the layout ready?
  current: AppLayoutMode; // the current mode of the layout ['side' | 'top].
  hideMenus: () => void; // hide the left nav menu and the app bar.
  setReady: (ready: boolean) => void; // specifiy whether the applayout is ready to render.
  toggle: () => void; // toggle between 'top' and 'side' layout mode.
};

export type AppBarContextType = {
  show: boolean; // is the appbar shown?
  autoHide: boolean; // is the appbar auto hiding on scroll or being sticky?
  setShow: (show: boolean) => void; // specify whether to show the app bar or not.
  setAutoHide: (autoHide: boolean) => void; // specify whether to auto hide the app bar.
  toggleAutoHide: () => void; // toggle the auto hide property.
};

export type AppBreadcrumbsContextType = {
  show: boolean; // are the breadcrumbs shown?
  items: BreadcrumbItem[]; // the items to render in the breadcrumbs.
  setItems: Dispatch<SetStateAction<BreadcrumbItem[]>>; // set the items to render in the breadcrumbs.
  toggle: () => void; // show/hide the breadcrumbs.
  last: () => BreadcrumbItem; // the first item in the breacrumbs.
  first: () => BreadcrumbItem; // the last item in the breadcrumbs.
};

export type AppSearchServiceState<T = any, R = any> = {
  searching: boolean; // indicates if the app search should show the progress indicator.
  menu: boolean; // is the app search result menu opened?
  mode: AppSearchMode; // inline vs fullscreen.
  items: AppSearchItem<T>[]; // the app search result items to render.
  result?: R; // any object, metadata related to the search result.
  set: (state: AppSearchServiceState<T>) => void; // update app search state.
};
