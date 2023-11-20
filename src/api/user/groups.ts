import { hget, joinUri } from 'api';
import { uri as parentUri } from 'api/user';

export type GroupDetailsResponse = { id: string; name: string }[];

export function uri() {
  return joinUri(parentUri(), 'groups');
}

export function get(): Promise<GroupDetailsResponse> {
  return hget(uri());
}
