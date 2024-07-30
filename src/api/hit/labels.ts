import { hdelete, hput, joinAllUri } from 'api';
import type { LabelActionBody } from 'api/hit';
import { uri as parentUri } from 'api/hit';
import type { Hit } from 'models/entities/generated/Hit';

export function uri(id: string, category: string) {
  return joinAllUri(parentUri(), id, 'labels', category);
}

export function put(id: string, category: string, body: LabelActionBody): Promise<Hit> {
  return hput(uri(id, category), body);
}

export function del(id: string, category: string, body: LabelActionBody): Promise<Hit> {
  return hdelete(uri(id, category), body);
}
