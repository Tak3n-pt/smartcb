// Mock Data Generators for SmartCB

import { ElectricalData, Event, EventType, Settings } from '../types';

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

  // Reactive power (VAR = sqrt(VA² - W²))
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
      deviceOffline: true,
      sound: true,
      vibration: true,
    },
    schedule: {
      enabled: false,
      onTime: '08:00',
      offTime: '22:00',
      days: [1, 2, 3, 4, 5], // Monday to Friday
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
  const eventTypes: EventType[] = [
    'manual_on',
    'manual_off',
    'auto_on',
    'auto_off',
    'outage',
    'restore',
    'threshold_breach',
  ];

  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const timestamp = now - i * 3600000 - Math.random() * 3600000; // Spread over last N hours

    let description = '';
    let duration: number | undefined;

    switch (type) {
      case 'manual_on':
        description = 'Circuit breaker turned ON manually';
        break;
      case 'manual_off':
        description = 'Circuit breaker turned OFF manually';
        break;
      case 'auto_on':
        description = 'Circuit breaker automatically turned ON';
        break;
      case 'auto_off':
        description = 'Circuit breaker automatically turned OFF';
        break;
      case 'outage':
        description = 'Power outage detected';
        duration = Math.floor(Math.random() * 1800000) + 300000; // 5-35 minutes
        break;
      case 'restore':
        description = 'Power restored';
        break;
      case 'threshold_breach':
        description = 'Voltage threshold exceeded';
        break;
    }

    events.push({
      id: `event-${i}-${timestamp}`,
      type,
      timestamp,
      description,
      readings: generateMockElectricalData(type !== 'outage'),
      duration,
    });
  }

  // Sort by timestamp (newest first)
  return events.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Get event icon name based on type
 * Returns proper Ionicons name type
 */
export const getEventIcon = (type: EventType):
  'power' | 'power-off' | 'auto-fix' | 'alert-circle' | 'check-circle' | 'alert' | 'information' => {
  switch (type) {
    case 'manual_on':
      return 'power';
    case 'manual_off':
      return 'power-off';
    case 'auto_on':
      return 'auto-fix';
    case 'auto_off':
      return 'auto-fix';
    case 'outage':
      return 'alert-circle';
    case 'restore':
      return 'check-circle';
    case 'threshold_breach':
      return 'alert';
    default:
      return 'information';
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
      return '#EF5350'; // Red
    case 'threshold_breach':
      return '#FFA726'; // Orange
    default:
      return '#42A5F5'; // Blue
  }
};