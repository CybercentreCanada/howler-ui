import { hpost, joinAllUri } from 'api';
import { HowlerEQLSearchRequest, HowlerEQLSearchResponse, uri as parentUri } from 'api/search';
import { Hit } from 'models/entities/generated/Hit';

export function uri() {
  return joinAllUri(parentUri(), 'hit', 'eql');
}

export function post(request?: HowlerEQLSearchRequest): Promise<HowlerEQLSearchResponse<Hit>> {
  return hpost(uri(), { ...(request || {}), eql_query: request?.eql_query || 'any where true' });
}
