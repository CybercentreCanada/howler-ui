import { hpost, joinAllUri } from 'api';
import { uri as parentUri } from 'api/analytic';
import type { Analytic } from 'models/entities/generated/Analytic';

export function uri(id: string) {
  return joinAllUri(parentUri(), id, 'owner');
}

export function post(id: string, body: { username: string }): Promise<Analytic> {
  return hpost(uri(id), body);
}
