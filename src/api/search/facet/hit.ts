import { hpost, joinAllUri } from 'api';
import { HowlerFacetSearchRequest, HowlerFacetSearchResponse, uri as parentUri } from 'api/search/facet';

export function uri(field: string) {
  return joinAllUri(parentUri(), 'hit', field);
}

export function post(field: string, request?: HowlerFacetSearchRequest): Promise<HowlerFacetSearchResponse> {
  return hpost(uri(field), { ...(request || {}), query: request?.query || 'howler.id:*' });
}
