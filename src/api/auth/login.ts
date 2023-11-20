import { hget, hpost, joinUri } from 'api';
import { uri as parentUri } from 'api/auth';

export type PostLoginBody = {
  user?: string;
  password?: string;
  refresh_token?: string;
  provider?: string;
};

export type LoginResponse = {
  app_token?: string;
  refresh_token?: string;
  provider?: string;
};

export function uri(searchParams?: URLSearchParams) {
  return joinUri(parentUri(), 'login', searchParams);
}

export function post(body: PostLoginBody): Promise<LoginResponse> {
  return hpost(uri(), body);
}

export function get(search: URLSearchParams): Promise<LoginResponse> {
  return hget(uri(), search);
}
