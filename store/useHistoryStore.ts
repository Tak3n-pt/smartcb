/**
 * useHistoryStore - Historical Data Storage
 *
 * Hybrid storage strategy:
 * - In-Memory: Last 24 hours at 1-minute intervals (1,440 readings)
 * - AsyncStorage: Last 30 days aggregated by hour (720 aggregates)
 *
 * Features:
 * - Automatic sampling (1 reading/minute from ESP32's 1/second stream)
 * - Automatic hourly aggregation
 * - Automatic data cleanup (> 30 days)
 * - Persistent storage across app restarts
 * - Smart querying for charts
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ElectricalData } from '../types';

// === TYPES ===

export interface Reading {
  timestamp: number;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  frequency: number;
  powerFactor: number;
  apparentPower: number;
  reactivePower: number;
}

export interface HourlyAggregate {
  timestamp: number; // Start of hour (e.g., 2025-01-10 14:00:00)

  // Voltage stats
  voltageAvg: number;
  voltageMin: number;
  voltageMax: number;

  // Current stats
  currentAvg: number;
  currentMax: number;

  // Power stats
  powerAvg: number;
  powerMax: number;

  // Energy consumed this hour
  energyDelta: number; // kWh

  // Other averages
  frequencyAvg: number;
  powerFactorAvg: number;
  apparentPowerAvg: number;
  reactivePowerAvg: number;

  // Metadata
  sampleCount: number; // How many readings in this hour
}

interface HistoryState {
  // In-memory: Last 24 hours (1,440 readings max)
  recentReadings: Reading[];

  // Persistent: Last 30 days hourly (720 aggregates max)
  historicalData: HourlyAggregate[];

  // Metadata
  lastSampleTime: number;
  lastAggregateTime: number;
  lastSaveTime: number;
  isLoaded: boolean;

  // Version number to track changes without triggering on every array update
  dataVersion: number;

  // Actions
  logReading: (data: ElectricalData) => void;
  getReadingsForPeriod: (startTime: number, endTime: number, granularity: 'minute' | 'hour') => (Reading | HourlyAggregate)[];
  aggregateCurrentHour: () => void;
  pruneOldData: () => void;
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  clearAll: () => void;
}

// === CONSTANTS ===

const SAMPLE_INTERVAL = 2 * 1000; // CHANGED: 2 seconds (was 60s) for faster chart updates
const MAX_RECENT_READINGS = 43200; // CHANGED: 24 hours at 2-second intervals (was 1440)
const MAX_HISTORICAL_HOURS = 720; // 30 days at 1/hour
const SAVE_INTERVAL = 5 * 60 * 1000; // Save every 5 minutes
const AGGREGATE_CHECK_INTERVAL = 60 * 1000; // Check for aggregation every minute
const STORAGE_KEY_RECENT = '@smartcb_recent_readings';
const STORAGE_KEY_HISTORICAL = '@smartcb_historical_data';
const ONE_HOUR_MS = 60 * 60 * 1000;
const ENERGY_MIN_EXPECTED_DELTA = 0.00005; // 0.05 Wh threshold before we adjust
const ENERGY_LOW_RATIO_THRESHOLD = 0.1; // Treat sensor energy as bad if it is under 10% of expected
const MAX_DELTA_WINDOW_MS = ONE_HOUR_MS * 12; // Ignore gaps bigger than 12 hours

// === HELPER FUNCTIONS ===

/**
 * Get the start of the hour for a timestamp
 */
function getHourStart(timestamp: number): number {
  const date = new Date(timestamp);
  date.setMinutes(0, 0, 0);
  return date.getTime();
}

/**
 * Convert ElectricalData to Reading
 */
function toReading(data: ElectricalData): Reading {
  return {
    timestamp: data.timestamp,
    voltage: data.voltage,
    current: data.current,
    power: data.power,
    energy: data.energy,
    frequency: data.frequency,
    powerFactor: data.powerFactor,
    apparentPower: data.apparentPower,
    reactivePower: data.reactivePower,
  };
}

/**
 * Aggregate an array of readings into a single HourlyAggregate
 */
function aggregateReadings(readings: Reading[], hourStart: number): HourlyAggregate {
  if (readings.length === 0) {
    return {
      timestamp: hourStart,
      voltageAvg: 0,
      voltageMin: 0,
      voltageMax: 0,
      currentAvg: 0,
      currentMax: 0,
      powerAvg: 0,
      powerMax: 0,
      energyDelta: 0,
      frequencyAvg: 0,
      powerFactorAvg: 0,
      apparentPowerAvg: 0,
      reactivePowerAvg: 0,
      sampleCount: 0,
    };
  }

  const voltages = readings.map(r => r.voltage);
  const currents = readings.map(r => r.current);
  const powers = readings.map(r => r.power);
  const energies = readings.map(r => r.energy);

  // Calculate energy consumed this hour (delta from first to last reading)
  const energyDelta = readings.length > 1
    ? Math.max(0, readings[readings.length - 1].energy - readings[0].energy)
    : 0;

  return {
    timestamp: hourStart,
    voltageAvg: voltages.reduce((a, b) => a + b, 0) / voltages.length,
    voltageMin: Math.min(...voltages),
    voltageMax: Math.max(...voltages),
    currentAvg: currents.reduce((a, b) => a + b, 0) / currents.length,
    currentMax: Math.max(...currents),
    powerAvg: powers.reduce((a, b) => a + b, 0) / powers.length,
    powerMax: Math.max(...powers),
    energyDelta,
    frequencyAvg: readings.reduce((sum, r) => sum + r.frequency, 0) / readings.length,
    powerFactorAvg: readings.reduce((sum, r) => sum + r.powerFactor, 0) / readings.length,
    apparentPowerAvg: readings.reduce((sum, r) => sum + r.apparentPower, 0) / readings.length,
    reactivePowerAvg: readings.reduce((sum, r) => sum + r.reactivePower, 0) / readings.length,
    sampleCount: readings.length,
  };
}

function isFiniteNumber(value: any): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function expectedEnergyDelta(prev: Reading, current: Reading): number {
  const deltaTimeMs = current.timestamp - prev.timestamp;

  if (!isFiniteNumber(deltaTimeMs) || deltaTimeMs <= 0 || deltaTimeMs > MAX_DELTA_WINDOW_MS) {
    return 0;
  }

  const prevPower = isFiniteNumber(prev.power) ? prev.power : 0;
  const currentPower = isFiniteNumber(current.power) ? current.power : 0;
  const avgPower = (prevPower + currentPower) / 2;

  if (avgPower <= 0) {
    return 0;
  }

  return (avgPower / 1000) * (deltaTimeMs / ONE_HOUR_MS);
}

function normalizeEnergySample(reading: Reading, previous?: Reading): Reading {
  const normalized: Reading = { ...reading, energy: isFiniteNumber(reading.energy) ? reading.energy : 0 };

  if (!previous) {
    normalized.energy = Math.max(0, normalized.energy);
    return normalized;
  }

  const previousEnergy = isFiniteNumber(previous.energy) ? previous.energy : 0;
  normalized.energy = Math.max(0, normalized.energy);

  if (normalized.energy <= previousEnergy) {
    normalized.energy = Math.max(previousEnergy, normalized.energy);
    return normalized;
  }

  const deltaEnergy = normalized.energy - previousEnergy;
  const expectedDelta = expectedEnergyDelta(previous, reading);

  if (expectedDelta > ENERGY_MIN_EXPECTED_DELTA && deltaEnergy < expectedDelta * ENERGY_LOW_RATIO_THRESHOLD) {
    normalized.energy = previousEnergy + expectedDelta;
  }

  return normalized;
}

function normalizeRecentSeries(readings: Reading[]): Reading[] {
  if (!Array.isArray(readings) || readings.length === 0) {
    return readings;
  }

  const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp);
  const normalized: Reading[] = [];
  let previous: Reading | undefined;

  for (const reading of sorted) {
    const normalizedReading = normalizeEnergySample(reading, previous);
    normalized.push(normalizedReading);
    previous = normalizedReading;
  }

  return normalized;
}

function normalizeHistoricalSeries(aggregates: HourlyAggregate[]): HourlyAggregate[] {
  if (!Array.isArray(aggregates) || aggregates.length === 0) {
    return aggregates;
  }

  return aggregates.map((aggregate) => {
    if (!aggregate) {
      return aggregate;
    }

    const powerAvg = isFiniteNumber(aggregate.powerAvg) ? aggregate.powerAvg : 0;
    const measuredEnergy = isFiniteNumber(aggregate.energyDelta) ? aggregate.energyDelta : 0;
    const expectedEnergy = powerAvg > 0 ? powerAvg / 1000 : 0;

    if (measuredEnergy < 0) {
      return { ...aggregate, energyDelta: 0 };
    }

    if (expectedEnergy >= 0.05 && (measuredEnergy <= 0 || measuredEnergy < expectedEnergy * ENERGY_LOW_RATIO_THRESHOLD)) {
      return { ...aggregate, energyDelta: expectedEnergy };
    }

    return aggregate;
  });
}

// === STORE ===

export const useHistoryStore = create<HistoryState>((set, get) => ({
  // Initial state
  recentReadings: [],
  historicalData: [],
  lastSampleTime: 0,
  lastAggregateTime: 0,
  lastSaveTime: 0,
  isLoaded: false,

  /**
   * Log a new reading from ESP32
   * - Automatically samples at SAMPLE_INTERVAL (2 seconds)
   * - Triggers aggregation and saving as needed
   */
  logReading: (data: ElectricalData) => {
    const now = Date.now();
    const state = get();
    const timeSinceLastSample = now - state.lastSampleTime;

    // Sample throttling: Only store every 2 seconds
    if (timeSinceLastSample < SAMPLE_INTERVAL) {
      return; // Drop readings - expected (50% dropped)
    }

    const previousReading = state.recentReadings[state.recentReadings.length - 1];
    const rawReading = toReading(data);
    const reading = normalizeEnergySample(rawReading, previousReading);

    set((state) => {
      // Add to recent readings
      let recentReadings = [...state.recentReadings, reading];

      // Keep last 24 hours only
      if (recentReadings.length > MAX_RECENT_READINGS) {
        recentReadings = recentReadings.slice(recentReadings.length - MAX_RECENT_READINGS);
      }

      return {
        recentReadings,
        lastSampleTime: now,
        dataVersion: state.dataVersion + 1,
      };
    });

    // Log every 10 readings
    const totalReadings = get().recentReadings.length;
    if (totalReadings % 10 === 0) {
      console.log(`✅ ESP32 DATA STORED: ${totalReadings} readings`);
    }

    // Check if we need to aggregate
    const hoursSinceLastAggregate = (now - state.lastAggregateTime) / (60 * 60 * 1000);
    if (hoursSinceLastAggregate >= 1) {
      get().aggregateCurrentHour();
    }

    // Check if we need to save
    if (now - state.lastSaveTime > SAVE_INTERVAL) {
      get().saveToStorage();
    }
  },

  /**
   * Get readings for a specific time period
   * - Returns minute-level data if available
   * - Falls back to hourly aggregates for older data
   */
  getReadingsForPeriod: (startTime: number, endTime: number, granularity: 'minute' | 'hour') => {
    const state = get();
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

    // If requesting minute-level data and time range is within last 24 hours
    if (granularity === 'minute' && startTime >= twentyFourHoursAgo) {
      return state.recentReadings.filter(
        r => r.timestamp >= startTime && r.timestamp <= endTime
      );
    }

    // Otherwise return hourly aggregates
    return state.historicalData.filter(
      h => h.timestamp >= startTime && h.timestamp <= endTime
    );
  },

  /**
   * Aggregate the current hour's readings into historicalData
   */
  aggregateCurrentHour: () => {
    const state = get();
    const now = Date.now();
    const currentHourStart = getHourStart(now);
    const previousHourStart = currentHourStart - (60 * 60 * 1000);

    // Find all readings from the previous hour
    const previousHourReadings = state.recentReadings.filter(
      r => r.timestamp >= previousHourStart && r.timestamp < currentHourStart
    );

    if (previousHourReadings.length === 0) {
      return; // Nothing to aggregate
    }

    // Create aggregate
    const aggregate = aggregateReadings(previousHourReadings, previousHourStart);

    set((state) => {
      // Check if we already have this hour (avoid duplicates)
      const existingIndex = state.historicalData.findIndex(
        h => h.timestamp === previousHourStart
      );

      let historicalData;
      if (existingIndex >= 0) {
        // Update existing
        historicalData = [...state.historicalData];
        historicalData[existingIndex] = aggregate;
      } else {
        // Add new
        historicalData = [...state.historicalData, aggregate];
      }

      // Sort by timestamp
      historicalData.sort((a, b) => a.timestamp - b.timestamp);

      // Prune if exceeds max (keep last 30 days)
      if (historicalData.length > MAX_HISTORICAL_HOURS) {
        historicalData = historicalData.slice(historicalData.length - MAX_HISTORICAL_HOURS);
      }

      return {
        historicalData,
        lastAggregateTime: now,
      };
    });

    // Trigger save after aggregation
    get().saveToStorage();

    console.log(`✅ Aggregated hour: ${new Date(previousHourStart).toISOString()}, samples: ${previousHourReadings.length}`);
  },

  /**
   * Remove data older than 30 days
   */
  pruneOldData: () => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    set((state) => ({
      recentReadings: state.recentReadings.filter(r => r.timestamp >= thirtyDaysAgo),
      historicalData: state.historicalData.filter(h => h.timestamp >= thirtyDaysAgo),
    }));
  },

  /**
   * Save to AsyncStorage
   */
  saveToStorage: async () => {
    const state = get();
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(state.recentReadings)),
        AsyncStorage.setItem(STORAGE_KEY_HISTORICAL, JSON.stringify(state.historicalData)),
      ]);

      set({ lastSaveTime: Date.now() });
      console.log('💾 Saved history to storage');
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  },

  /**
   * Load from AsyncStorage
   */
  loadFromStorage: async () => {
    try {
      const [recentJSON, historicalJSON] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_RECENT),
        AsyncStorage.getItem(STORAGE_KEY_HISTORICAL),
      ]);

      let recentReadings = recentJSON ? JSON.parse(recentJSON) : [];
      let historicalData = historicalJSON ? JSON.parse(historicalJSON) : [];

      // CRITICAL FIX: Validate timestamps and filter out corrupt data
      const now = Date.now();
      const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);

      // Filter recent readings: keep only valid timestamps (within last year)
      const validRecentReadings = recentReadings.filter((r: Reading) => {
        return r && r.timestamp && r.timestamp > oneYearAgo && r.timestamp <= now;
      });

      // Filter historical data: keep only valid timestamps (within last year)
      const validHistoricalData = historicalData.filter((h: HourlyAggregate) => {
        return h && h.timestamp && h.timestamp > oneYearAgo && h.timestamp <= now;
      });

      // Log if we filtered out corrupt data
      const corruptRecent = recentReadings.length - validRecentReadings.length;
      const corruptHistorical = historicalData.length - validHistoricalData.length;

      if (corruptRecent > 0 || corruptHistorical > 0) {
        console.log(`🧹 Cleaned corrupt data: ${corruptRecent} recent, ${corruptHistorical} historical`);
      }

      const normalizedRecentReadings = normalizeRecentSeries(validRecentReadings);
      const normalizedHistoricalData = normalizeHistoricalSeries(validHistoricalData);

      set({
        recentReadings: normalizedRecentReadings,
        historicalData: normalizedHistoricalData,
        isLoaded: true,
      });

      console.log(`📂 Loaded history: ${normalizedRecentReadings.length} recent, ${normalizedHistoricalData.length} historical`);

      // Prune old data after loading
      get().pruneOldData();
    } catch (error) {
      console.error('Failed to load history:', error);
      set({ isLoaded: true });
    }
  },

  /**
   * Clear all data (for debugging/testing)
   */
  clearAll: () => {
    set({
      recentReadings: [],
      historicalData: [],
      lastSampleTime: 0,
      lastAggregateTime: 0,
      lastSaveTime: 0,
    });

    AsyncStorage.multiRemove([STORAGE_KEY_RECENT, STORAGE_KEY_HISTORICAL]);
    console.log('🗑️ Cleared all history');
  },
}));

// === AUTO-INITIALIZATION ===

// Load history on app start
setTimeout(() => {
  useHistoryStore.getState().loadFromStorage();
}, 100);

// Periodic aggregation check (every minute)
setInterval(() => {
  const state = useHistoryStore.getState();
  const now = Date.now();
  const hoursSinceLastAggregate = (now - state.lastAggregateTime) / (60 * 60 * 1000);

  if (hoursSinceLastAggregate >= 1 && state.recentReadings.length > 0) {
    state.aggregateCurrentHour();
  }
}, AGGREGATE_CHECK_INTERVAL);

// Periodic auto-save (every 5 minutes)
setInterval(() => {
  const state = useHistoryStore.getState();
  const now = Date.now();

  if (now - state.lastSaveTime > SAVE_INTERVAL) {
    state.saveToStorage();
  }
}, SAVE_INTERVAL);

export { SAMPLE_INTERVAL, ENERGY_LOW_RATIO_THRESHOLD, ONE_HOUR_MS };
