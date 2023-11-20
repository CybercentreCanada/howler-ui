import { hpost, joinUri } from 'api';
import { HowlerSearchRequest, HowlerSearchResponse, uri as parentUri } from 'api/search';
import { Analytic } from 'models/entities/generated/Analytic';

export function uri() {
  return joinUri(parentUri(), 'analytic');
}

export function post(request?: HowlerSearchRequest): Promise<HowlerSearchResponse<Analytic>> {
  return hpost(uri(), { ...(request || {}), query: request?.query || 'analytic_id:*' });
}
