import { joinUri } from 'api';
import { uri as parentUri } from 'api/search';
import * as hit from 'api/search/facet/hit';

export function uri() {
  return joinUri(parentUri(), 'facet');
}

export type HowlerFacetSearchRequest = {
  query?: string;
  mincount?: number;
  rows?: number;
  filters?: string[];
};

export type HowlerFacetSearchResponse = { [value: string]: number };

export { hit };
