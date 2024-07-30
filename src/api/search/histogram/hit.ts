import { hpost, joinAllUri } from 'api';
import type { HowlerHistogramSearchRequest, HowlerHistogramSearchResponse } from 'api/search/histogram';
import { uri as parentUri } from 'api/search/histogram';

export function uri(field: string) {
  return joinAllUri(parentUri(), 'hit', field);
}

export function post(field: string, request?: HowlerHistogramSearchRequest): Promise<HowlerHistogramSearchResponse> {
  return hpost(uri(field), { ...(request || {}), query: request?.query || 'howler.id:*' });
}
