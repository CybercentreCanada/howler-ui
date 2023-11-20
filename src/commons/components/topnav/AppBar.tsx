import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import { APPBAR_READY_EVENT } from 'commons/components/app/hooks/useAppBarHeight';
import useAppBreadcrumbs from 'commons/components/app/hooks/useAppBreadcrumbs';
import useAppConfigs from 'commons/components/app/hooks/useAppConfigs';
import useAppLayout from 'commons/components/app/hooks/useAppLayout';
import useAppQuickSearch from 'commons/components/app/hooks/useAppQuickSearch';
import Breadcrumbs from 'commons/components/breadcrumbs/Breadcrumbs';
import AppSwitcher from 'commons/components/topnav/AppSwitcher';
import ThemeSelectionIcon from 'commons/components/topnav/ThemeSelectionIcon';
import UserProfile from 'commons/components/topnav/UserProfile';
import { memo, useCallback, useLayoutEffect, useMemo } from 'react';
import useAppBar from '../app/hooks/useAppBar';
import { Notification } from '../notification';
import AppSearch from '../search/AppSearch';
import AppName from './AppName';

export const AppBarBase = ({ children }) => {
  const layout = useAppLayout();
  const configs = useAppConfigs();
  const appbar = useAppBar();
  const isTopLayout = layout.current === 'top';
  const autoHide = !isTopLayout && appbar.autoHide;

  const elevation = useMemo(() => {
    if (layout.current === 'side') {
      return 0;
    }
    return configs.theme.appbar?.elevation !== undefined ? configs.theme.appbar?.elevation : 1;
  }, [layout, configs.theme.appbar?.elevation]);

  return (
    <MuiAppBar
      id="appbar"
      position={autoHide && !isTopLayout ? 'relative' : 'sticky'}
      elevation={elevation}
      sx={theme => ({
        '@media print': {
          display: 'none !important'
        },
        [theme.breakpoints.only('xs')]: {
          zIndex: theme.zIndex.drawer - 1
        },
        ...(isTopLayout
          ? {
              zIndex: theme.zIndex.drawer + 1,
              ...(configs.theme.appbar ? configs.theme.appbar[theme.palette.mode] : {})
            }
          : {
              color: theme.palette.getContrastText(theme.palette.background.paper),
              backgroundColor: theme.palette.background.paper
            })
      })}
    >
      {children}
    </MuiAppBar>
  );
};

const AppBar = () => {
  // React Hooks.
  const muiTheme = useTheme();

  // TUI hooks.
  const layout = useAppLayout();
  const configs = useAppConfigs();
  const breadcrumbs = useAppBreadcrumbs();
  const quicksearch = useAppQuickSearch();
  const { left, leftAfterBreadcrumbs, right, rightBeforeSearch, themeSelectionMode } = configs.preferences.topnav;

  // media queries.
  const isXs = useMediaQuery(muiTheme.breakpoints.only('xs'));
  // const isSmUp = useMediaQuery(muiTheme.breakpoints.up('sm'));
  const isMdDown = useMediaQuery(muiTheme.breakpoints.down('md'));
  // const isMdUp = useMediaQuery(muiTheme.breakpoints.up('md'));

  // compute some flags we need to perform render.
  const isTopLayout = layout.current === 'top';
  // const showSpacer = isXs || !quicksearch.show || (isMdUp && (breadcrumbs.show || !!left || !!leftAfterBreadcrumbs));
  const showBreadcrumbs = breadcrumbs.show && !isMdDown;

  // Once the dom is mounted, dispatch event to let listeners know
  //  that the apppbar/topbar dom is available.
  // Primary usecase is to initialize the 'useAppBarHeight' hook.
  // That value doesn't initialize properly because it typically gets
  //  called before the appbar is ready.
  // The appbar/top bar is conditionally rendered on app/user ready state.
  useLayoutEffect(() => {
    window.dispatchEvent(new CustomEvent(APPBAR_READY_EVENT));
  }, []);

  const renderLeft = useCallback(
    () => (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center'
        }}
      >
        {(isTopLayout || isXs) && <AppName noName={isXs} />}
        <Box sx={{ ...(isTopLayout && { marginLeft: 3 }) }} />
        {left}
        {showBreadcrumbs && <Breadcrumbs />}
        {leftAfterBreadcrumbs && (
          <Box sx={{ ...(showBreadcrumbs && { marginLeft: 3, marginRight: 3 }) }}>{leftAfterBreadcrumbs}</Box>
        )}
      </Box>
    ),
    [showBreadcrumbs, leftAfterBreadcrumbs, isTopLayout, left, isXs]
  );

  return (
    <AppBarBase>
      <Toolbar
        disableGutters
        style={{
          paddingLeft: !isXs && !isTopLayout ? muiTheme.spacing(2) : null,
          paddingRight: muiTheme.spacing(1)
        }}
      >
        {renderLeft()}
        <div style={{ flex: 1 }} />
        {rightBeforeSearch}
        {quicksearch.show && <AppSearch />}
        {right}
        {themeSelectionMode === 'icon' && <ThemeSelectionIcon />}
        {configs.preferences.notificationURLs && <Notification urls={configs.preferences.notificationURLs} />}
        <AppSwitcher />
        {!configs.preferences.topnav.hideUserAvatar && <UserProfile />}
      </Toolbar>
    </AppBarBase>
  );
};

export default memo(AppBar);
