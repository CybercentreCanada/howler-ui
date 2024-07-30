import type { User } from './User';

/**
 * NOTE: This is an auto-generated file. Don't edit this manually.
 */
export interface ProcessParent {
  args?: string[];
  args_count?: number;
  command_line?: string;
  end?: string;
  entity_id?: string;
  env_vars?: { [index: string]: string };
  executable?: string;
  exit_code?: number;
  interactive?: boolean;
  name?: string;
  pid?: number;
  same_as_process?: boolean;
  start?: string;
  user?: User;
}
