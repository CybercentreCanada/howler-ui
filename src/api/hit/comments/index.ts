import { hdelete, hget, hpost, hput, joinAllUri, joinUri } from 'api';
import { uri as parentUri } from 'api/hit';
import type { Comment } from 'models/entities/generated/Comment';
import type { Hit } from 'models/entities/generated/Hit';
import * as react from './react';

export function uri(hit: string, comment?: string) {
  return comment ? joinAllUri(parentUri(hit), 'comments', comment) : joinUri(parentUri(hit), 'comments');
}

export function get(hit: string, comment: string): Promise<Comment> {
  return hget(uri(hit, comment));
}

export function put(hit: string, comment: string, value: string): Promise<{ success: boolean }> {
  return hput(uri(hit, comment), { value });
}

export function post(hit: string, value: string): Promise<Hit> {
  return hpost(uri(hit), { value });
}

export function del(hit: string, comments: string[]): Promise<{ success: boolean }> {
  return hdelete(uri(hit), comments);
}

export { react };
