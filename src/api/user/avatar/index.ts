import { hget, joinUri } from 'api';
import { uri as parentUri } from 'api/user';

export function uri(username: string) {
  return joinUri(joinUri(parentUri(), 'avatar'), username);
}

export function get(username: string): Promise<string> {
  return hget(uri(username));
}
