import { AnalyticComment } from './AnalyticComment';

/**
 * NOTE: This is an auto-generated file. Don't edit this manually.
 */
export interface Analytic {
  analytic_id?: string;
  comment?: AnalyticComment[];
  contributors?: string[];
  description?: string;
  detections?: string[];
  name?: string;
  owner?: string;
  rule?: string;
  rule_crontab?: string;
  rule_type?: string;
}
