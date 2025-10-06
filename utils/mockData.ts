// Mock Data Generators for SmartCB

import { ElectricalData, Event, EventType, Settings } from '../types';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../i18n';

type IoniconName = keyof typeof Ionicons.glyphMap;

const EVENT_DESCRIPTION_MAP: Record<EventType, string> = {
  manual_on: 'events.eventsList.types.manualOn',
  manual_off: 'events.eventsList.types.manualOff',
  auto_on: 'events.eventsList.types.autoOn',
  auto_off: 'events.eventsList.types.autoOff',
  outage: 'events.eventsList.types.outage',
  restore: 'events.eventsList.types.restore',
  threshold_breach: 'events.eventsList.types.thresholdBreach',
  overvoltage: 'events.eventsList.types.overvoltage',
  undervoltage: 'events.eventsList.types.undervoltage',
  overcurrent: 'events.eventsList.types.overcurrent',
  overload: 'events.eventsList.types.overload',
  underload: 'events.eventsList.types.underload',
  frequency_min: 'events.eventsList.types.frequencyMin',
  frequency_max: 'events.eventsList.types.frequencyMax',
  power_factor_min: 'events.eventsList.types.powerFactorMin',
};

const MOCK_EVENT_TYPES: EventType[] = [
  'manual_on',
  'manual_off',
  'auto_on',
  'auto_off',
  'outage',
  'restore',
  'threshold_breach',
  'overvoltage',
  'undervoltage',
  'overcurrent',
  'overload',
];

/**
 * Generate realistic mock electrical data
 */
export const generateMockElectricalData = (relayState: boolean = true): ElectricalData => {
  // Voltage: 210-230V (normal range with some fluctuation)
  const voltage = 220 + (Math.random() - 0.5) * 10;

  // Current: varies with relay state
  const current = relayState ? 1.2 + Math.random() * 0.8 : 0;

  // Power factor: 0.92-0.99
  const powerFactor = 0.92 + Math.random() * 0.07;

  // Calculate power (W = V * A * PF)
  const power = voltage * current * powerFactor;

  // Apparent power (VA = V * A)
  const apparentPower = voltage * current;

  // Reactive power (VAR = sqrt(VAÂ² - WÂ²))
  const reactivePower = Math.sqrt(Math.pow(apparentPower, 2) - Math.pow(power, 2));

  // Frequency: 50Hz with small fluctuation
  const frequency = 50.0 + (Math.random() - 0.5) * 0.2;

  // Energy: incrementing (this should be managed by store)
  const energy = 12.45;

  return {
    voltage: Math.round(voltage * 10) / 10,
    current: Math.round(current * 100) / 100,
    power: Math.round(power * 10) / 10,
    energy,
    frequency: Math.round(frequency * 10) / 10,
    powerFactor: Math.round(powerFactor * 100) / 100,
    apparentPower: Math.round(apparentPower * 10) / 10,
    reactivePower: Math.round(reactivePower * 10) / 10,
    relayState,
    timestamp: Date.now(),
  };
};

/**
 * Generate default settings
 */
export const generateDefaultSettings = (): Settings => {
  return {
    thresholds: {
      voltage: {
        min: 200,
        max: 240,
        action: 'alert',
      },
      current: {
        max: 16,
        enabled: true,
        delay: 2,
      },
      energy: {
        max: 100,  // 100 kWh monthly limit
        enabled: true,
        resetDaily: false,
      },
      frequency: {
        min: 49.5,  // 49.5 Hz minimum
        max: 50.5,  // 50.5 Hz maximum
        enabled: true,
      },
      powerFactor: {
        min: 0.85,  // 0.85 minimum power factor
        enabled: true,
      },
    },
    reconnection: {
      delay: 30,
      maxAttempts: 3,
      enabled: true,
    },
    notifications: {
      powerOutage: true,
      powerRestore: true,
      thresholdBreach: true,
      frequencyAlerts: true,
      powerFactorAlerts: true,
      deviceOffline: true,
      sound: true,
      vibration: true,
    },
    schedule: {
      enabled: false,
      schedules: [
        {
          id: '1',
          onTime: '08:00',
          offTime: '22:00',
          days: [1, 2, 3, 4, 5], // Monday to Friday
          enabled: true,
        }
      ],
    },
    wifi: {
      ssid: 'SmartCB-Network',
      signalStrength: 85,
    },
    device: {
      name: 'SmartCB-001',
      firmwareVersion: '1.0.0',
    },
  };
};

/**
 * Generate mock events
 */
export const generateMockEvents = (count: number = 20): Event[] => {
  const events: Event[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const type = MOCK_EVENT_TYPES[Math.floor(Math.random() * MOCK_EVENT_TYPES.length)];
    const timestamp = now - i * 3_600_000 - Math.random() * 3_600_000;

    let duration: number | undefined;
    if (type === 'outage') {
      duration = Math.floor(Math.random() * 1_800_000) + 300_000;
    }

    const descriptionKey = EVENT_DESCRIPTION_MAP[type];
    const description = i18n.t(descriptionKey);

    events.push({
      id: `event-${i}-${timestamp}`,
      type,
      timestamp,
      description,
      readings: generateMockElectricalData(type !== 'outage'),
      duration,
    });
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Get event icon name based on type
 * Returns proper Ionicons name type
 */
export const getEventIcon = (type: EventType): IoniconName => {
  switch (type) {
    case 'manual_on':
      return 'power';
    case 'manual_off':
      return 'power-outline';
    case 'auto_on':
      return 'flash';
    case 'auto_off':
      return 'flash-off';
    case 'outage':
      return 'warning-outline';
    case 'restore':
      return 'checkmark-circle-outline';
    case 'threshold_breach':
      return 'analytics-outline';
    case 'overvoltage':
      return 'arrow-up-circle-outline';
    case 'undervoltage':
      return 'arrow-down-circle-outline';
    case 'overcurrent':
      return 'speedometer-outline';
    case 'overload':
      return 'warning';
    default:
      return 'information-circle-outline';
  }
};

/**
 * Get event color based on type
 */
export const getEventColor = (type: EventType): string => {
  switch (type) {
    case 'manual_on':
    case 'manual_off':
      return '#42A5F5'; // Blue
    case 'auto_on':
    case 'restore':
      return '#66BB6A'; // Green
    case 'auto_off':
      return '#FFA726'; // Orange
    case 'outage':
    case 'overvoltage':
    case 'overcurrent':
    case 'overload':
      return '#EF5350'; // Red - Critical safety events
    case 'undervoltage':
      return '#FFA726'; // Orange - Warning
    case 'threshold_breach':
      return '#FFA726'; // Orange
    default:
      return '#42A5F5'; // Blue
  }
};



