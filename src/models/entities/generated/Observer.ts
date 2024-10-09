import type { Egress } from './Egress';
import type { Ingress } from './Ingress';

/**
 * NOTE: This is an auto-generated file. Don't edit this manually.
 */
export interface Observer {
  egress?: Egress;
  host_name?: string;
  ingress?: Ingress;
  ip?: string[];
  mac?: string[];
  name?: string;
  product?: string;
  serial_number?: string;
  type?: string;
  vendor?: string;
  version?: string;
}
