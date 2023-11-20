import { Attachment } from './Attachment';
import { Bcc } from './Bcc';
import { Cc } from './Cc';
import { From } from './From';
import { Parent } from './Parent';
import { ReplyTo } from './ReplyTo';
import { Sender } from './Sender';
import { To } from './To';

/**
 * NOTE: This is an auto-generated file. Don't edit this manually.
 */
export interface Email {
  attachments?: Attachment[];
  bcc?: Bcc;
  cc?: Cc;
  content_type?: string;
  delivery_timestamp?: string;
  direction?: string;
  from?: From;
  local_id?: string;
  message_id?: string;
  origination_timestamp?: string;
  parent?: Parent;
  reply_to?: ReplyTo;
  sender?: Sender;
  subject?: string;
  to?: To;
  x_mailer?: string;
}
