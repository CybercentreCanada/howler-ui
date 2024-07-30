import { hpost, joinAllUri } from 'api';
import type { HowlerEQLSearchRequest, HowlerEQLSearchResponse } from 'api/search';
import { uri as parentUri } from 'api/search';
import type { Hit } from 'models/entities/generated/Hit';

export function uri() {
  return joinAllUri(parentUri(), 'hit', 'eql');
}

export function post(request?: HowlerEQLSearchRequest): Promise<HowlerEQLSearchResponse<Hit>> {
  return hpost(uri(), { ...(request || {}), eql_query: request?.eql_query || 'any where true' });
}
