import { Comment } from './Comment';
import { Labels } from './Labels';
import { Link } from './Link';
import { Log } from './Log';
import { Outline } from './Outline';
import { Votes } from './Votes';

/**
 * NOTE: This is an auto-generated file. Don't edit this manually.
 */
export interface Howler {
  analytic: string;
  assessment?: string;
  assignment: string;
  bundles?: string[];
  comment?: Comment[];
  confidence?: number;
  data?: string[];
  detection?: string;
  dossier?: { [index: string]: string };
  escalation?: string;
  hash: string;
  hits?: string[];
  id: string;
  is_bundle?: boolean;
  labels?: Labels;
  links?: Link[];
  log?: Log[];
  mitigated?: string;
  monitored?: string;
  outline?: Outline;
  rationale?: string;
  related?: string[];
  reliability?: number;
  reported?: string;
  retained?: string;
  score?: number;
  scrutiny?: string;
  severity?: number;
  status?: string;
  viewers?: string[];
  volume?: number;
  votes?: Votes;
}
