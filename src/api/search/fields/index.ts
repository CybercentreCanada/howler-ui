import { uri as parentUri } from 'api/search';
import * as hit from 'api/search/fields/hit';
import * as user from 'api/search/fields/user';
// import urlJoin from 'url-join';
import { joinUri } from 'api';

export type SearchField = {
  key?: string;
  default: boolean;
  indexed: boolean;
  list: boolean;
  stored: boolean;
  type: string;
  description?: string;
};

export function uri() {
  return joinUri(parentUri(), 'fields');
}

export function map(fields: { [key: string]: SearchField }): SearchField[] {
  return Object.keys(fields).map(key => ({ ...fields[key], key }));
}

export function indexed(fields: { [key: string]: SearchField }): SearchField[] {
  return map(fields).filter(field => field.indexed);
}

export { hit, user };
