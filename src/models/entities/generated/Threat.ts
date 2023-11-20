import { Feed } from './Feed';
import { Indicator } from './Indicator';
import { Software } from './Software';
import { ThreatGroup } from './ThreatGroup';
import { ThreatTactic } from './ThreatTactic';
import { ThreatTechnique } from './ThreatTechnique';

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
