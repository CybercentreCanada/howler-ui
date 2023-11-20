import * as colors from '@mui/material/colors';
import { isNil, isPlainObject } from 'lodash';
import moment from 'moment-twitter';

export function bytesToSize(bytes: number | null) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0 || bytes === null) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
}

export function humanReadableNumber(num: number | null) {
  const sizes = ['', 'k', 'm', 'g', 't', 'p', 'e', 'z', 'y'];
  if (num === 0 || num === null) return '0 ';
  const i = Math.floor(Math.log(num) / Math.log(1000));
  return `${Math.round(num / Math.pow(1000, i))}${sizes[i]} `;
}

export function getProvider() {
  if (window.location.pathname.indexOf(`${process.env.PUBLIC_URL}/oauth/`) !== -1) {
    return window.location.pathname.split(`${process.env.PUBLIC_URL}/oauth/`).pop().slice(0, -1);
  }
  const params = new URLSearchParams(window.location.search);
  return params.get('provider');
}

export function searchResultsDisplay(count: number, max: number = 10000) {
  const params = new URLSearchParams(window.location.search);
  const trackedHits = params.get('track_total_hits');

  if (count === parseInt(trackedHits) || (trackedHits === null && count === max)) {
    return `${count}+`;
  }

  return `${count}`;
}



const DATE_FORMAT = 'YYYY/MM/DD HH:mm:ss';
export function formatDate(date: number | string | Date): string {
  if (!date) {
    return '?';
  }

  return moment(date).utc().format(DATE_FORMAT);
}

export function compareTimestamp(a: string, b: string): number {
  return (new Date(a).getTime() - new Date(b).getTime()) / 1000;
}

export function twitterShort(date: string | Date | number): string {
  if (!date || date === '?') {
    return '?';
  }

  return moment(date)
    .twitterShort()
    .replace(
      // Look for twitter dates in the format m/d/y (i.e. 4/12/21) and converts it to YYYY-MM-DD (i.e. 2021-04-12)
      /^(\d{1,2})\/(\d{1,2})\/(\d{1,2})/,
      // Revisit in 2100
      (_, p1: string, p2: string, p3: string) => `2${p3.padStart(3, '0')}-${p1.padStart(2, '0')}-${p2.padStart(2, '0')}`
    );
}

const hashCode = (s: string): number => s.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);

export function stringToColor(string: string) {
  const number = Math.abs(hashCode(string));
  const colorKeys = Object.keys(colors);

  const colorKey = colorKeys[number % colorKeys.length];
  const color = colors[colorKey] as { [shade: string]: string };

  const shade = Math.max(Math.floor((number / 1000) % 10), 1) * 100;

  return color[shade];
}



// Adapted from here: https://stackoverflow.com/a/48429492
export function delay(ms: number, rejectOnCancel = false) {
  let timerId: string | number | NodeJS.Timeout;
  let onCancel: () => void;

  class TimedPromise extends Promise<void> {
    cancel = () => {
      if (rejectOnCancel) {
        onCancel();
      }

      clearTimeout(timerId);
    };
  }

  return new TimedPromise((resolve, reject) => {
    timerId = setTimeout(resolve, ms);
    onCancel = reject;
  });
}

type Timestamp = {
  timestamp?: string;
};

export const sortByTimestamp = <T extends Timestamp>(arr: T[]) => {
  return (arr ?? []).slice().sort((a, b) => compareTimestamp(b.timestamp, a.timestamp));
};

export const getTimeRange = (arr: string[]): [string, string] => {
  const sorted = arr.sort((a, b) => compareTimestamp(a, b));

  return [sorted[0], sorted[sorted.length - 1]];
};

export const removeEmpty = (obj: any) => {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => !isNil(v))
      .map(([k, v]) => [k, isPlainObject(v) ? removeEmpty(v) : v])
  );
};

const DATE_TO_LUCENE_MAP = {
  day: 'd',
  week: 'w',
  month: 'M',
  year: 'y'
};

export const convertDateToLucene = (date: string) => {
  if (!date.startsWith('date.range.')) {
    return 'now-1d';
  }

  const [amount, type] = date.replace('date.range.', '').split('.');

  return `[now-${amount}${DATE_TO_LUCENE_MAP[type] ?? 'd'} TO now]`;
};

export const tryParse = (json: string) => {
  try {
    return JSON.parse(json);
  } catch (e) {
    return json;
  }
};
