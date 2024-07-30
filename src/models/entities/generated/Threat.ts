import type { Feed } from './Feed';
import type { Indicator } from './Indicator';
import type { Software } from './Software';
import type { ThreatGroup } from './ThreatGroup';
import type { ThreatTactic } from './ThreatTactic';
import type { ThreatTechnique } from './ThreatTechnique';

/**
 * NOTE: This is an auto-generated file. Don't edit this manually.
 */
export interface Threat {
  feed?: Feed;
  framework?: string;
  group?: ThreatGroup;
  indicator?: Indicator;
  software?: Software;
  tactic?: ThreatTactic;
  technique?: ThreatTechnique;
}
