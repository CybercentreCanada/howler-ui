import { AnalyticComment } from './AnalyticComment';
import { Notebook } from './Notebook';

/**
 * NOTE: This is an auto-generated file. Don't edit this manually.
 */
export interface Analytic {
  analytic_id?: string;
  comment?: AnalyticComment[];
  description?: string;
  detections?: string[];
  name?: string;
  notebooks?: Notebook[];
}
