import { AnalyticComment } from './AnalyticComment';

/**
 * NOTE: This is an auto-generated file. Don't edit this manually.
 */
export interface Analytic {
  analytic_id?: string;
  comment?: AnalyticComment[];
  contributors?: string[];
  correlation?: string;
  correlation_type?: 'lucene' | 'eql' | 'sigma';
  correlation_crontab?: string;
  description?: string;
  detections?: string[];
  name?: string;
  owner?: string;
}
