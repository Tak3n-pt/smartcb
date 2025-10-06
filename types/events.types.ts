// Event Types

import { ElectricalData } from './electrical.types';

export type EventType =
  | 'manual_on'
  | 'manual_off'
  | 'auto_on'
  | 'auto_off'
  | 'outage'
  | 'restore'
  | 'threshold_breach'
  | 'overvoltage'
  | 'undervoltage'
  | 'overcurrent'
  | 'overload'
  | 'underload'
  | 'frequency_min'
  | 'frequency_max'
  | 'power_factor_min';

export interface Event {
  id: string;
  type: EventType;
  timestamp: number;
  description: string;
  readings?: ElectricalData;
  duration?: number;      // milliseconds (for outages)
}

export interface EventStatistics {
  totalEvents: number;
  totalOutages: number;
  averageOutageDuration: number; // milliseconds
  totalDowntime: number;         // milliseconds
}