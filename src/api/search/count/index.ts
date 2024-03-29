import { joinUri } from 'api';
import { uri as parentUri } from 'api/search';
import * as hit from 'api/search/count/hit';

export interface HowlerCountSearchRequest {
  query: string;
}

export interface HowlerCountResult {
  count: number;
}

export function uri() {
  return joinUri(parentUri(), 'count');
}

export { hit };
