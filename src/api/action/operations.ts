import { hget, joinUri } from 'api';
import { uri as parentUri } from 'api/action';
import { ActionOperation } from 'models/ActionTypes';

export function uri() {
  return joinUri(parentUri(), 'operations');
}

export function get(): Promise<ActionOperation[]> {
  return hget(uri());
}
