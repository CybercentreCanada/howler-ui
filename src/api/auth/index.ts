import { joinUri, uri as parentUri } from 'api';
import * as apikey from 'api/auth/apikey';
import * as login from 'api/auth/login';

export function uri() {
  return joinUri(parentUri(), 'auth');
}

export { apikey, login };
