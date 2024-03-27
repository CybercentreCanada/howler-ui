import { grey, indigo, pink, teal } from '@mui/material/colors';
import moment from 'moment';

export const HOWLER_API = import.meta.env.VITE_API;
export const LOCAL = HOWLER_API === 'MOCK';
export const VERSION = import.meta.env.VITE_VERSION;

// A constant that will be used as prefix of all local storage keys.
export const MY_LOCAL_STORAGE_PREFIX = 'howler.ui';
export const MY_SESSION_STORAGE_PREFIX = `${MY_LOCAL_STORAGE_PREFIX}.cache`;

export const ESCALATION_COLORS = {
  alert: 'warning',
  evidence: 'error',
  hit: 'primary'
};

export const STATUS_COLORS = {
  open: 'primary',
  'in-progress': 'warning',
  resolved: 'success'
};

export const PROVIDER_COLORS = {
  HBS: indigo[700],
  NBS: pink.A200,
  CBS: teal[700],
  howler: '#1769bb',
  unknown: grey[700]
};

export enum StorageKey {
  DEFAULT_VIEW = 'default.view',
  PROVIDER = 'provider',
  REFRESH_TOKEN = 'refresh_token',
  USERNAME = 'username',
  APP_TOKEN = 'app_token',
  TOKEN_EXPIRY = 'token_expiry',
  NEXT_LOCATION = 'next.location',
  NEXT_SEARCH = 'next.search',
  LAYOUT_TYPE = 'layout.type',
  SHOW_DETAILS = 'hit.panel.details',
  TIMEZONE = 'timezone',
  DEV_MODE = 'dev_mode',
  DASHBOARD_LAYOUT = 'dashboard_layout',
  DEFAULT_FIELDS = 'default_fields',
  HIT_LAYOUT = 'hit_layout',
  HIT_SHORTCUTS = 'hit_shortcuts',
  FORCE_DROPDOWN = 'force_dropdown',
  VIEWER_ORIENTATION = 'viewer_orientation',
  ETAG = 'etag',
  AXIOS_CACHE = 'axios.cache',
  LAST_SEEN = 'hit_last_seen',
  MOCK_SEARCH_QUERY_STORE = 'mock_search_query_store',
  MOCK_FAVOURITES_STORE = 'mock_favourite_store',
  COMPACT_JSON = 'compact_json_view',
  FLATTEN_JSON = 'flatten_json_view',
  LAST_VIEW = 'last_view',
  ONLY_RULES = 'only_rules',
  PAGE_COUNT = 'page_count'
}

export const MOCK_SEARCH_QUERY_STORE = `${MY_LOCAL_STORAGE_PREFIX}.${StorageKey.MOCK_SEARCH_QUERY_STORE}`;
export const MOCK_FAVOURITES_STORE = `${MY_LOCAL_STORAGE_PREFIX}.${StorageKey.MOCK_FAVOURITES_STORE}`;

export const VALID_ACTION_TRIGGERS = ['create', 'promote', 'demote'];

const CURRENT_TIME = moment();

export const minutes = [CURRENT_TIME.get('minute'), CURRENT_TIME.add(30, 'minute').get('minute')].sort();
export const hours = [
  CURRENT_TIME.get('hour'),
  CURRENT_TIME.add(3, 'hour').get('hour'),
  CURRENT_TIME.add(6, 'hour').get('hour'),
  CURRENT_TIME.add(9, 'hour').get('hour'),
  CURRENT_TIME.add(12, 'hour').get('hour'),
  CURRENT_TIME.add(15, 'hour').get('hour'),
  CURRENT_TIME.add(18, 'hour').get('hour'),
  CURRENT_TIME.add(21, 'hour').get('hour')
].sort((a, b) => a - b);

/**
 * Precomputed crontabs for the intervals. This will introduce some natural load-balancing as jobs run at completely different minutes/hours.
 */
export const RULE_INTERVALS = [
  { key: 'rule.interval.thirty.minutes', crontab: `${minutes.join(',')} * * * *` },
  { key: 'rule.interval.one.hour', crontab: `${CURRENT_TIME.get('minute')} * * * *` },
  { key: 'rule.interval.three.hours', crontab: `${CURRENT_TIME.get('minute')} ${hours.join(',')} * * *` },
  {
    key: 'rule.interval.six.hours',
    crontab: `${CURRENT_TIME.get('minute')} ${hours
      .filter((_, index) => index % 2 === hours.indexOf(CURRENT_TIME.get('hour')) % 2)
      .join(',')} * * *`
  },
  { key: 'rule.interval.one.day', crontab: `${CURRENT_TIME.get('minute')} ${CURRENT_TIME.get('hour')} * * *` }
];
