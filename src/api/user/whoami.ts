import { hget, joinUri } from 'api';
import { uri as parentUri } from 'api/user';
import type { HowlerUser } from 'models/entities/HowlerUser';

export function uri() {
  return joinUri(parentUri(), 'whoami');
}

export function get(): Promise<HowlerUser> {
  return hget(uri());
}
