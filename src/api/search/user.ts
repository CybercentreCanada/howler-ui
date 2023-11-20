import { hpost, joinUri } from 'api';
import { HowlerSearchRequest, HowlerSearchResponse, uri as parentUri } from 'api/search';
import { HowlerUser } from 'models/entities/HowlerUser';

export type HowlerApiUser = Omit<HowlerUser, 'username'> & { uname: string };

export function uri() {
  return joinUri(parentUri(), 'user');
}

export async function post(request?: HowlerSearchRequest): Promise<HowlerSearchResponse<HowlerUser>> {
  const response = await hpost<HowlerSearchResponse<HowlerApiUser>>(uri(), {
    ...(request || {}),
    query: request?.query || 'name:*'
  });
  return {
    ...response,
    items: response.items.map((i: HowlerApiUser) => ({ ...i, username: i.uname }))
  };
}
