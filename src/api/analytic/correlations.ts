import { hpost, joinUri } from 'api';
import { uri as parentUri } from 'api/analytic';
import { Analytic } from 'models/entities/generated/Analytic';

export function uri() {
  return joinUri(parentUri(), 'correlations');
}

export function post(
  body: Pick<Analytic, 'description' | 'name' | 'correlation' | 'correlation_type' | 'correlation_crontab'>
): Promise<Analytic> {
  return hpost(uri(), body);
}
