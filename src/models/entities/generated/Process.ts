import { ProcessParent } from './ProcessParent';
import { User } from './User';

/**
 * NOTE: This is an auto-generated file. Don't edit this manually.
 */
export interface Process {
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
  parent?: ProcessParent[];
  pid?: number;
  same_as_process?: boolean;
  start?: string;
  title?: string;
  uptime?: number;
  user?: User;
  working_directory?: string;
}
