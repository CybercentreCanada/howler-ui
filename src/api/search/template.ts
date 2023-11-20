import { hpost, joinUri } from 'api';
import { HowlerSearchRequest, HowlerSearchResponse, uri as parentUri } from 'api/search';
import { Template } from 'models/entities/generated/Template';

export function uri() {
  return joinUri(parentUri(), 'template');
}

export function post(request?: HowlerSearchRequest): Promise<HowlerSearchResponse<Template>> {
  return hpost(uri(), { ...(request || {}), query: request?.query || 'template_id:*' });
}
