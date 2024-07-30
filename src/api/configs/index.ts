import { hget, joinUri, uri as parentUri } from 'api';
import type { ApiType } from 'models/entities/generated/ApiType';

export function uri() {
  return joinUri(parentUri(), 'configs');
}

export function get(): Promise<ApiType> {
  return hget(uri());
}
