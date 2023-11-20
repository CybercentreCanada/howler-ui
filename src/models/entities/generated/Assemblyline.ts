import { Antivirus } from './Antivirus';
import { Attribution } from './Attribution';
import { Behaviour } from './Behaviour';
import { Domain } from './Domain';
import { Heuristic } from './Heuristic';
import { Mitre } from './Mitre';
import { Uri } from './Uri';
import { Yara } from './Yara';

/**
 * NOTE: This is an auto-generated file. Don't edit this manually.
 */
export interface Assemblyline {
  antivirus?: Antivirus[];
  attribution?: Attribution[];
  behaviour?: Behaviour[];
  domain?: Domain[];
  heuristic?: Heuristic[];
  mitre?: Mitre;
  uri?: Uri[];
  yara?: Yara[];
}
