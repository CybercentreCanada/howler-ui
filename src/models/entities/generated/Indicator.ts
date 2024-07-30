import type { IndicatorEmail } from './IndicatorEmail';

/**
 * NOTE: This is an auto-generated file. Don't edit this manually.
 */
export interface Indicator {
  confidence?: string;
  description?: string;
  email?: IndicatorEmail;
  first_seen?: string;
  ip?: string;
  last_seen?: string;
  provider?: string;
  reference?: string;
  scanner_stats?: number;
  sightings?: number;
  type?: string;
}
