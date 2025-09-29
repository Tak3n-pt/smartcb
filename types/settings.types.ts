// Settings Types

export type ThresholdAction = 'alert' | 'cutoff';

export interface VoltageThreshold {
  min: number;
  max: number;
  action: ThresholdAction;
}

export interface CurrentThreshold {
  max: number;
  enabled: boolean;
  delay: number; // seconds
}

export interface EnergyThreshold {
  max: number;        // kWh
  enabled: boolean;
  resetDaily: boolean; // Reset counter daily
}

export interface FrequencyThreshold {
  min: number;        // Hz (typically 49.5)
  max: number;        // Hz (typically 50.5)
  enabled: boolean;
}

export interface PowerFactorThreshold {
  min: number;        // 0-1 (typically 0.85)
  enabled: boolean;
}

export interface Thresholds {
  voltage: VoltageThreshold;
  current: CurrentThreshold;
  energy: EnergyThreshold;
  frequency: FrequencyThreshold;
  powerFactor: PowerFactorThreshold;
}

export interface ReconnectionSettings {
  delay: number;        // seconds
  maxAttempts: number;
  enabled: boolean;
}

export interface NotificationSettings {
  powerOutage: boolean;
  powerRestore: boolean;
  thresholdBreach: boolean;
  deviceOffline: boolean;
  sound: boolean;
  vibration: boolean;
}

export interface ScheduleSettings {
  enabled: boolean;
  onTime: string;       // "HH:MM" format
  offTime: string;      // "HH:MM" format
  days: number[];       // [0-6] (Sunday=0)
  oneTime?: {
    date: string;       // ISO date string
    time: string;       // "HH:MM" format
    action: 'on' | 'off';
  };
}

export interface WiFiSettings {
  ssid: string;
  signalStrength: number; // 0-100
}

export interface DeviceSettings {
  name: string;
  firmwareVersion: string;
}

export interface Settings {
  thresholds: Thresholds;
  reconnection: ReconnectionSettings;
  notifications: NotificationSettings;
  schedule: ScheduleSettings;
  wifi: WiFiSettings;
  device: DeviceSettings;
}