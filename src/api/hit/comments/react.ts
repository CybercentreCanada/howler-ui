import { hdelete, hput, joinUri } from 'api';
import { uri as parentUri } from 'api/hit/comments';

export function uri(hit: string, comment: string) {
  return joinUri(parentUri(hit, comment), 'react');
}

export function put(hit: string, comment: string, type: string): Promise<boolean> {
  return hput(uri(hit, comment), { type });
}

export function del(hit: string, comment: string): Promise<boolean> {
  return hdelete(uri(hit, comment));
}
