import { hdelete, hpatch, hpost, hput, joinAllUri, joinUri, uri as parentUri } from 'api';
import * as execute from 'api/action/execute';
import * as operations from 'api/action/operations';
import { action } from 'api/search';
import { Action } from 'models/entities/generated/Action';

export function uri(id?: string) {
  return id ? joinAllUri(parentUri(), 'action', id) : joinUri(parentUri(), 'action');
}

export function get(id: string): Promise<Action> {
  return action
    .post({
      query: `action_id:${id}`,
      rows: 1
    })
    .then(res => res.items[0])
    .then(_action => ({
      ..._action,
      // TODO: Fix this once operations have been all migrated
      operations: _action.operations.map(operation => ({
        ...operation,
        data: operation.data_json ? JSON.parse(operation.data_json) : operation.data
      }))
    }));
}

export function post(data: Action): Promise<Action> {
  return hpost(uri(), {
    ...data,
    operations: data.operations.map(operation => ({
      ...operation,
      data_json: operation.data_json ? operation.data_json : JSON.stringify(operation.data)
    }))
  });
}

export function put(id: string, data: Action): Promise<Action> {
  return hput(uri(id), {
    ...data,
    operations: data.operations.map(operation => ({
      ...operation,
      data_json: operation.data_json ? operation.data_json : JSON.stringify(operation.data)
    }))
  });
}

export function patch(id: string, data: Action): Promise<Action> {
  if (data.operations) {
    data.operations = data.operations.map(operation => ({
      ...operation,
      data_json: operation.data_json ? operation.data_json : JSON.stringify(operation.data)
    }));
  }

  return hpatch(uri(id), data);
}

export function del(id: string): Promise<void> {
  return hdelete(uri(id));
}

export { operations, execute };
