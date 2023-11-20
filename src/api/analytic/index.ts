import { hget, hput, joinAllUri, joinUri, uri as parentUri } from 'api';
import * as comments from 'api/analytic/comments';
import { Analytic } from 'models/entities/generated/Analytic';

export function uri(id?: string) {
  return id ? joinAllUri(parentUri(), 'analytic', id) : joinUri(parentUri(), 'analytic');
}

export function get(id?: string) {
  return id ? hget<Analytic>(uri(id)) : hget<Analytic[]>(uri());
}

export function put(id: string, description: string): Promise<Analytic> {
  return hput(uri(id), { description });
}

export { comments };
