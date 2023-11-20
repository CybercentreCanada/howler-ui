import { hpost, joinUri } from 'api';
import { HowlerSearchRequest, HowlerSearchResponse, uri as parentUri } from 'api/search';
import { View } from 'models/entities/generated/View';

export function uri() {
  return joinUri(parentUri(), 'view');
}

export function post(request?: HowlerSearchRequest): Promise<HowlerSearchResponse<View>> {
  return hpost(uri(), { ...(request || {}), query: request?.query || 'title:*' });
}
