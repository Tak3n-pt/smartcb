// Hook for managing ESP32 connection with initial sync

import { useState, useCallback, useEffect } from 'react';
import { useElectricalStore, useSettingsStore } from '../store';
import { getESP32Api } from '../services/esp32Api';

export const useESP32Connection = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<string[]>([]);

  const {
    connectToESP32,
    disconnectFromESP32,
    connection,
    esp32IP,
    setESP32Config
  } = useElectricalStore();

  // Sync settings and schedules from ESP32
  const syncWithESP32 = async (ip: string, port: string) => {
    try {
      const api = getESP32Api(ip, port);

      // Get current settings from ESP32
      const settings = await api.getSettings();
      const schedules = await api.getSchedules();

      // Update store with ESP32 values
      if (settings) {
        const { updateThresholds } = useSettingsStore.getState();

        updateThresholds({
          voltage: {
            min: settings.minVoltage || 180,
            max: settings.maxVoltage || 250
          },
          current: {
            max: settings.maxCurrent || 16,
            enabled: settings.protectionEnabled ?? true
          },
          frequency: {
            min: settings.minFrequency || 49.0,
            max: settings.maxFrequency || 51.0,
            enabled: settings.frequencyProtection ?? true
          },
          powerFactor: {
            min: settings.minPowerFactor || 0.85,
            enabled: settings.powerFactorProtection ?? true
          }
        });

        console.log('✅ Settings synced from ESP32');
      }

      if (schedules && schedules.schedules) {
        const { updateSchedule } = useSettingsStore.getState();

        updateSchedule({
          schedules: schedules.schedules
        });

        console.log('✅ Schedules synced from ESP32');
      }
    } catch (error) {
      console.error('❌ Failed to sync with ESP32:', error);
    }
  };

  // Sync current time to ESP32
  const syncTimeToESP32 = async (ip: string, port: string) => {
    try {
      const api = getESP32Api(ip, port);
      const now = new Date();

      const success = await api.setTime({
        hour: now.getHours(),
        minute: now.getMinutes(),
        day: now.getDay()
      });

      if (success) {
        console.log(`✅ Time synced to ESP32: ${now.getHours()}:${now.getMinutes()} Day ${now.getDay()}`);
      } else {
        console.error('❌ Failed to sync time to ESP32');
      }
    } catch (error) {
      console.error('❌ Error syncing time to ESP32:', error);
    }
  };

  // Auto-detect ESP32 devices on the network
  const scanForDevices = useCallback(async () => {
    setIsScanning(true);
    setDiscoveredDevices([]);

    // Common ESP32 IP addresses to check
    const possibleIPs = [
      '192.168.1.100',
      '192.168.0.100',
      '192.168.4.1',    // ESP32 Access Point default
      '192.168.1.10',
      '192.168.0.10',
      '10.0.0.100',
    ];

    // Get current network subnet (if available)
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      // This is the public IP, but we can use it to guess the local subnet

      // Try to detect local subnet (simplified approach)
      const localSubnet = '192.168.1'; // Most common

      // Add more IPs from the detected subnet
      for (let i = 1; i <= 254; i++) {
        if (i === 100 || i === 10 || i === 50) { // Common ESP32 IPs
          possibleIPs.push(`${localSubnet}.${i}`);
        }
      }
    } catch (error) {
      console.log('Could not detect network subnet');
    }

    const foundDevices: string[] = [];

    // Test each IP in parallel with timeout
    const testPromises = possibleIPs.map(async (ip) => {
      try {
        const api = getESP32Api(ip, '80');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout

        const response = await fetch(`http://${ip}/api/info`, {
          signal: controller.signal,
          method: 'GET',
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const info = await response.json();
          if (info.model && info.model.includes('ESP32')) {
            return ip;
          }
        }
      } catch (error) {
        // Silently fail for IPs that don't respond
      }
      return null;
    });

    const results = await Promise.all(testPromises);
    const validIPs = results.filter((ip): ip is string => ip !== null);

    setDiscoveredDevices(validIPs);
    setIsScanning(false);

    return validIPs;
  }, []);

  // Connect to specific IP with initial sync
  const connect = useCallback(async (ip: string, port: string = '80') => {
    setIsConnecting(true);

    try {
      // Update store with IP config
      setESP32Config(ip, port);

      // Attempt connection
      const success = await connectToESP32(ip, port);

      if (success) {
        console.log(`Successfully connected to ESP32 at ${ip}:${port}`);

        // Sync settings and schedules from ESP32
        await syncWithESP32(ip, port);

        // Sync current time to ESP32
        await syncTimeToESP32(ip, port);
      } else {
        console.error(`Failed to connect to ESP32 at ${ip}:${port}`);
      }

      setIsConnecting(false);
      return success;
    } catch (error) {
      console.error('Connection error:', error);
      setIsConnecting(false);
      return false;
    }
  }, [connectToESP32, setESP32Config]);

  // Disconnect from ESP32
  const disconnect = useCallback(() => {
    disconnectFromESP32();
  }, [disconnectFromESP32]);

  // Auto-scan on mount
  useEffect(() => {
    // Optional: Auto-scan when the hook is first used
    // scanForDevices();
  }, []);

  return {
    isScanning,
    isConnecting,
    isConnected: connection.isConnected,
    discoveredDevices,
    currentIP: esp32IP,
    scanForDevices,
    connect,
    disconnect,
  };
};