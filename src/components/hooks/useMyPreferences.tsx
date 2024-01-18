import {
  Article,
  Code,
  Dashboard,
  Description,
  Help,
  Key,
  ManageSearch,
  QueryStats,
  SavedSearch,
  Search,
  SettingsSuggest,
  Shield,
  Storage,
  SupervisorAccount,
  Terminal
} from '@mui/icons-material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SettingsIcon from '@mui/icons-material/Settings';
import { Avatar, Box, Stack, Typography } from '@mui/material';
import { AppLeftNavElement, AppPreferenceConfigs } from 'commons/components/app/AppConfigs';
import Classification from 'components/elements/display/Classification';

import HowlerLogo from 'components/elements/display/icons/HowlerLogo';
import { useMemo } from 'react';

// This is your App Name that will be displayed in the left drawer and the top navbar
const APP_NAME = 'Howler';

// This is your app logo, it should definitely be an svg logo but we will use an icon here instead
const APP_LOGO = (
  <Avatar
    variant="rounded"
    style={{
      backgroundColor: 'transparent',
      height: 44,
      width: 44,
      marginLeft: -10
    }}
  >
    <HowlerLogo fontSize="inherit" style={{ width: 43, height: 43 }} />
  </Avatar>
);

// Howler banner.
const APP_BANNER = (
  <Stack mt={2} mb={2} alignItems="center">
    <HowlerLogo fontSize="inherit" style={{ fontSize: '3em' }} />
    <Box m={1} />
    <Typography variant="inherit">{APP_NAME}</Typography>
  </Stack>
);

export default function useMyPreferences(): AppPreferenceConfigs {
  // The following menu items will show up in the Left Navigation Drawer
  const MENU_ITEMS = useMemo<AppLeftNavElement[]>(
    () => [
      {
        type: 'item',
        element: {
          id: 'dashboard',
          i18nKey: 'route.home',
          route: '/',
          icon: <Dashboard />
        }
      },
      {
        type: 'item',
        element: {
          id: 'search.hit',
          i18nKey: 'route.hits',
          route: '/hits',
          icon: <Search />
        }
      },
      {
        type: 'group',
        element: {
          id: 'views',
          i18nKey: 'route.views.saved',
          icon: <SavedSearch />,
          items: []
        }
      },
      {
        type: 'item',
        element: {
          id: 'views.manager',
          i18nKey: 'route.views.manager',
          route: '/views',
          icon: <ManageSearch />
        }
      },
      {
        type: 'item',
        element: {
          id: 'templates',
          i18nKey: 'route.templates',
          route: '/templates',
          icon: <Article />
        }
      },
      {
        type: 'item',
        element: {
          id: 'analytics',
          i18nKey: 'route.analytics',
          route: '/analytics',
          icon: <QueryStats />
        }
      },
      {
        type: 'group',
        element: {
          id: 'action',
          i18nKey: 'route.actions',
          icon: <SettingsSuggest />,
          userPropValidators: [{ prop: 'roles', value: ['automation_basic'] }],
          items: [
            {
              id: 'action.change',
              i18nKey: 'route.actions.change',
              icon: <Terminal />,
              route: '/action/execute'
            },
            {
              id: 'action.search',
              i18nKey: 'route.actions.manager',
              icon: <Search />,
              route: '/action'
            },
          ].filter(entry => !!entry)
        }
      },
      {
        type: 'item',
        element: {
          id: 'advanced',
          i18nKey: 'route.advanced',
          route: '/advanced',
          icon: <Code />
        }
      },
      {
        type: 'divider',
        element: null
      },
      {
        type: 'group',
        element: {
          id: 'help',
          i18nKey: 'page.help',
          icon: <Help />,
          items: [
            {
              id: 'help.client',
              i18nKey: 'route.help.client',
              route: '/help/client',
              nested: true,
              icon: <Terminal />
            },
            { id: 'help.hit', i18nKey: 'route.help.hit', route: '/help/hit', nested: true, icon: <Shield /> },
            { id: 'help.search', i18nKey: 'route.help.search', route: '/help/search', nested: true, icon: <Search /> },
            {
              id: 'help.views',
              i18nKey: 'route.help.views',
              route: '/help/views',
              nested: true,
              icon: <SavedSearch />
            },
            {
              id: 'help.templates',
              i18nKey: 'route.help.templates',
              route: '/help/templates',
              nested: true,
              icon: <Article />
            },
            { id: 'help.auth', i18nKey: 'route.help.auth', route: '/help/auth', nested: true, icon: <Key /> },
            {
              id: 'help.actions',
              i18nKey: 'route.help.actions',
              route: '/help/actions',
              nested: true,
              icon: <SettingsSuggest />
            },
            { id: 'help.api', i18nKey: 'route.help.api', route: '/help/api', nested: true, icon: <Storage /> },
            {
              id: 'help.notebook',
              i18nKey: 'route.help.notebook',
              route: '/help/notebook',
              nested: true,
              icon: <Description />
            }
          ]
        }
      }
    ],
    // prettier-ignore
    []
  );

  // This is the basic user menu, it is a menu that shows up in account avatar popover.
  const USER_MENU_ITEMS = useMemo(
    () => [
      {
        i18nKey: 'usermenu.settings',
        route: '/settings',
        icon: <SettingsIcon />
      },
      {
        i18nKey: 'usermenu.logout',
        route: '/logout',
        icon: <ExitToAppIcon />
      }
    ],
    []
  );

  // This is the basic administrator menu, it is a menu that shows up under the user menu in the account avatar popover.
  const ADMIN_MENU_ITEMS = useMemo(
    () => [
      {
        i18nKey: 'adminmenu.users',
        route: '/admin/users',
        icon: <SupervisorAccount />
      }
    ],
    []
  );

  // Return memoized config to prevent unnecessary re-renders.
  return useMemo(
    () => ({
      appName: APP_NAME,
      allowGravatar: false,
      appIconDark: APP_LOGO,
      appIconLight: APP_LOGO,
      bannerLight: APP_BANNER,
      defaultShowQuickSearch: true,
      bannerDark: APP_BANNER,
      avatarD: 'retro',
      topnav: {
        apps: [],
        userMenu: USER_MENU_ITEMS,
        userMenuI18nKey: 'usermenu',
        adminMenu: ADMIN_MENU_ITEMS,
        adminMenuI18nKey: 'adminmenu',
        quickSearchParam: 'query',
        quickSearchURI: '/hits',
        rightBeforeSearch: <Classification />
      },
      leftnav: {
        elements: MENU_ITEMS
      }
    }),
    [USER_MENU_ITEMS, ADMIN_MENU_ITEMS, MENU_ITEMS]
  );
}
