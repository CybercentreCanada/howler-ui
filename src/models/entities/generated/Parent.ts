import { Bcc } from './Bcc';
import { Cc } from './Cc';
import { From } from './From';
import { To } from './To';

/**
 * NOTE: This is an auto-generated file. Don't edit this manually.
 */
export interface Parent {
  bcc?: Bcc;
  cc?: Cc;
  destination?: string;
  from?: From;
  message_id?: string;
  origination_timestamp?: string;
  source?: string;
  subject?: string;
  to?: To;
}
