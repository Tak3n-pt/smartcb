// Settings Store with ESP32 Synchronization and Persistent Storage

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings } from '../types';
import { generateDefaultSettings } from '../utils';
import { getESP32Api } from '../services/esp32Api';

const STORAGE_KEY_SETTINGS = '@smartcb_settings';

interface SettingsStore {
  settings: Settings;
  isLoaded: boolean;

  // Actions
  updateSettings: (settings: Partial<Settings>) => void;
  updateThresholds: (thresholds: Partial<Settings['thresholds']>) => Promise<void>;
  updateNotifications: (notifications: Partial<Settings['notifications']>) => void;
  updateSchedule: (schedule: Partial<Settings['schedule']>) => Promise<void>;
  resetSettings: () => void;
  syncWithESP32: () => Promise<void>;
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  clearAll: () => void;
}

const defaultSettings = generateDefaultSettings();

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  isLoaded: false,

  updateSettings: (newSettings) => {
    set((state) => ({
      settings: {
        ...state.settings,
        ...newSettings,
      },
    }));

    // Save to storage after updating
    get().saveToStorage();
  },

  updateThresholds: async (thresholds) => {
    // Update local state
    set((state) => ({
      settings: {
        ...state.settings,
        thresholds: {
          ...state.settings.thresholds,
          ...thresholds,
          voltage: {
            ...state.settings.thresholds.voltage,
            ...(thresholds.voltage || {}),
          },
          current: {
            ...state.settings.thresholds.current,
            ...(thresholds.current || {}),
          },
          energy: {
            ...state.settings.thresholds.energy,
            ...(thresholds.energy || {}),
          },
          frequency: {
            ...state.settings.thresholds.frequency,
            ...(thresholds.frequency || {}),
          },
          powerFactor: {
            ...state.settings.thresholds.powerFactor,
            ...(thresholds.powerFactor || {}),
          },
        },
      },
    }));

    // Save to storage
    get().saveToStorage();

    // Sync with ESP32 (NOW SUPPORTED in v4.0)
    try {
      const state = get();
      const api = getESP32Api();

      // Sync all thresholds including advanced ones
      await api.updateSettings({
        maxCurrent: state.settings.thresholds.current.max,
        maxVoltage: state.settings.thresholds.voltage.max,
        minVoltage: state.settings.thresholds.voltage.min,
        protectionEnabled: state.settings.thresholds.current.enabled,
        // Advanced thresholds
        maxFrequency: state.settings.thresholds.frequency.max,
        minFrequency: state.settings.thresholds.frequency.min,
        minPowerFactor: state.settings.thresholds.powerFactor.min,
        frequencyProtection: state.settings.thresholds.frequency.enabled,
        powerFactorProtection: state.settings.thresholds.powerFactor.enabled,
        voltageProtection: true,  // Always enabled for safety
        autoResetDelay: state.settings.reconnection.delay,
        autoReconnectEnabled: state.settings.reconnection.enabled  // BUG-008 fix
      });
      console.log('✅ All thresholds synchronized with ESP32 v4.0');
    } catch (error) {
      console.error('❌ Failed to sync thresholds with ESP32:', error);
      throw error;  // Re-throw to show error to user
    }
  },

  updateNotifications: (notifications) => {
    set((state) => ({
      settings: {
        ...state.settings,
        notifications: {
          ...state.settings.notifications,
          ...notifications,
        },
      },
    }));

    // Save to storage after updating
    get().saveToStorage();
  },

  updateSchedule: async (schedule) => {
    // Update local state
    set((state) => ({
      settings: {
        ...state.settings,
        schedule: {
          ...state.settings.schedule,
          ...schedule,
        },
      },
    }));

    // Save to storage
    get().saveToStorage();

    // NOTE: ESP32 v4.0 doesn't have schedule support yet, but settings work
    // Schedules are managed locally in the app only for now
    console.log('✅ Schedule updated (app-side only, ESP32 doesn\'t support schedules yet)');
  },

  resetSettings: () => {
    set({
      settings: defaultSettings,
    });

    // Save to storage after reset
    get().saveToStorage();
  },

  syncWithESP32: async () => {
    // Sync current settings with ESP32 v4.0
    const state = get();
    const api = getESP32Api();

    try {
      // Sync basic and advanced settings
      const success = await api.updateSettings({
        maxCurrent: state.settings.thresholds.current.max,
        maxVoltage: state.settings.thresholds.voltage.max,
        minVoltage: state.settings.thresholds.voltage.min,
        protectionEnabled: state.settings.thresholds.current.enabled,
        // Advanced thresholds
        maxFrequency: state.settings.thresholds.frequency.max,
        minFrequency: state.settings.thresholds.frequency.min,
        minPowerFactor: state.settings.thresholds.powerFactor.min,
        frequencyProtection: state.settings.thresholds.frequency.enabled,
        powerFactorProtection: state.settings.thresholds.powerFactor.enabled,
        voltageProtection: true,  // Always enabled for safety
        autoResetDelay: state.settings.reconnection.delay,
        autoReconnectEnabled: state.settings.reconnection.enabled  // BUG-008 fix
      });

      if (success) {
        console.log('✅ Settings synchronized with ESP32 v4.0');
      } else {
        console.error('❌ Failed to sync settings with ESP32');
      }
    } catch (error) {
      console.error('❌ Error syncing with ESP32:', error);
    }
  },

  /**
   * Save settings to AsyncStorage
   */
  saveToStorage: async () => {
    const state = get();
    try {
      await AsyncStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(state.settings));
      console.log('💾 Settings saved to storage');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  /**
   * Load settings from AsyncStorage
   */
  loadFromStorage: async () => {
    try {
      const settingsJSON = await AsyncStorage.getItem(STORAGE_KEY_SETTINGS);

      if (settingsJSON) {
        const settings = JSON.parse(settingsJSON);
        set({
          settings,
          isLoaded: true,
        });
        console.log('📂 Loaded settings from storage');
      } else {
        // No saved settings, use defaults
        set({ isLoaded: true });
        console.log('📂 No saved settings, using defaults');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoaded: true });
    }
  },

  /**
   * Clear all settings (for debugging/testing)
   */
  clearAll: () => {
    set({
      settings: defaultSettings,
    });

    AsyncStorage.removeItem(STORAGE_KEY_SETTINGS);
    console.log('🗑️ Cleared all settings');
  },
}));

// Load settings on app start
setTimeout(() => {
  useSettingsStore.getState().loadFromStorage();
}, 100);