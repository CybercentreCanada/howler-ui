import { hpost, joinUri } from 'api';
import { HowlerSearchRequest, HowlerSearchResponse, uri as parentUri } from 'api/search';
import { Hit } from 'models/entities/generated/Hit';

import * as eql from 'api/search/eql/hit';
import * as sigma from 'api/search/sigma/hit';

export function uri() {
  return joinUri(parentUri(), 'hit');
}

export function post(request?: HowlerSearchRequest): Promise<HowlerSearchResponse<Hit>> {
  return hpost(uri(), { ...(request || {}), query: request?.query || 'howler.id:*' });
}

export { eql, sigma };
