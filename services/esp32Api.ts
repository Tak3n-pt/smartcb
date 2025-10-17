// ESP32 API Service for Real-time Communication

import { ElectricalData } from '../types';

export class ESP32ApiService {
  private baseUrl: string;
  private pollingInterval: NodeJS.Timeout | null = null;
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  constructor(ipAddress: string = '192.168.4.1', port: string = '80') {
    this.baseUrl = `http://${ipAddress}:${port}`;
  }

  // Update base URL when IP changes
  updateConnection(ipAddress: string, port: string = '80') {
    this.baseUrl = `http://${ipAddress}:${port}`;
  }

  // Test connection to ESP32
  async testConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${this.baseUrl}/api/info`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Get current electrical status
  async getStatus(): Promise<ElectricalData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();

      // Map API response to ElectricalData type
      return {
        voltage: data.voltage || 0,
        current: data.current || 0,
        power: data.power || 0,
        energy: data.energy || 0,
        frequency: data.frequency || 0,
        powerFactor: data.powerFactor || 0,
        apparentPower: data.apparentPower || 0,
        reactivePower: data.reactivePower || 0,
        relayState: data.relayState || false,
        timestamp: Date.now(), // ALWAYS use app timestamp, ESP32 uses millis() not unix time
        // ESP32 status fields (BUG-001 fix)
        protectionTriggered: data.protectionTriggered || false,
        protectionReason: data.protectionReason || '',
        manualMode: data.manualMode || false,
        powerOutage: data.powerOutage || false,
        reconnectionPending: data.reconnectionPending || false,
      };
    } catch (error) {
      console.error('Error fetching status:', error);
      return null;
    }
  }

  // Control relay (circuit breaker)
  async setRelayState(state: boolean): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/relay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state }),
      });

      if (!response.ok) {
        throw new Error('Failed to control relay');
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Error controlling relay:', error);
      return false;
    }
  }

  // Get device settings
  async getSettings(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  }

  // Update device settings (ENHANCED with advanced thresholds)
  async updateSettings(settings: {
    maxCurrent?: number;
    maxVoltage?: number;
    minVoltage?: number;
    protectionEnabled?: boolean;
    // Advanced thresholds
    maxFrequency?: number;
    minFrequency?: number;
    minPowerFactor?: number;
    // BUG-002 fix: Add missing protection flags and autoResetDelay
    voltageProtection?: boolean;
    frequencyProtection?: boolean;
    powerFactorProtection?: boolean;
    autoResetDelay?: number;  // Reconnection delay in seconds
    autoReconnectEnabled?: boolean;  // BUG-008 fix: Enable/disable auto-reconnect
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }

  // Get device information
  async getDeviceInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch device info');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching device info:', error);
      return null;
    }
  }

  // Get schedules (NEW)
  async getSchedules(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/schedules`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching schedules:', error);
      return null;
    }
  }

  // Update schedules (NEW)
  async updateSchedules(schedules: {
    schedules: Array<{
      id: number;
      enabled: boolean;
      onTime: string;
      offTime: string;
      days: number[];
    }>;
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedules),
      });

      if (!response.ok) {
        throw new Error('Failed to update schedules');
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Error updating schedules:', error);
      return false;
    }
  }

  // Get current time from ESP32 (NEW)
  async getTime(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/time`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch time');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching time:', error);
      return null;
    }
  }

  // Set current time on ESP32 (NEW)
  async setTime(time: {
    hour: number;
    minute: number;
    day: number;
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(time),
      });

      if (!response.ok) {
        throw new Error('Failed to set time');
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Error setting time:', error);
      return false;
    }
  }

  // Start polling for real-time updates
  startPolling(callback: (data: ElectricalData | null) => void, interval: number = 1000) {
    if (this.pollingInterval) {
      this.stopPolling();
    }

    // Initial fetch
    this.getStatus().then(callback);

    // Set up polling
    this.pollingInterval = setInterval(async () => {
      const data = await this.getStatus();
      callback(data);
    }, interval);
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Start connection monitoring
  startConnectionMonitoring(
    onConnected: () => void,
    onDisconnected: () => void,
    interval: number = 5000
  ) {
    if (this.connectionCheckInterval) {
      this.stopConnectionMonitoring();
    }

    this.connectionCheckInterval = setInterval(async () => {
      const isConnected = await this.testConnection();
      if (isConnected) {
        onConnected();
      } else {
        onDisconnected();
      }
    }, interval);
  }

  // Stop connection monitoring
  stopConnectionMonitoring() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  // Clean up all intervals
  cleanup() {
    this.stopPolling();
    this.stopConnectionMonitoring();
  }
}

// Singleton instance
let esp32ApiInstance: ESP32ApiService | null = null;

export const getESP32Api = (ipAddress?: string, port?: string): ESP32ApiService => {
  if (!esp32ApiInstance) {
    esp32ApiInstance = new ESP32ApiService(ipAddress, port);
  } else if (ipAddress && port) {
    esp32ApiInstance.updateConnection(ipAddress, port);
  }
  return esp32ApiInstance;
};

// Export default instance
export default ESP32ApiService;