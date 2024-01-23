import {
  Article,
  Code,
  Dashboard,
  Description,
  Edit,
  EditNote,
  Help,
  Info,
  Key,
  ManageSearch,
  PersonSearch,
  QueryStats,
  SavedSearch,
  Search,
  SettingsSuggest,
  Shield,
  Storage,
  Terminal,
  Work
} from '@mui/icons-material';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import { AppSiteMapConfigs } from 'commons/components/app/AppConfigs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// SiteMapContextProps configuration properties.
// exceptLast: boolean = false (default) -> render all breadcrumb except the current route.
// allLinks: boolean = false (default) -> render all breadcrumbs as links.
// lastOnly: boolean = false (default) -> only render the current route.
// itemsBefore: number = 1 (default) -> the number of items to show before the ellipsis.
// itemsAfter: number = 1 (default) -> the number of items to show after the ellipsis.
// routes: SiteMapRoute[] = [] (default) -> the list of routes that will define the application sitemap.

// For each individual SiteMapRoute:
// path: string -> the react router path to this route.
// title: string -> the title/lable to display in breadcrumbs for this route.
// icon?: React.ReactNode -> the icon component to show beside the title/lable.
// isRoot?: boolean = false -> when true, indicates that the breadcrumbs will reset to this one path each time it is encountered.
// isLeaf?: boolean = false -> when true, indicates that this path does not aggregate in breadcrumbs, i.e. will be replaced by next path.
// excluded?: boolean = false -> when true, indicates to breadcrumbs component to not render this route.
// breadcrumbs?: string[] -> a static list of breadcrumb paths to be rendered for the given route.
// textWidth?: number -> the max width of the text when rendering the breadcrumb.
export default function useMySitemap(): AppSiteMapConfigs {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      routes: [
        { path: '/', title: t('route.home'), isRoot: true, icon: <Dashboard /> },
        { path: '/admin/users', title: t('route.admin.user.search'), isRoot: true, icon: <PersonSearch /> },
        {
          path: '/admin/users/:id',
          title: t('route.admin.user.details'),
          isLeaf: true,
          breadcrumbs: ['/admin/users'],
          icon: <PersonIcon />
        },
        { path: '/help', title: t('route.help'), isRoot: true, icon: <Help /> },
        { path: '/help/api', title: t('route.help.api'), isLeaf: true, icon: <Storage /> },
        { path: '/help/search', title: t('route.help.search'), isLeaf: true, icon: <Search /> },
        { path: '/help/client', title: t('route.help.client'), isLeaf: true, icon: <Terminal /> },
        { path: '/help/auth', title: t('route.help.auth'), isLeaf: true, icon: <Key /> },
        { path: '/help/actions', title: t('route.help.actions'), isLeaf: true, icon: <SettingsSuggest /> },
        { path: '/help/hit', title: t('route.help.hit'), isLeaf: true, icon: <Shield /> },
        { path: '/help/templates', title: t('route.help.templates'), isLeaf: true, icon: <Article /> },
        { path: '/help/views', title: t('route.help.views'), isLeaf: true, icon: <SavedSearch /> },
        { path: '/hits', title: t('route.hits'), isRoot: true, icon: <Search /> },
        { path: '/views', title: t('route.hits.views'), isRoot: true, icon: <SavedSearch /> },
        {
          path: '/bundles/:id',
          title: t('route.hits.bundle'),
          isLeaf: true,
          breadcrumbs: [],
          icon: <Work />
        },
        {
          path: '/hits/:id',
          title: t('route.hits.view'),
          isLeaf: true,
          breadcrumbs: ['/hits'],
          icon: <Info />
        },
        {
          path: '/templates',
          title: t('route.templates'),
          isRoot: true,
          icon: <Article />
        },
        {
          path: '/templates/view',
          title: t('route.templates.view'),
          breadcrumbs: ['/templates'],
          isLeaf: true,
          icon: <Description />
        },
        {
          path: '/views',
          title: t('route.views.manager'),
          isRoot: true,
          icon: <ManageSearch />
        },
        {
          path: '/analytics',
          title: t('route.analytics'),
          isRoot: true,
          icon: <QueryStats />
        },
        {
          path: '/action',
          title: t('route.actions'),
          isRoot: true,
          icon: <Terminal />
        },
        {
          path: '/action/create',
          title: t('route.actions.create'),
          isRoot: true,
          breadcrumbs: ['/action']
        },
        {
          path: '/action/execute',
          title: t('route.actions.change'),
          isRoot: true,
          breadcrumbs: ['/action'],
          icon: <EditNote />
        },
        {
          path: '/action/:id',
          title: t('route.actions.view'),
          isRoot: true,
          breadcrumbs: ['/action']
        },
        {
          path: '/action/:id/edit',
          title: t('route.actions.edit'),
          isRoot: true,
          breadcrumbs: ['/action'],
          icon: <Edit />
        },
        {
          path: '/analytics/:id',
          title: t('route.analytics.view'),
          isLeaf: true,
          breadcrumbs: ['/analytics'],
          icon: <Info />
        },
        { path: '/home', title: t('route.home'), isRoot: true, icon: <Dashboard /> },
        { path: '/settings', title: t('page.settings.sitemap'), isRoot: true, icon: <SettingsIcon /> },
        { path: '/advanced', title: t('route.advanced'), isRoot: true, icon: <Code /> }
      ]
    }),
    [t]
  );
}
