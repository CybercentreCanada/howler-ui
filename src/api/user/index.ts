import { hget, hput, joinUri, uri as parentUri } from 'api';
import * as avatar from 'api/user/avatar';
import * as groups from 'api/user/groups';
import * as whoami from 'api/user/whoami';
import { HowlerUser } from 'models/entities/HowlerUser';

export function uri(username?: string) {
  const _uri = joinUri(parentUri(), 'user');
  return username ? joinUri(_uri, username) : _uri;
}

export function get(username: string): Promise<HowlerUser> {
  return hget(uri(username));
}

export function put(username: string, newData: Partial<HowlerUser> | { new_pass: string }) {
  return hput(uri(username), newData);
}

export { whoami, avatar, groups };
