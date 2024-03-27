import { hdelete, hpost, joinAllUri } from 'api';
import { uri as parentUri } from 'api/analytic';

export function uri(id: string) {
  return joinAllUri(parentUri(), id, 'favourite');
}

export function del(id: string): Promise<{ success: boolean }> {
  return hdelete(uri(id));
}

export function post(id: string): Promise<{ success: boolean }> {
  return hpost(uri(id), {});
}
