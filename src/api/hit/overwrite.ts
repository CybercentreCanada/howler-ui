import { hput, joinAllUri } from 'api';
import { uri as parentUri } from 'api/hit';
import type { Hit } from 'models/entities/generated/Hit';

export function uri(id: string) {
  return joinAllUri(parentUri(), id, 'overwrite');
}

export function put(id: string, body: Partial<Hit>): Promise<Hit> {
  return hput(uri(id), body);
}
