import { hpost, joinAllUri, joinUri } from 'api';
import { uri as parentUri } from 'api/action';
import { ActionReport, ActionRequest } from 'models/ActionTypes';

export function uri(id?: string) {
  return id ? joinAllUri(parentUri(), id, 'execute') : joinUri(parentUri(), 'execute');
}

export function post(data: ActionRequest): Promise<ActionReport> {
  if (data.action_id) {
    return hpost(uri(data.action_id), { request_id: data.request_id, query: data.query });
  } else {
    return hpost(uri(), {
      request_id: data.request_id,
      query: data.query,
      operations: data.operations
    });
  }
}
