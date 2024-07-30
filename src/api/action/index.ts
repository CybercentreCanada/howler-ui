import { hdelete, hpatch, hpost, hput, joinAllUri, joinUri, uri as parentUri } from 'api';
import * as execute from 'api/action/execute';
import * as operations from 'api/action/operations';
import { action } from 'api/search';
import type { Action } from 'models/entities/generated/Action';

export function uri(id?: string) {
  return id ? joinAllUri(parentUri(), 'action', id) : joinUri(parentUri(), 'action');
}

export function get(id: string): Promise<Action> {
  return action
    .post({
      query: `action_id:${id}`,
      rows: 1
    })
    .then(res => res.items[0]);
}

export function post(data: Action): Promise<Action> {
  return hpost(uri(), data);
}

export function put(id: string, data: Action): Promise<Action> {
  return hput(uri(id), data);
}

export function patch(id: string, data: Action): Promise<Action> {
  return hpatch(uri(id), data);
}

export function del(id: string): Promise<void> {
  return hdelete(uri(id));
}

export { execute, operations };
