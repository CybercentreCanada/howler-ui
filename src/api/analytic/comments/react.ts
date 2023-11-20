import { hdelete, hput, joinUri } from 'api';
import { uri as parentUri } from 'api/analytic/comments';

export function uri(analytic: string, comment: string) {
  return joinUri(parentUri(analytic, comment), 'react');
}

export function put(analytic: string, comment: string, type: string): Promise<boolean> {
  return hput(uri(analytic, comment), { type });
}

export function del(analytic: string, comment: string): Promise<boolean> {
  return hdelete(uri(analytic, comment));
}
