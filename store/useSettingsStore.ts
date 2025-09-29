// Settings Store

import { create } from 'zustand';
import { Settings } from '../types';
import { generateDefaultSettings } from '../utils';

interface SettingsStore {
  settings: Settings;

  // Actions
  updateSettings: (settings: Partial<Settings>) => void;
  updateThresholds: (thresholds: Partial<Settings['thresholds']>) => void;
  updateNotifications: (notifications: Partial<Settings['notifications']>) => void;
  updateSchedule: (schedule: Partial<Settings['schedule']>) => void;
  resetSettings: () => void;
}

const defaultSettings = generateDefaultSettings();

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...newSettings,
      },
    })),

  updateThresholds: (thresholds) =>
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
    })),

  updateNotifications: (notifications) =>
    set((state) => ({
      settings: {
        ...state.settings,
        notifications: {
          ...state.settings.notifications,
          ...notifications,
        },
      },
    })),

  updateSchedule: (schedule) =>
    set((state) => ({
      settings: {
        ...state.settings,
        schedule: {
          ...state.settings.schedule,
          ...schedule,
        },
      },
    })),

  resetSettings: () =>
    set({
      settings: defaultSettings,
    }),
}));