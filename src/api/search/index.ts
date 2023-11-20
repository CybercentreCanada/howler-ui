import { joinUri, uri as parentUri } from 'api';
import * as action from 'api/search/action';
import * as analytic from 'api/search/analytic';
import * as facet from 'api/search/facet';
import * as fields from 'api/search/fields';
import * as grouped from 'api/search/grouped';
import * as histogram from 'api/search/histogram';
import * as hit from 'api/search/hit';
import * as template from 'api/search/template';
import * as user from 'api/search/user';
import * as view from 'api/search/view';

export function uri() {
  return joinUri(parentUri(), 'search');
}

export type HowlerSearchRequest = {
  query: string;
  rows?: number;
  offset?: number;
  sort?: string;
  track_total_hits?: boolean;
  fl?: string;
  timeout?: number;
  filters?: string[];
};

export type HowlerSearchResponse<T> = {
  items: T[];
  offset: number;
  rows: number;
  total: number;
};

export { fields, hit, view, user, grouped, histogram, analytic, action, facet, template };
