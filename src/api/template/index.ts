import { hdelete, hget, hpost, hput, joinAllUri, joinUri, uri as parentUri } from 'api';
import type { Template } from 'models/entities/generated/Template';

export function uri(id?: string) {
  return id ? joinAllUri(parentUri(), 'template', id) : joinUri(parentUri(), 'template');
}

export function get(): Promise<Template[]> {
  return hget(uri());
}

export function post(newData: Partial<Template>): Promise<Template> {
  return hpost(uri(), newData);
}

export function put(id: string, newFields: string[]): Promise<Template> {
  return hput(uri(id), newFields);
}

export function del(id: string): Promise<void> {
  return hdelete(uri(id));
}
