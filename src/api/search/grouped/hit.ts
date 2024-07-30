import { hpost, joinAllUri } from 'api';
import type { HowlerGroupedSearchRequest, HowlerGroupedSearchResponse } from 'api/search/grouped';
import { uri as parentUri } from 'api/search/grouped';
import type { Hit } from 'models/entities/generated/Hit';

export function uri(field: string) {
  return joinAllUri(parentUri(), 'hit', field);
}

export function post(field: string, request?: HowlerGroupedSearchRequest): Promise<HowlerGroupedSearchResponse<Hit>> {
  return hpost(uri(field), { ...(request || {}), query: request?.query || 'howler.id:*' });
}
