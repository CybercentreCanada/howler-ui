import type { Geo } from './Geo';
import type { Nat } from './Nat';

/**
 * NOTE: This is an auto-generated file. Don't edit this manually.
 */
export interface Source {
  address?: string;
  bytes?: number;
  domain?: string;
  geo?: Geo;
  ip?: string;
  mac?: string;
  nat?: Nat;
  packets?: number;
  port?: number;
}
