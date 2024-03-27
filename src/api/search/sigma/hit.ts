import { hpost, joinAllUri } from 'api';
import { HowlerSearchResponse, HowlerSigmaSearchRequest, uri as parentUri } from 'api/search';
import { Hit } from 'models/entities/generated/Hit';

export function uri() {
  return joinAllUri(parentUri(), 'hit', 'sigma');
}

export function post(request?: HowlerSigmaSearchRequest): Promise<HowlerSearchResponse<Hit>> {
  return hpost(uri(), { ...(request || {}), sigma: request?.sigma || '' });
}
