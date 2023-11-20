import { hdelete, hput, joinAllUri } from 'api';
import { HitActionResponse, LabelActionBody, uri as parentUri } from 'api/hit';

export function uri(id: string, category: string) {
  return joinAllUri(parentUri(), id, 'labels', category);
}

export function put(id: string, category: string, body: LabelActionBody): Promise<HitActionResponse> {
  return hput(uri(id, category), body);
}

export function del(id: string, category: string, body: LabelActionBody): Promise<HitActionResponse> {
  return hdelete(uri(id, category), body);
}
