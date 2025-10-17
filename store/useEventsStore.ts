// Events Store - Real ESP32 Events with Persistent Storage

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, EventStatistics, EventType } from '../types';
import { ElectricalData } from '../types';
import { useSettingsStore } from './useSettingsStore';

const STORAGE_KEY_EVENTS = '@smartcb_events';
const MAX_EVENTS = 500; // Keep last 500 events

interface EventsStore {
  events: Event[];
  filter: {
    dateRange: 'today' | 'week' | 'month' | 'all';
    eventType: EventType | 'all';
  };
  lastReadings: ElectricalData | null;
  isLoaded: boolean;
  reconnectionTimeout: NodeJS.Timeout | null;
  reconnectionAttempts: number;

  // Actions
  addEvent: (event: Event) => void;
  checkAndLogEvents: (data: ElectricalData) => boolean;
  setFilter: (filter: Partial<EventsStore['filter']>) => void;
  getFilteredEvents: () => Event[];
  getStatistics: () => EventStatistics;
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  clearAll: () => void;
  scheduleAutoReconnect: () => void;
  cancelAutoReconnect: () => void;
}

export const useEventsStore = create<EventsStore>((set, get) => ({
  events: [], // Start with empty events - will be loaded from storage
  filter: {
    dateRange: 'all',
    eventType: 'all',
  },
  lastReadings: null,
  isLoaded: false,
  reconnectionTimeout: null,
  reconnectionAttempts: 0,

  addEvent: (event) => {
    set((state) => {
      // Add event and limit to MAX_EVENTS
      let events = [event, ...state.events];
      if (events.length > MAX_EVENTS) {
        events = events.slice(0, MAX_EVENTS);
      }
      return { events };
    });

    // Save to storage after adding event
    get().saveToStorage();
  },

  checkAndLogEvents: (data: ElectricalData) => {
    const { lastReadings, addEvent } = get();

    // Get thresholds from Settings store
    const settings = useSettingsStore.getState().settings;
    const thresholds = settings.thresholds;

    const VOLTAGE_MAX = thresholds.voltage.max;
    const VOLTAGE_MIN = thresholds.voltage.min;
    const CURRENT_MAX = thresholds.current.max;
    const CURRENT_MIN = 0.1; // Keep this fixed for underload detection
    const FREQUENCY_MAX = thresholds.frequency.max;
    const FREQUENCY_MIN = thresholds.frequency.min;
    const POWER_FACTOR_MIN = thresholds.powerFactor.min;

    const timestamp = Date.now();
    let eventCreated = false;

    // Check voltage violations
    if (data.voltage > VOLTAGE_MAX) {
      addEvent({
        id: `evt-${timestamp}-overvoltage`,
        type: 'overvoltage',
        timestamp,
        description: `High voltage detected: ${data.voltage.toFixed(1)}V (Max: ${VOLTAGE_MAX}V)`,
        readings: data,
      });
      eventCreated = true;
    } else if (data.voltage < VOLTAGE_MIN && data.voltage > 0) {
      addEvent({
        id: `evt-${timestamp}-undervoltage`,
        type: 'undervoltage',
        timestamp,
        description: `Low voltage detected: ${data.voltage.toFixed(1)}V (Min: ${VOLTAGE_MIN}V)`,
        readings: data,
      });
      eventCreated = true;
    }

    // Check current violations
    if (data.current > CURRENT_MAX) {
      addEvent({
        id: `evt-${timestamp}-overload`,
        type: 'overload',
        timestamp,
        description: `Overload detected: ${data.current.toFixed(2)}A (Max: ${CURRENT_MAX}A)`,
        readings: data,
      });
      eventCreated = true;
    } else if (data.current < CURRENT_MIN && data.current > 0 && data.voltage > 0) {
      addEvent({
        id: `evt-${timestamp}-underload`,
        type: 'underload',
        timestamp,
        description: `Very low current: ${data.current.toFixed(3)}A`,
        readings: data,
      });
    }

    // Check power outage/restore
    if (lastReadings) {
      if (lastReadings.voltage > 100 && data.voltage < 100) {
        // Power outage - cancel any pending reconnection
        get().cancelAutoReconnect();

        addEvent({
          id: `evt-${timestamp}-outage`,
          type: 'outage',
          timestamp,
          description: 'Power outage detected',
          readings: data,
        });
        eventCreated = true;
      } else if (lastReadings.voltage < 100 && data.voltage > 100) {
        // Power restored - schedule auto-reconnection if enabled
        addEvent({
          id: `evt-${timestamp}-restore`,
          type: 'restore',
          timestamp,
          description: 'Power restored',
          readings: data,
        });
        eventCreated = true;

        // Trigger auto-reconnection if enabled
        const reconnectionSettings = settings.reconnection;
        if (reconnectionSettings.enabled && !data.relayState) {
          console.log(`⏱️ AUTO-RECONNECTION: Scheduling relay turn-on in ${reconnectionSettings.delay} seconds`);
          get().scheduleAutoReconnect();
        }
      }
    }

    // Check frequency violations (only if enabled)
    if (thresholds.frequency.enabled) {
      if (data.frequency > FREQUENCY_MAX) {
        addEvent({
          id: `evt-${timestamp}-freq-max`,
          type: 'frequency_max',
          timestamp,
          description: `High frequency: ${data.frequency.toFixed(1)}Hz (Max: ${FREQUENCY_MAX}Hz)`,
          readings: data,
        });
        eventCreated = true;
      } else if (data.frequency < FREQUENCY_MIN && data.frequency > 0) {
        addEvent({
          id: `evt-${timestamp}-freq-min`,
          type: 'frequency_min',
          timestamp,
          description: `Low frequency: ${data.frequency.toFixed(1)}Hz (Min: ${FREQUENCY_MIN}Hz)`,
          readings: data,
        });
        eventCreated = true;
      }
    }

    // Check power factor (only if enabled)
    if (thresholds.powerFactor.enabled && data.powerFactor < POWER_FACTOR_MIN && data.powerFactor > 0 && data.current > 0.5) {
      addEvent({
        id: `evt-${timestamp}-pf-low`,
        type: 'power_factor_min',
        timestamp,
        description: `Low power factor: ${data.powerFactor.toFixed(2)} (Min: ${POWER_FACTOR_MIN})`,
        readings: data,
      });
    }

    // Check relay state changes
    if (lastReadings && lastReadings.relayState !== data.relayState) {
      addEvent({
        id: `evt-${timestamp}-relay`,
        type: data.relayState ? 'manual_on' : 'manual_off',
        timestamp,
        description: `Relay turned ${data.relayState ? 'ON' : 'OFF'}`,
        readings: data,
      });
      eventCreated = true;
    }

    // Update last readings
    set({ lastReadings: data });

    // Log when events are detected
    if (eventCreated) {
      console.log('🚨 EVENT DETECTED AND SAVED:', {
        voltage: data.voltage,
        current: data.current,
        power: data.power,
        frequency: data.frequency,
        powerFactor: data.powerFactor
      });
    }

    return eventCreated;
  },

  setFilter: (filter) =>
    set((state) => ({
      filter: {
        ...state.filter,
        ...filter,
      },
    })),

  getFilteredEvents: () => {
    const { events, filter } = get();
    const now = Date.now();

    let filtered = events;

    // Filter by date range
    switch (filter.dateRange) {
      case 'today':
        const todayStart = new Date().setHours(0, 0, 0, 0);
        filtered = filtered.filter((event) => event.timestamp >= todayStart);
        break;
      case 'week':
        const weekStart = now - 7 * 24 * 60 * 60 * 1000;
        filtered = filtered.filter((event) => event.timestamp >= weekStart);
        break;
      case 'month':
        const monthStart = now - 30 * 24 * 60 * 60 * 1000;
        filtered = filtered.filter((event) => event.timestamp >= monthStart);
        break;
    }

    // Filter by event type
    if (filter.eventType !== 'all') {
      filtered = filtered.filter((event) => event.type === filter.eventType);
    }

    return filtered;
  },

  getStatistics: () => {
    const events = get().events;

    // Calculate statistics for the current month
    const monthStart = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const monthEvents = events.filter((event) => event.timestamp >= monthStart);

    const outages = monthEvents.filter((event) => event.type === 'outage');
    const totalOutages = outages.length;

    const totalDowntime = outages.reduce((sum, event) => sum + (event.duration || 0), 0);

    const averageOutageDuration =
      totalOutages > 0 ? totalDowntime / totalOutages : 0;

    return {
      totalEvents: monthEvents.length,
      totalOutages,
      averageOutageDuration,
      totalDowntime,
    };
  },

  /**
   * Save events to AsyncStorage
   */
  saveToStorage: async () => {
    const state = get();
    try {
      await AsyncStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(state.events));
      console.log(`💾 Events saved: ${state.events.length} events`);
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  },

  /**
   * Load events from AsyncStorage
   */
  loadFromStorage: async () => {
    try {
      const eventsJSON = await AsyncStorage.getItem(STORAGE_KEY_EVENTS);
      const events = eventsJSON ? JSON.parse(eventsJSON) : [];

      set({
        events,
        isLoaded: true,
      });

      console.log(`📂 Loaded events: ${events.length} events`);
    } catch (error) {
      console.error('Failed to load events:', error);
      set({ isLoaded: true });
    }
  },

  /**
   * Clear all events (for debugging/testing)
   */
  clearAll: () => {
    set({
      events: [],
    });

    AsyncStorage.removeItem(STORAGE_KEY_EVENTS);
    console.log('🗑️ Cleared all events');
  },

  /**
   * Schedule auto-reconnection after power restore
   */
  scheduleAutoReconnect: () => {
    const state = get();
    const settings = useSettingsStore.getState().settings;
    const reconnectionSettings = settings.reconnection;

    // Cancel any existing timeout
    if (state.reconnectionTimeout) {
      clearTimeout(state.reconnectionTimeout);
    }

    // Check if we've exceeded max attempts
    if (state.reconnectionAttempts >= reconnectionSettings.maxAttempts) {
      console.log(`❌ AUTO-RECONNECTION: Max attempts (${reconnectionSettings.maxAttempts}) reached. Stopping.`);
      set({ reconnectionAttempts: 0 });
      return;
    }

    // Schedule the reconnection
    const delayMs = reconnectionSettings.delay * 1000;
    const timeout = setTimeout(async () => {
      console.log(`🔌 AUTO-RECONNECTION: Attempting to turn relay ON (attempt ${state.reconnectionAttempts + 1}/${reconnectionSettings.maxAttempts})`);

      // Import ElectricalStore dynamically to avoid circular dependency
      const { useElectricalStore } = await import('./useElectricalStore');
      const relayState = useElectricalStore.getState().data?.relayState;

      // Only turn on if relay is currently OFF
      if (!relayState) {
        await useElectricalStore.getState().toggleRelay();

        // Wait a moment and check if it worked
        setTimeout(() => {
          const newRelayState = useElectricalStore.getState().data?.relayState;
          if (newRelayState) {
            console.log('✅ AUTO-RECONNECTION: Relay successfully turned ON');
            set({ reconnectionAttempts: 0, reconnectionTimeout: null });
          } else {
            console.log('⚠️ AUTO-RECONNECTION: Relay failed to turn ON, will retry...');
            set({ reconnectionAttempts: state.reconnectionAttempts + 1 });
            get().scheduleAutoReconnect(); // Retry
          }
        }, 2000); // Wait 2 seconds to verify
      } else {
        console.log('ℹ️ AUTO-RECONNECTION: Relay already ON, skipping');
        set({ reconnectionAttempts: 0, reconnectionTimeout: null });
      }
    }, delayMs);

    set({ reconnectionTimeout: timeout });
    console.log(`⏱️ AUTO-RECONNECTION: Scheduled for ${reconnectionSettings.delay} seconds from now`);
  },

  /**
   * Cancel auto-reconnection
   */
  cancelAutoReconnect: () => {
    const state = get();
    if (state.reconnectionTimeout) {
      clearTimeout(state.reconnectionTimeout);
      set({ reconnectionTimeout: null, reconnectionAttempts: 0 });
      console.log('🚫 AUTO-RECONNECTION: Cancelled');
    }
  },
}));

// Load events on app start
setTimeout(() => {
  useEventsStore.getState().loadFromStorage();
}, 100);