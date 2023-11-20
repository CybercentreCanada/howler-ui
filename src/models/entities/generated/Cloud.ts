import { CloudAccount } from './CloudAccount';
import { Instance } from './Instance';
import { Machine } from './Machine';
import { Project } from './Project';
import { Service } from './Service';

/**
 * NOTE: This is an auto-generated file. Don't edit this manually.
 */
export interface Cloud {
  account?: CloudAccount;
  availability_zone?: string;
  instance?: Instance;
  machine?: Machine;
  project?: Project;
  provider?: string;
  region?: string;
  service?: Service;
  tenant_id?: string;
}
