// Events/Log Screen with Advanced Filtering - PERFORMANCE OPTIMIZED

import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useEventsStore, useThemeStore, useElectricalStore, useLanguageStore } from '../../store';
import { useHistoryStore, SAMPLE_INTERVAL, ENERGY_LOW_RATIO_THRESHOLD, ONE_HOUR_MS } from '../../store/useHistoryStore';
import { Card } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import {
  formatTimestamp,
  formatDurationShort,
  formatDate,
  formatTime,
  formatVoltage,
  formatCurrent,
  formatPower,
  formatEnergy,
  formatFrequency,
  formatPowerFactor,
  getEventIcon,
  getEventColor,
  translateEventDescription,
} from '../../utils';
import { EventType } from '../../types';
import DateTimePicker from '@react-native-community/datetimepicker';
// Replaced slow react-native-chart-kit with high-performance Skia charts
import { SkiaLineChart } from '../../components/charts/SkiaLineChart';
import { SkiaBarChart } from '../../components/charts/SkiaBarChart';

const { width: screenWidth } = Dimensions.get('window');
const EMPTY_HISTORY: any[] = Object.freeze([]);
const EMPTY_RECENT: any[] = Object.freeze([]);

type TimeRange = 'hour' | 'day' | 'week' | 'month' | 'custom';
type ConsumptionView = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
type TabType = 'events' | 'consumption';

// Using high-performance Skia charts instead of react-native-chart-kit

// PERFORMANCE: Extract heavy consumption overview component
const ConsumptionOverview = memo(({
  themeColors,
  t,
  formatDateLabel,
  formatEnergy,
  consumptionStartDate,
  consumptionEndDate,
  startHour,
  endHour,
  totalConsumption,
  currentData,
  maxConsumption,
  avgConsumption,
  daysDifference,
  isMultipleDays,
  currentHour,
  onDateRangePress,
  onHourRangePress,
}: any) => {
  // MEMOIZE chart data to prevent infinite re-renders
  const chartData = useMemo(() =>
    currentData.map((item: any) => ({
      label: item.label,
      value: item.kWh,
      highlight: item.hourValue === currentHour,
    })),
    [currentData, currentHour]
  );

  return (
    <Card style={[styles.consumptionCard, { backgroundColor: themeColors.surface }]}>
      <View style={styles.consumptionHeader}>
        <View style={styles.consumptionTitleRow}>
          <MaterialCommunityIcons name="lightning-bolt" size={24} color={themeColors.primary} />
          <Text style={[styles.sectionTitle, { color: themeColors.text.primary, marginBottom: 0, marginLeft: spacing.sm }]}>
            {t('events.consumption.title')}
          </Text>
        </View>
      </View>

      {/* Date Range Presets */}
      <Text style={[styles.presetLabel, { color: themeColors.text.secondary }]}>
        {t('events.consumption.dateRange')}:
      </Text>
      <View style={styles.presetsRow}>
        <TouchableOpacity
          style={[styles.presetChip, { backgroundColor: themeColors.primaryLight }]}
          onPress={() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            setConsumptionStartDate(today);
            setConsumptionEndDate(todayEnd);
          }}
        >
          <Text style={[styles.presetChipText, { color: themeColors.primary }]}>
            {t('events.consumption.datePresets.today')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.presetChip, { backgroundColor: themeColors.primaryLight }]}
          onPress={() => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            const yesterdayEnd = new Date(yesterday);
            yesterdayEnd.setHours(23, 59, 59, 999);
            setConsumptionStartDate(yesterday);
            setConsumptionEndDate(yesterdayEnd);
          }}
        >
          <Text style={[styles.presetChipText, { color: themeColors.primary }]}>
            {t('events.consumption.datePresets.yesterday')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.presetChip, { backgroundColor: themeColors.primaryLight }]}
          onPress={() => {
            const start = new Date();
            start.setDate(start.getDate() - 2);
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            setConsumptionStartDate(start);
            setConsumptionEndDate(end);
          }}
        >
          <Text style={[styles.presetChipText, { color: themeColors.primary }]}>
            {t('events.consumption.datePresets.last3Days')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.presetChip, { backgroundColor: themeColors.primaryLight }]}
          onPress={() => {
            const start = new Date();
            start.setDate(start.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            setConsumptionStartDate(start);
            setConsumptionEndDate(end);
          }}
        >
          <Text style={[styles.presetChipText, { color: themeColors.primary }]}>
            {t('events.consumption.datePresets.last7Days')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.presetChip, { backgroundColor: themeColors.background, borderWidth: 1, borderColor: themeColors.primary }]}
          onPress={onDateRangePress}
        >
          <Ionicons name="calendar-outline" size={14} color={themeColors.primary} />
          <Text style={[styles.presetChipText, { color: themeColors.primary, marginLeft: 4 }]}>
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hour Range Presets */}
      <Text style={[styles.presetLabel, { color: themeColors.text.secondary }]}>
        {t('events.consumption.hourRange')}:
      </Text>
      <View style={styles.presetsRow}>
        <TouchableOpacity
          style={[styles.presetChip, { backgroundColor: themeColors.infoLight }]}
          onPress={() => {
            setStartHour(0);
            setEndHour(23);
          }}
        >
          <Text style={[styles.presetChipText, { color: themeColors.info }]}>
            {t('events.consumption.hourPresets.fullDay')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.presetChip, { backgroundColor: themeColors.infoLight }]}
          onPress={() => {
            const currentHour = new Date().getHours();
            const startHour = Math.max(0, currentHour - 3);
            setStartHour(startHour);
            setEndHour(currentHour);
          }}
        >
          <Text style={[styles.presetChipText, { color: themeColors.info }]}>
            {t('events.consumption.hourPresets.last3Hours')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.presetChip, { backgroundColor: themeColors.infoLight }]}
          onPress={() => {
            setStartHour(6);
            setEndHour(18);
          }}
        >
          <Text style={[styles.presetChipText, { color: themeColors.info }]}>
            {t('events.consumption.hourPresets.daytime')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.presetChip, { backgroundColor: themeColors.infoLight }]}
          onPress={() => {
            setStartHour(18);
            setEndHour(23);
          }}
        >
          <Text style={[styles.presetChipText, { color: themeColors.info }]}>
            {t('events.consumption.hourPresets.evening')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.presetChip, { backgroundColor: themeColors.background, borderWidth: 1, borderColor: themeColors.info }]}
          onPress={onHourRangePress}
        >
          <Ionicons name="time-outline" size={14} color={themeColors.info} />
          <Text style={[styles.presetChipText, { color: themeColors.info, marginLeft: 4 }]}>
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {/* Compact Energy Display */}
      <View style={styles.energyStatsGrid}>
        {/* Total Energy Card */}
        <View style={[styles.energyStatCard, { backgroundColor: themeColors.primary }]}>
          <MaterialCommunityIcons name="flash" size={28} color="#FFFFFF" />
          <Text style={styles.energyStatValue}>
            {formatEnergy(totalConsumption)}
          </Text>
          <Text style={styles.energyStatLabel}>
            {t('events.consumption.total')}
          </Text>
        </View>

        {/* Average Card */}
        <View style={[styles.energyStatCard, { backgroundColor: themeColors.success }]}>
          <MaterialCommunityIcons name="trending-down" size={28} color="#FFFFFF" />
          <Text style={styles.energyStatValue}>
            {formatEnergy(avgConsumption)}
          </Text>
          <Text style={styles.energyStatLabel}>
            {t('events.consumption.average')}
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <SkiaBarChart
          data={chartData}
          maxValue={maxConsumption}
          theme={themeColors === colors.dark ? 'dark' : 'light'}
          primaryColor={themeColors.primary}
          highlightColor={themeColors.primary}
          formatValue={(v) => formatEnergy(v)}
        />
      </View>
    </Card>
  );
});

export default function EventsScreen() {
  const { theme } = useThemeStore();
  const { language } = useLanguageStore();
  const { data } = useElectricalStore();
  // CRITICAL FIX: Memoize themeColors to prevent new object on every render
  const themeColors = useMemo(() => colors[theme], [theme]);
  const { t } = useTranslation();

  // Check if we're in RTL mode (Arabic)
  const isRTL = language === 'ar';

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('consumption');

  // CRITICAL FIX: Only load data when component is mounted to prevent initial render issues
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Delay heavy computations until after first render
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [selectedEventTypes, setSelectedEventTypes] = useState<EventType[]>([]);

  // Pagination state for events list
  const [eventsToShow, setEventsToShow] = useState(10); // Initial display: 10 events
  const EVENTS_PER_PAGE = 10;

  // Separate modal states for date and hour range
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [showHourRangeModal, setShowHourRangeModal] = useState(false);

  // CRITICAL FIX: Use stable date initialization to prevent re-renders
  // Start with same day BUT endDate must be at end of day
  const [consumptionStartDate, setConsumptionStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [consumptionEndDate, setConsumptionEndDate] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);  // FIX: End of today, not start of today
    return d;
  });
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(23);
  const [showConsumptionStartPicker, setShowConsumptionStartPicker] = useState(false);
  const [showConsumptionEndPicker, setShowConsumptionEndPicker] = useState(false);

  // Pending filter states (for Apply button)
  const [pendingStartDate, setPendingStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [pendingEndDate, setPendingEndDate] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);  // FIX: End of today, not start of today
    return d;
  });
  const [pendingStartHour, setPendingStartHour] = useState(0);
  const [pendingEndHour, setPendingEndHour] = useState(23);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Event date range filter states
  const [startDate, setStartDate] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(() => new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Pending event filter states (for Apply button)
  const [pendingEventStartDate, setPendingEventStartDate] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [pendingEventEndDate, setPendingEventEndDate] = useState(() => new Date());
  const [hasEventPendingChanges, setHasEventPendingChanges] = useState(false);
  const [showEventFilterModal, setShowEventFilterModal] = useState(false);

  // CRITICAL FIX: Get store functions and data separately to prevent infinite loops
  const filter = useEventsStore((state) => state.filter);
  const setFilter = useEventsStore((state) => state.setFilter);
  const eventsData = useEventsStore((state) => state.events);

  // CRITICAL FIX: Calculate filtered events and statistics directly from raw data
  const events = useMemo(() => {
    const now = Date.now();
    let filtered = eventsData;

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
  }, [eventsData, filter]);

  const stats = useMemo(() => {
    // Calculate statistics for the current month
    const monthStart = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const monthEvents = eventsData.filter((event) => event.timestamp >= monthStart);

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
  }, [eventsData]);

  // CRITICAL FIX: Only subscribe to store data after component is ready
  const historicalData = useHistoryStore((state) => isReady ? state.historicalData : EMPTY_HISTORY);
  const recentReadings = useHistoryStore((state) => isReady ? state.recentReadings : EMPTY_RECENT);

  const currentHour = useMemo(() => new Date().getHours(), []);

  const hourlyConsumption = useMemo(() => {
    // CRITICAL FIX: Don't calculate if not ready or no data
    if (!isReady || !historicalData || !recentReadings) {
      return [];
    }

    // DEBUG: Log input data
    if (__DEV__) {
      console.log('📊 CONSUMPTION DATA CALCULATION:', {
        historicalDataCount: historicalData?.length ?? 0,
        recentReadingsCount: recentReadings?.length ?? 0,
        hasESP32Data: data !== null,
        currentESP32Data: data ? {
          voltage: data.voltage,
          current: data.current,
          power: data.power,
          energy: data.energy,
          frequency: data.frequency,
          powerFactor: data.powerFactor
        } : null,
        dateRange: {
          start: consumptionStartDate.toISOString(),
          end: consumptionEndDate.toISOString()
        },
        hourRange: { start: startHour, end: endHour }
      });
    }

    const startDate = new Date(consumptionStartDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(consumptionEndDate);
    endDate.setHours(23, 59, 59, 999);

    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const safeNumber = (value: any, fallback = 0) =>
      typeof value === 'number' && Number.isFinite(value) ? value : fallback;

    const computeDerivedEnergy = (avgPower: number, durationMs: number) => {
      if (!Number.isFinite(avgPower) || avgPower <= 0 || !Number.isFinite(durationMs) || durationMs <= 0) {
        return 0;
      }
      return (avgPower / 1000) * (durationMs / ONE_HOUR_MS);
    };

    const normalizeEnergyDelta = (measured: number, derived: number, expectedOverride?: number) => {
      const measuredSafe = Number.isFinite(measured) ? measured : 0;
      const derivedSafe = Number.isFinite(derived) ? derived : 0;
      const expected = Number.isFinite(expectedOverride ?? derivedSafe) ? (expectedOverride ?? derivedSafe) : derivedSafe;

      if (derivedSafe > 0 && (measuredSafe <= 0 || measuredSafe < derivedSafe * ENERGY_LOW_RATIO_THRESHOLD)) {
        return derivedSafe;
      }

      if (measuredSafe < 0) {
        return 0;
      }

      if (measuredSafe === 0 && derivedSafe > 0) {
        return derivedSafe;
      }

      return measuredSafe;
    };

    const getBucketDurationMs = (bucket: any) => {
      const first = typeof bucket.firstTimestamp === 'number' ? bucket.firstTimestamp : bucket.timestamp;
      const last = typeof bucket.lastTimestamp === 'number' ? bucket.lastTimestamp : first + SAMPLE_INTERVAL;
      const duration = last - first;

      if (!Number.isFinite(duration) || duration <= 0) {
        return SAMPLE_INTERVAL;
      }

      return Math.min(ONE_HOUR_MS, Math.max(SAMPLE_INTERVAL, duration));
    };

    const aggregateMap = new Map<number, any>();

    historicalData.forEach((aggregate: any) => {
      if (!aggregate?.timestamp) {
        return;
      }
      const ts = aggregate.timestamp as number;
      if (ts < startTime || ts > endTime) {
        return;
      }

      const powerAvg = safeNumber(aggregate.powerAvg);
      const sensorEnergy = safeNumber(aggregate.energyDelta);
      const expectedEnergy = computeDerivedEnergy(powerAvg, ONE_HOUR_MS);
      const energyDelta = normalizeEnergyDelta(sensorEnergy, expectedEnergy, expectedEnergy);

      aggregateMap.set(ts, {
        timestamp: ts,
        voltageAvg: safeNumber(aggregate.voltageAvg),
        voltageMin: safeNumber(aggregate.voltageMin),
        voltageMax: safeNumber(aggregate.voltageMax),
        currentAvg: safeNumber(aggregate.currentAvg),
        currentMax: safeNumber(aggregate.currentMax),
        powerAvg,
        powerMax: safeNumber(aggregate.powerMax),
        energyDelta,
        energySource: sensorEnergy > 0 && Math.abs(energyDelta - sensorEnergy) > 1e-6 ? 'derived' : 'sensor',
        frequencyAvg: safeNumber(aggregate.frequencyAvg),
        powerFactorAvg: safeNumber(aggregate.powerFactorAvg, 1),
        apparentPowerAvg: safeNumber(aggregate.apparentPowerAvg),
        reactivePowerAvg: safeNumber(aggregate.reactivePowerAvg),
        sampleCount: safeNumber(aggregate.sampleCount, 0),
      });
    });

    const minuteBuckets = new Map<number, {
      timestamp: number;
      voltageSum: number;
      voltageMin: number;
      voltageMax: number;
      currentSum: number;
      currentMax: number;
      powerSum: number;
      powerMax: number;
      frequencySum: number;
      powerFactorSum: number;
      apparentPowerSum: number;
      reactivePowerSum: number;
      energyStart: number | null;
      energyEnd: number | null;
      firstTimestamp: number | null;
      lastTimestamp: number | null;
      count: number;
    }>();

    recentReadings.forEach((reading: any) => {
      if (!reading?.timestamp) {
        return;
      }
      const ts = reading.timestamp as number;
      if (ts < startTime || ts > endTime) {
        return;
      }


      const hourStart = new Date(ts);
      hourStart.setMinutes(0, 0, 0);
      const bucketKey = hourStart.getTime();

      let bucket = minuteBuckets.get(bucketKey);
      if (!bucket) {
        bucket = {
          timestamp: bucketKey,
          voltageSum: 0,
          voltageMin: Number.POSITIVE_INFINITY,
          voltageMax: Number.NEGATIVE_INFINITY,
          currentSum: 0,
          currentMax: Number.NEGATIVE_INFINITY,
          powerSum: 0,
          powerMax: Number.NEGATIVE_INFINITY,
          frequencySum: 0,
          powerFactorSum: 0,
          apparentPowerSum: 0,
          reactivePowerSum: 0,
          energyStart: null,
          energyEnd: null,
          firstTimestamp: null,
          lastTimestamp: null,
          count: 0,
        };
        minuteBuckets.set(bucketKey, bucket);
      }

      if (bucket.firstTimestamp === null || ts < bucket.firstTimestamp) {
        bucket.firstTimestamp = ts;
      }
      if (bucket.lastTimestamp === null || ts > bucket.lastTimestamp) {
        bucket.lastTimestamp = ts;
      }

      const voltage = safeNumber(reading.voltage);
      bucket.voltageSum += voltage;
      bucket.voltageMin = Math.min(bucket.voltageMin, voltage);
      bucket.voltageMax = Math.max(bucket.voltageMax, voltage);

      const current = safeNumber(reading.current);
      bucket.currentSum += current;
      bucket.currentMax = Math.max(bucket.currentMax, current);

      const power = safeNumber(reading.power);
      bucket.powerSum += power;
      bucket.powerMax = Math.max(bucket.powerMax, power);

      bucket.frequencySum += safeNumber(reading.frequency);
      bucket.powerFactorSum += safeNumber(reading.powerFactor, 1);
      bucket.apparentPowerSum += safeNumber(reading.apparentPower);
      bucket.reactivePowerSum += safeNumber(reading.reactivePower);

      if (typeof reading.energy === 'number') {
        if (bucket.energyStart === null) {
          bucket.energyStart = reading.energy;
        }
        bucket.energyEnd = reading.energy;
      }

      bucket.count += 1;
    });

    const now = new Date();
    now.setMinutes(0, 0, 0);
    const currentHourStart = now.getTime();

    minuteBuckets.forEach((bucket) => {
      const count = bucket.count || 1;
      const avgPower = count > 0 ? bucket.powerSum / count : 0;
      const sensorEnergy =
        bucket.energyStart !== null && bucket.energyEnd !== null
          ? Math.max(0, bucket.energyEnd - bucket.energyStart)
          : 0;
      const durationMs = getBucketDurationMs(bucket);
      const derivedEnergy = computeDerivedEnergy(avgPower, durationMs);
      const energyDelta = normalizeEnergyDelta(sensorEnergy, derivedEnergy);

      const aggregateFromMinutes = {
        timestamp: bucket.timestamp,
        voltageAvg: bucket.voltageSum / count,
        voltageMin: safeNumber(bucket.voltageMin),
        voltageMax: safeNumber(bucket.voltageMax),
        currentAvg: bucket.currentSum / count,
        currentMax: safeNumber(bucket.currentMax),
        powerAvg: avgPower,
        powerMax: safeNumber(bucket.powerMax),
        energyDelta,
        energySource: sensorEnergy > 0 && Math.abs(energyDelta - sensorEnergy) > 1e-6 ? 'derived' : 'sensor',
        frequencyAvg: bucket.frequencySum / count,
        powerFactorAvg: bucket.powerFactorSum / count,
        apparentPowerAvg: bucket.apparentPowerSum / count,
        reactivePowerAvg: bucket.reactivePowerSum / count,
        sampleCount: bucket.count,
      };

      const existing = aggregateMap.get(bucket.timestamp);
      const isCurrentHour = bucket.timestamp === currentHourStart;

      if (!existing || isCurrentHour || (existing.sampleCount ?? 0) === 0) {
        aggregateMap.set(bucket.timestamp, aggregateFromMinutes);
      }
    });

    const isWithinHourRange = (hour: number) => {
      // Default case: 0 to 23 should show all hours
      if (startHour === 0 && endHour === 23) {
        return true; // Show all 24 hours
      }
      // If same hour selected (e.g., 5 to 5), show only that hour
      if (startHour === endHour) {
        return hour === startHour;
      }
      // Normal range within a day (e.g., 5 to 10)
      if (startHour < endHour) {
        return hour >= startHour && hour <= endHour;
      }
      // Wraps around midnight (e.g., 22 to 3)
      return hour >= startHour || hour <= endHour;
    };

    let combined = Array.from(aggregateMap.values())
      .filter((aggregate) => {
        if (!aggregate?.timestamp) {
          return false;
        }
        const hour = new Date(aggregate.timestamp).getHours();
        return isWithinHourRange(hour);
      })
      .map((aggregate) => {
        const date = new Date(aggregate.timestamp);
        const hour = date.getHours();
        const energyKWh = Math.max(0, safeNumber(aggregate.energyDelta));
        return {
          date: date.toISOString().split('T')[0],
          hour: `${hour.toString().padStart(2, '0')}:00`,
          hourValue: hour,
          kWh: energyKWh,
          timestamp: aggregate.timestamp,
          voltageAvg: safeNumber(aggregate.voltageAvg),
          currentAvg: safeNumber(aggregate.currentAvg),
          powerAvg: safeNumber(aggregate.powerAvg),
          powerFactorAvg: safeNumber(aggregate.powerFactorAvg, 1),
          frequencyAvg: safeNumber(aggregate.frequencyAvg, 50),
          energySource: aggregate.energySource ?? 'sensor',
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    if (combined.length === 0 && data) {
      const timestamp = typeof data.timestamp === 'number' ? data.timestamp : Date.now();
      const clamped = Math.min(Math.max(timestamp, startTime), endTime);
      const fallbackDate = new Date(clamped);
      fallbackDate.setMinutes(0, 0, 0);
      const hour = fallbackDate.getHours();

      if (isWithinHourRange(hour)) {
        combined = [{
          date: fallbackDate.toISOString().split('T')[0],
          hour: `${hour.toString().padStart(2, '0')}:00`,
          hourValue: hour,
          kWh: 0,
          timestamp: fallbackDate.getTime(),
          voltageAvg: safeNumber((data as any)?.voltage),
          currentAvg: safeNumber((data as any)?.current),
          powerAvg: safeNumber((data as any)?.power),
          powerFactorAvg: safeNumber((data as any)?.powerFactor, 1),
          frequencyAvg: safeNumber((data as any)?.frequency, 50),
          energySource: 'sensor',
        }];
      }
    }

    const energyDiagnostics = combined.reduce((acc, item) => {
      if (item.energySource === 'derived') {
        acc.derivedCount += 1;
        acc.derivedTotal += item.kWh;
      } else {
        acc.sensorCount += 1;
        acc.sensorTotal += item.kWh;
      }
      return acc;
    }, { derivedCount: 0, sensorCount: 0, derivedTotal: 0, sensorTotal: 0 });

    console.log('🚨🚨🚨 EMERGENCY DEBUG - CHART DATA:', {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      hourRange: { start: startHour, end: endHour },
      historicalDataCount: historicalData?.length ?? 0,
      recentReadingsCount: recentReadings?.length ?? 0,
      aggregateMapSize: aggregateMap.size,
      minuteBucketsSize: minuteBuckets.size,
      combinedLength: combined.length,
      firstCombined: combined[0],
      lastCombined: combined[combined.length - 1],
      allCombinedKWhZero: combined.every(c => c.kWh === 0),
      energyDiagnostics,
      currentESP32Data: data ? {
        voltage: data.voltage,
        current: data.current,
        power: data.power,
        energy: data.energy
      } : 'NO DATA'
    });

    return combined;
  }, [
    isReady,
    consumptionStartDate,
    consumptionEndDate,
    startHour,
    endHour,
    historicalData,
    recentReadings,
    data,
  ]);

  // Get ESP32 readings from history store for charts
  const filteredRecentReadings = useMemo(() => {
    // Use ONLY recentReadings (last 24 hours of real ESP32 data at 2-second intervals)
    if (!recentReadings || recentReadings.length === 0) {
      console.log('⚠️ NO DATA: recentReadings is empty');
      return [];
    }

    console.log(`📊 CHART SOURCE: Using ${recentReadings.length} readings from history store`);

    // Return ALL recent readings for charts - no filtering
    // This ensures charts show real-time ESP32 data
    return recentReadings;
  }, [recentReadings]);

  // Extract real ESP32 parameter values for charts
  const voltageData = useMemo(
    () => filteredRecentReadings.map((r: any) => r.voltage || 0),
    [filteredRecentReadings]
  );

  const currentTrendData = useMemo(
    () => filteredRecentReadings.map((r: any) => r.current || 0),
    [filteredRecentReadings]
  );

  const powerData = useMemo(
    () => filteredRecentReadings.map((r: any) => r.power || 0),
    [filteredRecentReadings]
  );

  const powerFactorData = useMemo(
    () => filteredRecentReadings.map((r: any) => r.powerFactor || 0),
    [filteredRecentReadings]
  );

  const frequencyData = useMemo(
    () => filteredRecentReadings.map((r: any) => r.frequency || 0),
    [filteredRecentReadings]
  );

  // Extract timestamps for timeline
  const timestamps = useMemo(
    () => filteredRecentReadings.map((r: any) => r.timestamp),
    [filteredRecentReadings]
  );

  // Stats calculations with FIXED SCALES to show true variations
  // CRITICAL FIX: Using fixed min/max prevents auto-scaling that makes all charts look identical
  // EDGE CASE FIX: Using 0 as minimum prevents off-screen rendering during outages/no-load

  const voltageStats = useMemo(() => {
    if (voltageData.length === 0) return { has: false } as const;
    const arr = voltageData;
    const sum = arr.reduce((a, b) => a + b, 0);
    return {
      has: true,
      min: 0,    // Fixed scale: 0-260V (shows voltage variations, allows outage display at bottom)
      max: 260,
      avg: sum / arr.length
    } as const;
  }, [voltageData]);

  const currentStats = useMemo(() => {
    if (currentTrendData.length === 0) return { has: false } as const;
    const arr = currentTrendData;
    const sum = arr.reduce((a, b) => a + b, 0);
    return {
      has: true,
      min: 0,    // Fixed scale: 0-20A (shows current variations clearly)
      max: 20,
      avg: sum / arr.length
    } as const;
  }, [currentTrendData]);

  const powerStats = useMemo(() => {
    if (powerData.length === 0) return { has: false } as const;
    const arr = powerData;
    const sum = arr.reduce((a, b) => a + b, 0);
    return {
      has: true,
      min: 0,     // Fixed scale: 0-5000W (shows power variations clearly)
      max: 5000,
      avg: sum / arr.length
    } as const;
  }, [powerData]);

  const powerFactorStats = useMemo(() => {
    if (powerFactorData.length === 0) return { has: false } as const;
    const arr = powerFactorData;
    const sum = arr.reduce((a, b) => a + b, 0);
    return {
      has: true,
      min: 0,     // Fixed scale: 0-1.0 (shows PF variations, allows no-load display at bottom)
      max: 1.0,
      avg: sum / arr.length
    } as const;
  }, [powerFactorData]);

  const frequencyStats = useMemo(() => {
    if (frequencyData.length === 0) return { has: false } as const;
    const arr = frequencyData;
    const sum = arr.reduce((a, b) => a + b, 0);
    return {
      has: true,
      min: 0,     // Fixed scale: 0-52Hz (shows frequency variations, allows outage display at bottom)
      max: 52,
      avg: sum / arr.length
    } as const;
  }, [frequencyData]);

  // PERFORMANCE: Memoize chart data with RTL support
  const voltageChartData = useMemo(() =>
    isRTL ? voltageData.slice().reverse() : voltageData,
    [voltageData, isRTL]
  );
  const currentChartData = useMemo(() =>
    isRTL ? currentTrendData.slice().reverse() : currentTrendData,
    [currentTrendData, isRTL]
  );
  const powerChartData = useMemo(() =>
    isRTL ? powerData.slice().reverse() : powerData,
    [powerData, isRTL]
  );
  const powerFactorChartData = useMemo(() =>
    isRTL ? powerFactorData.slice().reverse() : powerFactorData,
    [powerFactorData, isRTL]
  );
  const frequencyChartData = useMemo(() =>
    isRTL ? frequencyData.slice().reverse() : frequencyData,
    [frequencyData, isRTL]
  );

  const hourLabel = useMemo(() => {
    if (hourlyConsumption.length === 0) return [];

    const labels = hourlyConsumption
      .slice(0, 50)
      .filter((_: any, idx: number) => idx % 2 === 0)
      .map((item: any) => {
        if (isMultipleDays) {
          return `${item.date.slice(5)} ${item.hour}`;
        }
        return item.hour;
      });

    return isRTL ? labels.reverse() : labels;
  }, [hourlyConsumption, isMultipleDays, isRTL]);

  // PERFORMANCE: Memoize consumption data and calculations
  const { currentData, maxConsumption, totalConsumption, avgConsumption } = useMemo(() => {
    const data = hourlyConsumption.map((item) => ({
      ...item,
      label: isMultipleDays ? `${item.date.slice(5)} ${item.hour}` : item.hour
    }));

    const total = data.reduce((sum: number, d: any) => sum + d.kWh, 0);
    const max = Math.max(...data.map((d: any) => d.kWh), 0);

    console.log('🔥🔥🔥 BAR CHART DATA:', {
      dataCount: data.length,
      totalConsumption: total,
      maxConsumption: max,
      hasData: data.length > 0,
      allZero: data.every((d: any) => d.kWh === 0),
      first3Items: data.slice(0, 3),
      last3Items: data.slice(-3),
      passedToBarChart: { dataLength: data.length, maxValue: max }
    });

    return {
      currentData: data,
      maxConsumption: Math.max(...data.map((d: any) => d.kWh)),
      totalConsumption: total,
      avgConsumption: data.length > 0 ? total / data.length : 0
    };
  }, [hourlyConsumption, isMultipleDays]);

  // Safety event types
  const safetyEventTypes: Array<{ label: string; value: EventType; icon: string }> = [
    { label: t('events.safetyFilter.types.overvoltage'), value: 'overvoltage', icon: 'arrow-up-circle' },
    { label: t('events.safetyFilter.types.undervoltage'), value: 'undervoltage', icon: 'arrow-down-circle' },
    { label: t('events.safetyFilter.types.overload'), value: 'overload', icon: 'warning' },
    { label: t('events.safetyFilter.types.underload'), value: 'underload', icon: 'arrow-down' },
    { label: t('events.safetyFilter.types.outage'), value: 'outage', icon: 'flash-off' },
    { label: t('events.safetyFilter.types.frequencyMin'), value: 'frequency_min', icon: 'pulse' },
    { label: t('events.safetyFilter.types.frequencyMax'), value: 'frequency_max', icon: 'pulse' },
    { label: t('events.safetyFilter.types.powerFactorLow'), value: 'power_factor_min', icon: 'analytics' },
  ];

  // PERFORMANCE: Use callbacks for event handlers
  const toggleEventType = useCallback((type: EventType) => {
    setSelectedEventTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }, []);

  // Format date for display
  const formatDateLabel = useCallback((date: Date) => formatDate(date.getTime()), []);
  const formatTimeLabel = useCallback((date: Date) => formatTime(date.getTime()), []);

  // PERFORMANCE: Memoized event handlers
  const onStartDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setPendingEventStartDate(selectedDate);
      setHasEventPendingChanges(true);
    }
  }, []);

  const onEndDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setPendingEventEndDate(selectedDate);
      setHasEventPendingChanges(true);
    }
  }, []);

  // Apply event filter changes
  const handleApplyEventFilters = useCallback(() => {
    setStartDate(pendingEventStartDate);
    setEndDate(pendingEventEndDate);
    setHasEventPendingChanges(false);
    setShowEventFilterModal(false);
  }, [pendingEventStartDate, pendingEventEndDate]);

  // Cancel event filter changes
  const handleCancelEventFilters = useCallback(() => {
    setPendingEventStartDate(startDate);
    setPendingEventEndDate(endDate);
    setHasEventPendingChanges(false);
    setShowEventFilterModal(false);
  }, [startDate, endDate]);

  const onConsumptionStartDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowConsumptionStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setPendingStartDate(selectedDate);
      setHasPendingChanges(true);
    }
  }, []);

  const onConsumptionEndDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowConsumptionEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setPendingEndDate(selectedDate);
      setHasPendingChanges(true);
    }
  }, []);

  // Hour range handlers
  const handleStartHourChange = useCallback((hour: number) => {
    setPendingStartHour(hour);
    setHasPendingChanges(true);
  }, []);

  const handleEndHourChange = useCallback((hour: number) => {
    setPendingEndHour(hour);
    setHasPendingChanges(true);
  }, []);

  // Apply consumption filter changes
  const handleApplyFilters = useCallback(() => {
    setConsumptionStartDate(pendingStartDate);
    setConsumptionEndDate(pendingEndDate);
    setStartHour(pendingStartHour);
    setEndHour(pendingEndHour);
    setHasPendingChanges(false);
    setShowDateRangeModal(false);
    setShowHourRangeModal(false);
  }, [pendingStartDate, pendingEndDate, pendingStartHour, pendingEndHour]);

  // Cancel filter changes
  const handleCancelFilters = useCallback(() => {
    setPendingStartDate(consumptionStartDate);
    setPendingEndDate(consumptionEndDate);
    setPendingStartHour(startHour);
    setPendingEndHour(endHour);
    setHasPendingChanges(false);
    setShowDateRangeModal(false);
    setShowHourRangeModal(false);
  }, [consumptionStartDate, consumptionEndDate, startHour, endHour]);

  const daysDifference = Math.ceil((consumptionEndDate.getTime() - consumptionStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const isMultipleDays = daysDifference > 1;

  const loadMoreEvents = useCallback(() => {
    setEventsToShow(prev => prev + EVENTS_PER_PAGE);
  }, []);

  if (!isReady) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
          <Text style={[styles.loadingText, { color: themeColors.text.primary }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: themeColors.surface }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'consumption' && styles.activeTab,
              activeTab === 'consumption' && { backgroundColor: themeColors.primary }
            ]}
            onPress={() => setActiveTab('consumption')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'consumption' ? '#FFFFFF' : themeColors.text.secondary }
              ]}
            >
              {t('events.tabs.consumption')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'eventLog' && styles.activeTab,
              activeTab === 'eventLog' && { backgroundColor: themeColors.primary }
            ]}
            onPress={() => setActiveTab('eventLog')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'eventLog' ? '#FFFFFF' : themeColors.text.secondary }
              ]}
            >
              {t('events.tabs.eventLog')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'consumption' ? (
            <>
              {/* Consumption Bar Chart Section */}
              <ConsumptionOverview
                themeColors={themeColors}
                t={t}
                formatDateLabel={formatDateLabel}
                formatEnergy={formatEnergy}
                consumptionStartDate={consumptionStartDate}
                consumptionEndDate={consumptionEndDate}
                startHour={startHour}
                endHour={endHour}
                totalConsumption={totalConsumption}
                currentData={currentData}
                maxConsumption={maxConsumption}
                avgConsumption={avgConsumption}
                daysDifference={daysDifference}
                isMultipleDays={isMultipleDays}
                currentHour={currentHour}
                onDateRangePress={() => setShowDateRangeModal(true)}
                onHourRangePress={() => setShowHourRangeModal(true)}
              />

              {/* Parameter Trends Section */}
              <Card style={[styles.trendsCard, { backgroundColor: themeColors.surface }]}>
                <View style={styles.trendsHeader}>
                  <MaterialCommunityIcons name="chart-line" size={24} color={themeColors.primary} />
                  <Text style={[styles.sectionTitle, { color: themeColors.text.primary, marginBottom: 0, marginLeft: spacing.sm }]}>
                    {t('events.graphs.title')}
                  </Text>
                </View>
                <Text style={[styles.sectionSubtitle, { color: themeColors.text.secondary }]}>
                  {t('events.graphs.subtitle')}
                </Text>

                {/* Voltage Trend Chart */}
                <View style={styles.chartWrapper}>
                  <View style={styles.chartTitleRow}>
                    <MaterialCommunityIcons name="flash" size={20} color="#42A5F5" />
                    <Text style={[styles.chartTitle, { color: themeColors.text.primary }]}>
                      {t('events.graphs.voltage.title')}
                    </Text>
                  </View>

                  {/* Voltage Stats (if data exists) */}
                  {voltageStats.has && (
                    <View style={styles.statsRow}>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
                          {t('events.graphs.stats.max')}
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.danger }]}>
                          {voltageStats.max.toFixed(1)}{t('home.units.voltage')}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
                          {t('events.graphs.stats.avg')}
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.text.primary }]}>
                          {voltageStats.avg.toFixed(1)}{t('home.units.voltage')}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
                          {t('events.graphs.stats.min')}
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.success }]}>
                          {voltageStats.min.toFixed(1)}{t('home.units.voltage')}
                        </Text>
                      </View>
                    </View>
                  )}

                  <SkiaLineChart
                    data={voltageChartData}
                    timestamps={isRTL ? [...timestamps].reverse() : timestamps}
                    title=""
                    color="#42A5F5"
                    unit={t('home.units.voltage')}
                    height={220}
                    animated={true}
                    theme={theme}
                    showStats={false}
                    showTimeline={true}
                    showYAxis={true}
                    min={voltageStats.has ? voltageStats.min : undefined}
                    max={voltageStats.has ? voltageStats.max : undefined}
                    average={voltageStats.has ? voltageStats.avg : undefined}
                  />
                </View>

                {/* Current Trend Chart */}
                <View style={styles.chartWrapper}>
                  <View style={styles.chartTitleRow}>
                    <MaterialCommunityIcons name="current-ac" size={20} color="#FFA726" />
                    <Text style={[styles.chartTitle, { color: themeColors.text.primary }]}>
                      {t('events.graphs.current.title')}
                    </Text>
                  </View>

                  {/* Current Stats */}
                  {currentStats.has && (
                    <View style={styles.statsRow}>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
                          {t('events.graphs.stats.max')}
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.danger }]}>
                          {currentStats.max.toFixed(2)}{t('home.units.current')}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
                          {t('events.graphs.stats.avg')}
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.text.primary }]}>
                          {currentStats.avg.toFixed(2)}{t('home.units.current')}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
                          {t('events.graphs.stats.min')}
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.success }]}>
                          {currentStats.min.toFixed(2)}{t('home.units.current')}
                        </Text>
                      </View>
                    </View>
                  )}

                  <SkiaLineChart
                    data={currentChartData}
                    timestamps={isRTL ? [...timestamps].reverse() : timestamps}
                    title=""
                    color="#FFA726"
                    unit={t('home.units.current')}
                    height={220}
                    animated={true}
                    theme={theme}
                    showStats={false}
                    showTimeline={true}
                    showYAxis={true}
                    min={currentStats.has ? currentStats.min : undefined}
                    max={currentStats.has ? currentStats.max : undefined}
                    average={currentStats.has ? currentStats.avg : undefined}
                  />
                </View>

                {/* Power Trend Chart */}
                <View style={styles.chartWrapper}>
                  <View style={styles.chartTitleRow}>
                    <MaterialCommunityIcons name="power-plug" size={20} color="#66BB6A" />
                    <Text style={[styles.chartTitle, { color: themeColors.text.primary }]}>
                      {t('events.graphs.power.title')}
                    </Text>
                  </View>

                  {/* Power Stats */}
                  {powerStats.has && (
                    <View style={styles.statsRow}>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
                          {t('events.graphs.stats.max')}
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.danger }]}>
                          {powerStats.max.toFixed(0)}{t('home.units.power')}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
                          {t('events.graphs.stats.avg')}
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.text.primary }]}>
                          {powerStats.avg.toFixed(0)}{t('home.units.power')}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
                          {t('events.graphs.stats.min')}
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.success }]}>
                          {powerStats.min.toFixed(0)}{t('home.units.power')}
                        </Text>
                      </View>
                    </View>
                  )}

                  <SkiaLineChart
                    data={powerChartData}
                    timestamps={isRTL ? [...timestamps].reverse() : timestamps}
                    title=""
                    color="#66BB6A"
                    unit={t('home.units.power')}
                    height={220}
                    animated={true}
                    theme={theme}
                    showStats={false}
                    showTimeline={true}
                    showYAxis={true}
                    min={powerStats.has ? powerStats.min : undefined}
                    max={powerStats.has ? powerStats.max : undefined}
                    average={powerStats.has ? powerStats.avg : undefined}
                  />
                </View>

                {/* Power Factor Chart */}
                <View style={styles.chartWrapper}>
                  <View style={styles.chartTitleRow}>
                    <MaterialCommunityIcons name="sine-wave" size={20} color="#AB47BC" />
                    <Text style={[styles.chartTitle, { color: themeColors.text.primary }]}>
                      {t('events.graphs.powerFactor.title')}
                    </Text>
                  </View>

                  {/* Power Factor Stats */}
                  {powerFactorStats.has && (
                    <View style={styles.statsRow}>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
                          {t('events.graphs.stats.max')}
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.success }]}>
                          {powerFactorStats.max.toFixed(3)}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
                          {t('events.graphs.stats.avg')}
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.text.primary }]}>
                          {powerFactorStats.avg.toFixed(3)}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
                          {t('events.graphs.stats.min')}
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.warning }]}>
                          {powerFactorStats.min.toFixed(3)}
                        </Text>
                      </View>
                    </View>
                  )}

                  <SkiaLineChart
                    data={powerFactorChartData}
                    timestamps={isRTL ? [...timestamps].reverse() : timestamps}
                    title=""
                    color="#AB47BC"
                    unit=""
                    height={220}
                    animated={true}
                    theme={theme}
                    showStats={false}
                    showTimeline={true}
                    showYAxis={true}
                    min={powerFactorStats.has ? powerFactorStats.min : undefined}
                    max={powerFactorStats.has ? powerFactorStats.max : undefined}
                    average={powerFactorStats.has ? powerFactorStats.avg : undefined}
                  />
                </View>

                {/* Frequency Chart */}
                <View style={styles.chartWrapper}>
                  <View style={styles.chartTitleRow}>
                    <MaterialCommunityIcons name="waveform" size={20} color="#26C6DA" />
                    <Text style={[styles.chartTitle, { color: themeColors.text.primary }]}>
                      {t('events.graphs.frequency.title')}
                    </Text>
                  </View>

                  {/* Frequency Stats */}
                  {frequencyStats.has && (
                    <View style={styles.statsRow}>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
                          {t('events.graphs.stats.max')}
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.danger }]}>
                          {frequencyStats.max.toFixed(2)}{t('home.units.frequency')}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
                          {t('events.graphs.stats.avg')}
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.text.primary }]}>
                          {frequencyStats.avg.toFixed(2)}{t('home.units.frequency')}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
                          {t('events.graphs.stats.min')}
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.success }]}>
                          {frequencyStats.min.toFixed(2)}{t('home.units.frequency')}
                        </Text>
                      </View>
                    </View>
                  )}

                  <SkiaLineChart
                    data={frequencyChartData}
                    timestamps={isRTL ? [...timestamps].reverse() : timestamps}
                    title=""
                    color="#26C6DA"
                    unit={t('home.units.frequency')}
                    height={220}
                    animated={true}
                    theme={theme}
                    showStats={false}
                    showTimeline={true}
                    showYAxis={true}
                    min={frequencyStats.has ? frequencyStats.min : undefined}
                    max={frequencyStats.has ? frequencyStats.max : undefined}
                    average={frequencyStats.has ? frequencyStats.avg : undefined}
                  />
                </View>
              </Card>
            </>
          ) : (
            <>
              {/* System Events Statistics */}
              <Card style={[styles.statsCard, { backgroundColor: themeColors.surface }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                  {t('events.statistics.title')}
                </Text>

                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <MaterialCommunityIcons name="alert-circle" size={28} color={themeColors.primary} />
                    <Text style={[styles.statNumber, { color: themeColors.text.primary }]}>
                      {stats.totalEvents}
                    </Text>
                    <Text style={[styles.statDescription, { color: themeColors.text.secondary }]}>
                      {t('events.statistics.totalEvents')}
                    </Text>
                  </View>

                  <View style={styles.statCard}>
                    <MaterialCommunityIcons name="flash-off" size={28} color={themeColors.danger} />
                    <Text style={[styles.statNumber, { color: themeColors.text.primary }]}>
                      {stats.totalOutages}
                    </Text>
                    <Text style={[styles.statDescription, { color: themeColors.text.secondary }]}>
                      {t('events.statistics.outages')}
                    </Text>
                  </View>

                  <View style={styles.statCard}>
                    <MaterialCommunityIcons name="clock-outline" size={28} color={themeColors.warning} />
                    <Text style={[styles.statNumber, { color: themeColors.text.primary }]}>
                      {formatDurationShort(stats.averageOutageDuration)}
                    </Text>
                    <Text style={[styles.statDescription, { color: themeColors.text.secondary }]}>
                      {t('events.statistics.avgDuration')}
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Event Filter Button */}
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: themeColors.surface }]}
                onPress={() => setShowEventFilterModal(true)}
              >
                <Ionicons name="filter" size={20} color={themeColors.primary} />
                <Text style={[styles.filterChipText, { color: themeColors.text.primary }]}>
                  {t('common.filter')}
                </Text>
              </TouchableOpacity>

              {/* Events List */}
              <Card style={[styles.eventsCard, { backgroundColor: themeColors.surface }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                  {t('events.eventsList.title')}
                </Text>

                {events.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={48} color={themeColors.text.secondary} />
                    <Text style={[styles.emptyText, { color: themeColors.text.secondary }]}>
                      {t('events.eventsList.empty')}
                    </Text>
                  </View>
                ) : (
                  <>
                    {events.slice(0, eventsToShow).map((event, index) => (
                      <TouchableOpacity
                        key={`${event.id}-${index}`}
                        style={[
                          styles.eventCard,
                          { backgroundColor: themeColors.background, borderLeftColor: getEventColor(event.type) }
                        ]}
                      >
                        <View style={styles.eventHeader}>
                          <View style={styles.eventIconContainer}>
                            <Ionicons name={getEventIcon(event.type)} size={20} color={getEventColor(event.type)} />
                          </View>
                          <View style={styles.eventInfo}>
                            <Text style={[styles.eventType, { color: themeColors.text.primary }]}>
                              {translateEventDescription(event, t)}
                            </Text>
                            <Text style={[styles.eventTime, { color: themeColors.text.secondary }]}>
                              {formatTimestamp(event.timestamp)}
                            </Text>
                          </View>
                        </View>

                        {event.duration && (
                          <View style={styles.eventDuration}>
                            <Ionicons name="time-outline" size={14} color={themeColors.text.secondary} />
                            <Text style={[styles.durationText, { color: themeColors.text.secondary }]}>
                              {formatDurationShort(event.duration)}
                            </Text>
                          </View>
                        )}

                        {/* Electrical Readings - Compact */}
                        {event.readings && (
                          <View style={styles.readingsCompact}>
                            <View style={styles.readingCompactItem}>
                              <MaterialCommunityIcons name="flash" size={12} color="#42A5F5" />
                              <Text style={[styles.readingCompactValue, { color: themeColors.text.secondary }]}>
                                {formatVoltage(event.readings.voltage)}
                              </Text>
                            </View>

                            <View style={styles.readingCompactItem}>
                              <MaterialCommunityIcons name="current-ac" size={12} color="#FFA726" />
                              <Text style={[styles.readingCompactValue, { color: themeColors.text.secondary }]}>
                                {formatCurrent(event.readings.current)}
                              </Text>
                            </View>

                            <View style={styles.readingCompactItem}>
                              <MaterialCommunityIcons name="waveform" size={12} color="#26C6DA" />
                              <Text style={[styles.readingCompactValue, { color: themeColors.text.secondary }]}>
                                {formatFrequency(event.readings.frequency)}
                              </Text>
                            </View>

                            <View style={styles.readingCompactItem}>
                              <MaterialCommunityIcons name="sine-wave" size={12} color="#AB47BC" />
                              <Text style={[styles.readingCompactValue, { color: themeColors.text.secondary }]}>
                                {formatPowerFactor(event.readings.powerFactor)}
                              </Text>
                            </View>

                            <View style={styles.readingCompactItem}>
                              <MaterialCommunityIcons name="lightning-bolt" size={12} color="#66BB6A" />
                              <Text style={[styles.readingCompactValue, { color: themeColors.text.secondary }]}>
                                {formatEnergy(event.readings.energy)}
                              </Text>
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}

                    {eventsToShow < events.length && (
                      <TouchableOpacity
                        style={[styles.loadMoreButton, { backgroundColor: themeColors.primary }]}
                        onPress={loadMoreEvents}
                      >
                        <Text style={styles.loadMoreText}>
                          {t('events.loadMore', { showing: eventsToShow, total: events.length })}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </Card>
            </>
          )}
        </ScrollView>

        {/* Date Range Modal */}
        {showDateRangeModal && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: themeColors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColors.text.primary }]}>
                  {t('events.dateFilter.title')}
                </Text>
                <TouchableOpacity onPress={() => {
                  handleCancelFilters();
                }}>
                  <Ionicons name="close" size={24} color={themeColors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                {/* Start Date Picker */}
                <View style={styles.pickerRow}>
                  <Text style={[styles.pickerLabel, { color: themeColors.text.secondary }]}>
                    {t('events.dateFilter.from')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
                    onPress={() => setShowConsumptionStartPicker(true)}
                  >
                    <Text style={[styles.dateButtonText, { color: themeColors.text.primary }]}>
                      {formatDateLabel(pendingStartDate)}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={themeColors.primary} />
                  </TouchableOpacity>
                </View>

                {showConsumptionStartPicker && (
                  <DateTimePicker
                    value={pendingStartDate}
                    mode="date"
                    display="default"
                    onChange={onConsumptionStartDateChange}
                    maximumDate={new Date()}
                  />
                )}

                {/* End Date Picker */}
                <View style={styles.pickerRow}>
                  <Text style={[styles.pickerLabel, { color: themeColors.text.secondary }]}>
                    {t('events.dateFilter.to')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
                    onPress={() => setShowConsumptionEndPicker(true)}
                  >
                    <Text style={[styles.dateButtonText, { color: themeColors.text.primary }]}>
                      {formatDateLabel(pendingEndDate)}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={themeColors.primary} />
                  </TouchableOpacity>
                </View>

                {showConsumptionEndPicker && (
                  <DateTimePicker
                    value={pendingEndDate}
                    mode="date"
                    display="default"
                    onChange={onConsumptionEndDateChange}
                    minimumDate={pendingStartDate}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              {/* Apply/Cancel Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: themeColors.background }]}
                  onPress={handleCancelFilters}
                >
                  <Text style={[styles.cancelButtonText, { color: themeColors.text.secondary }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.applyButton, { backgroundColor: themeColors.primary }]}
                  onPress={handleApplyFilters}
                  disabled={!hasPendingChanges}
                >
                  <Text style={[styles.applyButtonText, { opacity: hasPendingChanges ? 1 : 0.5 }]}>
                    {t('common.apply')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Hour Range Modal */}
        {showHourRangeModal && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: themeColors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColors.text.primary }]}>
                  {t('events.consumption.hourRange')}
                </Text>
                <TouchableOpacity onPress={() => {
                  handleCancelFilters();
                }}>
                  <Ionicons name="close" size={24} color={themeColors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                {/* Start Hour Picker */}
                <View style={styles.pickerRow}>
                  <Text style={[styles.pickerLabel, { color: themeColors.text.secondary }]}>
                    {t('common.from')}
                  </Text>
                  <ScrollView style={[styles.hourPickerContainer, { backgroundColor: themeColors.background, borderColor: themeColors.border }]} nestedScrollEnabled={true}>
                    {[...Array(24)].map((_, hour) => (
                      <TouchableOpacity
                        key={`start-${hour}`}
                        style={[
                          styles.hourOption,
                          pendingStartHour === hour && { backgroundColor: themeColors.primary }
                        ]}
                        onPress={() => handleStartHourChange(hour)}
                      >
                        <Text style={[
                          styles.hourText,
                          { color: pendingStartHour === hour ? '#FFFFFF' : themeColors.text.primary }
                        ]}>
                          {hour.toString().padStart(2, '0')}:00
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* End Hour Picker */}
                <View style={styles.pickerRow}>
                  <Text style={[styles.pickerLabel, { color: themeColors.text.secondary }]}>
                    {t('common.to')}
                  </Text>
                  <ScrollView style={[styles.hourPickerContainer, { backgroundColor: themeColors.background, borderColor: themeColors.border }]} nestedScrollEnabled={true}>
                    {[...Array(24)].map((_, hour) => (
                      <TouchableOpacity
                        key={`end-${hour}`}
                        style={[
                          styles.hourOption,
                          pendingEndHour === hour && { backgroundColor: themeColors.primary }
                        ]}
                        onPress={() => handleEndHourChange(hour)}
                      >
                        <Text style={[
                          styles.hourText,
                          { color: pendingEndHour === hour ? '#FFFFFF' : themeColors.text.primary }
                        ]}>
                          {hour.toString().padStart(2, '0')}:00
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Apply/Cancel Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: themeColors.background }]}
                  onPress={handleCancelFilters}
                >
                  <Text style={[styles.cancelButtonText, { color: themeColors.text.secondary }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.applyButton, { backgroundColor: themeColors.primary }]}
                  onPress={handleApplyFilters}
                  disabled={!hasPendingChanges}
                >
                  <Text style={[styles.applyButtonText, { opacity: hasPendingChanges ? 1 : 0.5 }]}>
                    {t('common.apply')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Event Filter Modal */}
        {showEventFilterModal && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: themeColors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColors.text.primary }]}>
                  {t('events.dateFilter.title')}
                </Text>
                <TouchableOpacity onPress={handleCancelEventFilters}>
                  <Ionicons name="close" size={24} color={themeColors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                {/* Start Date Picker */}
                <View style={styles.pickerRow}>
                  <Text style={[styles.pickerLabel, { color: themeColors.text.secondary }]}>
                    {t('events.dateFilter.from')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Text style={[styles.dateButtonText, { color: themeColors.text.primary }]}>
                      {formatDateLabel(pendingEventStartDate)}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={themeColors.primary} />
                  </TouchableOpacity>
                </View>

                {showStartPicker && (
                  <DateTimePicker
                    value={pendingEventStartDate}
                    mode="date"
                    display="default"
                    onChange={onStartDateChange}
                    maximumDate={new Date()}
                  />
                )}

                {/* End Date Picker */}
                <View style={styles.pickerRow}>
                  <Text style={[styles.pickerLabel, { color: themeColors.text.secondary }]}>
                    {t('events.dateFilter.to')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <Text style={[styles.dateButtonText, { color: themeColors.text.primary }]}>
                      {formatDateLabel(pendingEventEndDate)}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={themeColors.primary} />
                  </TouchableOpacity>
                </View>

                {showEndPicker && (
                  <DateTimePicker
                    value={pendingEventEndDate}
                    mode="date"
                    display="default"
                    onChange={onEndDateChange}
                    minimumDate={pendingEventStartDate}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              {/* Apply/Cancel Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: themeColors.background }]}
                  onPress={handleCancelEventFilters}
                >
                  <Text style={[styles.cancelButtonText, { color: themeColors.text.secondary }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.applyButton, { backgroundColor: themeColors.primary }]}
                  onPress={handleApplyEventFilters}
                  disabled={!hasEventPendingChanges}
                >
                  <Text style={[styles.applyButtonText, { opacity: hasEventPendingChanges ? 1 : 0.5 }]}>
                    {t('common.apply')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.large,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  activeTab: {
    // backgroundColor set dynamically
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  consumptionCard: {
    borderRadius: borderRadius.xlarge,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  consumptionHeader: {
    marginBottom: spacing.md,
  },
  consumptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  filterButtonsRow: {
    flexDirection: 'column',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    gap: spacing.sm,
  },
  filterButtonContent: {
    flex: 1,
    minWidth: 0,
  },
  filterButtonLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  filterButtonValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    minHeight: 32,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  energyStatsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  energyStatCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.large,
    minHeight: 120,
    justifyContent: 'center',
  },
  energyStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: spacing.xs,
  },
  energyStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  chartContainer: {
    marginTop: spacing.sm,
  },
  trendsCard: {
    borderRadius: borderRadius.xlarge,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  trendsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  chartWrapper: {
    marginTop: spacing.lg,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsCard: {
    borderRadius: borderRadius.xlarge,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: spacing.xs,
  },
  statDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  filterChipText: {
    marginLeft: spacing.xs,
    fontSize: 14,
    fontWeight: '600',
  },
  eventsCard: {
    borderRadius: borderRadius.xlarge,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 14,
  },
  eventCard: {
    borderLeftWidth: 4,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIconContainer: {
    marginRight: spacing.sm,
  },
  eventInfo: {
    flex: 1,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 12,
  },
  eventDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  durationText: {
    fontSize: 12,
  },
  readingsCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  readingCompactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readingCompactValue: {
    fontSize: 10,
    fontWeight: '500',
  },
  loadMoreButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    maxWidth: 400,
    borderRadius: borderRadius.xlarge,
    padding: spacing.lg,
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    marginBottom: spacing.md,
  },
  pickerRow: {
    marginBottom: spacing.md,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hourPickerContainer: {
    maxHeight: 200,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    padding: spacing.xs,
  },
  hourOption: {
    padding: spacing.sm,
    borderRadius: borderRadius.small,
    marginBottom: spacing.xs,
  },
  hourText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
