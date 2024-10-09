import { hdelete, hget, hpost, hput, joinAllUri, joinUri, uri as parentUri } from 'api';
import type { Overview } from 'models/entities/generated/Overview';

export function uri(id?: string) {
  return id ? joinAllUri(parentUri(), 'overview', id) : joinUri(parentUri(), 'overview');
}

export function get(): Promise<Overview[]> {
  return hget(uri());
}

export function post(newData: Partial<Overview>): Promise<Overview> {
  return hpost(uri(), newData);
}

export function put(id: string, content: string): Promise<Overview> {
  return hput(uri(id), { content });
}

export function del(id: string): Promise<void> {
  return hdelete(uri(id));
}
