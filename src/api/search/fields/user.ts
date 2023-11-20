import * as api from 'api';
import { indexed, SearchField, uri as parentUri } from 'api/search/fields';
import urlJoin from 'url-join';

export function uri() {
  return urlJoin(parentUri(), 'user');
}

export async function get(): Promise<SearchField[]> {
  const response = await api.hget<{ [key: string]: SearchField }>(uri());
  return indexed(response);
}
