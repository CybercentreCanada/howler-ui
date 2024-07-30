import { hpost, joinAllUri } from 'api';
import type { HitTransitionBody } from 'api/hit';
import { uri as parentUri } from 'api/hit';
import type { Hit } from 'models/entities/generated/Hit';

export function uri(id: string) {
  return joinAllUri(parentUri(), id, 'transition');
}

export function post(id: string, body: HitTransitionBody): Promise<Hit> {
  return hpost(uri(id), body);
}
