import { hget, joinUri } from 'api';
import { indexed, SearchField, uri as parentUri } from 'api/search/fields';

export function uri() {
  return joinUri(parentUri(), 'hit');
}

export async function get(): Promise<SearchField[]> {
  const response = await hget<{ [key: string]: SearchField }>(uri());
  return indexed(response);
}
