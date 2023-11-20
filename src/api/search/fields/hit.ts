import { hget } from 'api';
import { indexed, SearchField, uri as parentUri } from 'api/search/fields';
import urlJoin from 'url-join';

export function uri() {
  return urlJoin(parentUri(), 'hit');
}

export async function get(): Promise<SearchField[]> {
  const response = await hget<{ [key: string]: SearchField }>(uri());
  return indexed(response);
}
