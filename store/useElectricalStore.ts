// Enhanced Electrical Data Store with ESP32 Integration

import { create } from 'zustand';
import { ElectricalData, ConnectionStatus } from '../types';
import { getESP32Api } from '../services/esp32Api';
import { useHistoryStore } from './useHistoryStore';
import { useEventsStore } from './useEventsStore';

// NO MOCK DATA - Only real ESP32 data

interface ElectricalStore {
  data: ElectricalData | null;
  connection: ConnectionStatus;
  isDemoMode: boolean;
  esp32IP: string;
  esp32Port: string;

  // Actions
  updateData: (data: ElectricalData) => void;
  toggleRelay: () => void;
  setConnected: (isConnected: boolean) => void;
  setDemoMode: (isDemoMode: boolean) => void;
  incrementEnergy: () => void;

  // ESP32 Connection Actions
  connectToESP32: (ip: string, port?: string) => Promise<boolean>;
  disconnectFromESP32: () => void;
  startRealTimeUpdates: () => void;
  stopRealTimeUpdates: () => void;
  setESP32Config: (ip: string, port: string) => void;
}

export const useElectricalStore = create<ElectricalStore>((set, get) => ({
  data: null, // NO MOCK DATA - Starts as null until ESP32 connects
  connection: {
    isConnected: false,
    lastUpdate: Date.now(),
    signalStrength: 0,
  },
  isDemoMode: false, // NO DEMO MODE - Real ESP32 only
  esp32IP: '192.168.4.1',
  esp32Port: '80',

  updateData: (data) => {
    set((state) => ({
      data,
      connection: {
        ...state.connection,
        lastUpdate: Date.now(),
      },
    }));

    // Schedule these to run AFTER the state update to avoid synchronous store updates
    setTimeout(() => {
      // ⚡ Log to history store (auto-sampled to 1/minute)
      useHistoryStore.getState().logReading(data);

      // ⚡ Check for events and violations
      useEventsStore.getState().checkAndLogEvents(data);

      // ⚡ Check for alerts and trigger notifications
      import('../services/notificationService').then(({ checkAllAlerts }) => {
        checkAllAlerts(data, true);
      });
    }, 0);
  },

  toggleRelay: async () => {
    const state = get();

    // REAL ESP32 ONLY - No demo mode
    if (!state.connection.isConnected || !state.data) {
      console.error('❌ Cannot toggle relay: ESP32 not connected');
      return;
    }

    const api = getESP32Api(state.esp32IP, state.esp32Port);
    const newState = !state.data.relayState;

    console.log(`🔌 ESP32 RELAY CONTROL: Sending command to ${state.esp32IP}:${state.esp32Port}`);
    console.log(`📡 Attempting to turn relay: ${newState ? 'ON' : 'OFF'}`);

    const success = await api.setRelayState(newState);

    if (success) {
      console.log(`✅ ESP32 RELAY CONTROL SUCCESS: Relay is now ${newState ? 'ON' : 'OFF'}`);

      // Fetch updated status from real ESP32
      const updatedData = await api.getStatus();
      if (updatedData) {
        set({ data: updatedData });
        console.log(`📊 ESP32 Status Updated:`, {
          voltage: updatedData.voltage,
          current: updatedData.current,
          power: updatedData.power,
          relayState: updatedData.relayState
        });
      }
    } else {
      console.error(`❌ ESP32 RELAY CONTROL FAILED: Could not toggle relay`);
    }
  },

  setConnected: (isConnected) =>
    set((state) => ({
      connection: {
        ...state.connection,
        isConnected,
        lastUpdate: Date.now(),
        signalStrength: isConnected ? 85 : 0,
      },
      isDemoMode: false, // Always false - no demo mode
    })),

  setDemoMode: (isDemoMode) => {
    // NO DEMO MODE - This function is deprecated but kept for compatibility
    console.warn('⚠️ setDemoMode called but demo mode is disabled - use connectToESP32 instead');

    const state = get();
    if (state.esp32IP) {
      // Try to connect to ESP32
      state.connectToESP32(state.esp32IP, state.esp32Port);
    }
  },

  incrementEnergy: () =>
    set((state) => {
      if (!state.data || !state.data.relayState) return state;

      const incrementKWh = (state.data.power * (1 / 60)) / 1000;

      return {
        data: {
          ...state.data,
          energy: state.data.energy + incrementKWh,
        },
      };
    }),

  connectToESP32: async (ip, port = '80') => {
    const api = getESP32Api(ip, port);

    // Test connection
    const isConnected = await api.testConnection();

    if (isConnected) {
      // Get initial status
      const initialData = await api.getStatus();

      if (initialData) {
        set({
          data: initialData,
          isDemoMode: false,
          esp32IP: ip,
          esp32Port: port,
          connection: {
            isConnected: true,
            lastUpdate: Date.now(),
            signalStrength: 85,
          },
        });

        // Start real-time updates
        get().startRealTimeUpdates();

        return true;
      }
    }

    // Connection failed
    set({
      connection: {
        isConnected: false,
        lastUpdate: Date.now(),
        signalStrength: 0,
      },
    });

    return false;
  },

  disconnectFromESP32: () => {
    const api = getESP32Api();
    api.cleanup();

    set({
      isDemoMode: false, // NO DEMO MODE
      connection: {
        isConnected: false,
        lastUpdate: Date.now(),
        signalStrength: 0,
      },
      data: null, // Clear data when disconnected
    });
  },

  startRealTimeUpdates: () => {
    const state = get();
    if (!state.connection.isConnected) {
      console.warn('⚠️ Cannot start updates: ESP32 not connected');
      return;
    }

    const api = getESP32Api(state.esp32IP, state.esp32Port);

    // Start polling for updates
    api.startPolling((data) => {
      if (data) {
        set((state) => ({
          data,
          connection: {
            ...state.connection,
            lastUpdate: Date.now(),
            signalStrength: 85,
          },
        }));

        // Schedule these to run AFTER the state update to avoid synchronous store updates
        setTimeout(() => {
          // ⚡ Log to history store (auto-sampled to 1/minute)
          useHistoryStore.getState().logReading(data);

          // ⚡ Check for events and violations
          useEventsStore.getState().checkAndLogEvents(data);

          // ⚡ Check for alerts and trigger notifications
          import('../services/notificationService').then(({ checkAllAlerts }) => {
            checkAllAlerts(data, true);
          });
        }, 0);
      }
    }, 1000); // Update every second

    // Monitor connection
    api.startConnectionMonitoring(
      () => {
        // On connected
        set((state) => ({
          connection: {
            ...state.connection,
            isConnected: true,
            signalStrength: 85,
          },
        }));
      },
      () => {
        // On disconnected
        set((state) => ({
          connection: {
            ...state.connection,
            isConnected: false,
            signalStrength: 0,
          },
        }));
      },
      5000 // Check every 5 seconds
    );
  },

  stopRealTimeUpdates: () => {
    const api = getESP32Api();
    api.cleanup();
  },

  setESP32Config: (ip, port) => {
    set({
      esp32IP: ip,
      esp32Port: port,
    });
  },
}));