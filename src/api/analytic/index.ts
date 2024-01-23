import { hget, hput, joinAllUri, joinUri, uri as parentUri } from 'api';
import * as comments from 'api/analytic/comments';
import * as correlations from 'api/analytic/correlations';
import { Analytic } from 'models/entities/generated/Analytic';

type EditOptions = Pick<Analytic, 'description' | 'correlation'>;

export function uri(id?: string) {
  return id ? joinAllUri(parentUri(), 'analytic', id) : joinUri(parentUri(), 'analytic');
}

export function get(id?: string) {
  return id ? hget<Analytic>(uri(id)) : hget<Analytic[]>(uri());
}

export function put(id: string, editData: EditOptions): Promise<Analytic> {
  return hput(uri(id), editData);
}

export { comments, correlations };
