import { hput, joinAllUri } from 'api';
import type { HitActionBody, HitActionResponse } from 'api/hit';
import { uri as parentUri } from 'api/hit';

export function uri(id: string) {
  return joinAllUri(parentUri(), id, 'assign');
}

export function put(id: string, body: HitActionBody): Promise<HitActionResponse> {
  return hput(uri(id), body);
}
