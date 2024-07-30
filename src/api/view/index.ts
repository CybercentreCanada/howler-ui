import { hdelete, hget, hpost, hput, joinAllUri, joinUri, uri as parentUri } from 'api';
import * as favourite from 'api/view/favourite';
import type { View } from 'models/entities/generated/View';

export function uri(id?: string) {
  return id ? joinAllUri(parentUri(), 'view', id) : joinUri(parentUri(), 'view');
}

export function get(): Promise<View[]> {
  return hget(uri());
}

export function post(newData: Partial<View>): Promise<View> {
  return hpost(uri(), newData);
}

export function put(id: string, title: string, query: string, sort: string, span: string): Promise<View> {
  return hput(uri(id), { title, query, sort, span });
}

export function del(id: string): Promise<void> {
  return hdelete(uri(id));
}

export { favourite };
