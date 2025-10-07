// Events/Log Screen with Advanced Filtering - PERFORMANCE OPTIMIZED

import React, { useState, useMemo, useCallback, memo } from 'react';
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
} from '../../utils';
import { EventType } from '../../types';
import DateTimePicker from '@react-native-community/datetimepicker';
// Replaced slow react-native-chart-kit with high-performance Skia charts
import { SkiaLineChart } from '../../components/charts/SkiaLineChart';
import { SkiaBarChart } from '../../components/charts/SkiaBarChart';

const { width: screenWidth } = Dimensions.get('window');

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
}: any) => (
  <Card style={[styles.consumptionCard, { backgroundColor: themeColors.surface }]}>
    <View style={styles.consumptionHeader}>
      <View style={styles.consumptionTitleRow}>
        <MaterialCommunityIcons name="lightning-bolt" size={24} color={themeColors.primary} />
        <Text style={[styles.sectionTitle, { color: themeColors.text.primary, marginBottom: 0, marginLeft: spacing.sm }]}>
          {t('events.consumption.title')}
        </Text>
      </View>
    </View>

    {/* Separate Filter Buttons */}
    <View style={styles.filterButtonsRow}>
      {/* Date Range Button */}
      <TouchableOpacity
        onPress={onDateRangePress}
        style={[styles.filterButton, { backgroundColor: themeColors.surface, borderColor: themeColors.primary, borderWidth: 1.5 }]}
      >
        <Ionicons name="calendar-outline" size={16} color={themeColors.primary} />
        <View style={styles.filterButtonContent}>
          <Text style={[styles.filterButtonLabel, { color: themeColors.text.secondary }]}>
            {t('events.consumption.dateRange')}
          </Text>
          <Text style={[styles.filterButtonValue, { color: themeColors.text.primary }]}>
            {formatDateLabel(consumptionStartDate)} - {formatDateLabel(consumptionEndDate)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Hour Range Button */}
      <TouchableOpacity
        onPress={onHourRangePress}
        style={[styles.filterButton, { backgroundColor: themeColors.surface, borderColor: themeColors.info, borderWidth: 1.5 }]}
      >
        <Ionicons name="time-outline" size={16} color={themeColors.info} />
        <View style={styles.filterButtonContent}>
          <Text style={[styles.filterButtonLabel, { color: themeColors.text.secondary }]}>
            {t('events.consumption.hourRange')}
          </Text>
          <Text style={[styles.filterButtonValue, { color: themeColors.text.primary }]}>
            {`${startHour.toString().padStart(2, '0')}:00`} - {`${endHour.toString().padStart(2, '0')}:00`}
          </Text>
        </View>
      </TouchableOpacity>
    </View>

    {/* Current Total Energy */}
    <View style={[styles.currentEnergyCard, { backgroundColor: themeColors.primaryLight }]}>
      <View style={styles.currentEnergyContent}>
        <View style={styles.currentEnergyLeft}>
          <Text style={[styles.currentEnergyLabel, { color: themeColors.text.secondary }]}>
            {t('events.consumption.total')}
          </Text>
          <Text style={[styles.currentEnergyValue, { color: themeColors.primary }]}>
            {formatEnergy(totalConsumption)}
          </Text>
          <Text style={[styles.currentEnergyDateRange, { color: themeColors.text.secondary }]}>
            {formatDateLabel(consumptionStartDate)} - {formatDateLabel(consumptionEndDate)}
          </Text>
        </View>
        <View style={[styles.energyIconContainer, { backgroundColor: themeColors.primary }]}>
          <MaterialCommunityIcons name="flash" size={32} color="#FFFFFF" />
        </View>
      </View>
    </View>

    {/* High-Performance Skia Bar Chart */}
    <View style={styles.chartContainer}>
      <Text style={[styles.chartTitle, { color: themeColors.text.primary }]}>
        {t('events.consumption.hourlyBreakdown')}
      </Text>
      <Text style={[styles.chartSubtitle, { color: themeColors.text.secondary }]}>
        {currentData.length} {t('events.consumption.hours')}
        {isMultipleDays && ` • ${daysDifference} ${t('common.days')}`}
      </Text>
      <SkiaBarChart
        data={currentData.map((item: any) => ({
          label: item.label,
          value: item.kWh,
          highlight: item.hourValue === currentHour,
        }))}
        maxValue={maxConsumption}
        theme={themeColors === colors.dark ? 'dark' : 'light'}
        primaryColor={themeColors.primary}
        highlightColor={themeColors.primary}
        formatValue={(v) => formatEnergy(v)}
      />
    </View>

    {/* Consumption Stats */}
    <View style={styles.consumptionStatsRow}>
      <View style={styles.consumptionStatItem}>
        <View style={[styles.consumptionStatIcon, { backgroundColor: themeColors.success + '20' }]}>
          <Ionicons name="trending-down" size={16} color={themeColors.success} />
        </View>
        <View>
          <Text style={[styles.consumptionStatValue, { color: themeColors.text.primary }]}>
            {formatEnergy(avgConsumption)}
          </Text>
          <Text style={[styles.consumptionStatLabel, { color: themeColors.text.secondary }]}>
            {t('events.consumption.average')}
          </Text>
        </View>
      </View>
    </View>
  </Card>
));

export default function EventsScreen() {
  const { filter, setFilter, getFilteredEvents, getStatistics } = useEventsStore();
  const { theme } = useThemeStore();
  const { language } = useLanguageStore();
  const { data } = useElectricalStore();
  const themeColors = colors[theme];
  const { t } = useTranslation();

  // Check if we're in RTL mode (Arabic)
  const isRTL = language === 'ar';

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('consumption');

  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [selectedEventTypes, setSelectedEventTypes] = useState<EventType[]>([]);

  // Separate modal states for date and hour range
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [showHourRangeModal, setShowHourRangeModal] = useState(false);

  // PERFORMANCE: Use callback refs to prevent recreation
  const today = useMemo(() => new Date(), []);

  // Consumption filter states - DEFAULT TO TODAY FOR BEST PERFORMANCE
  const [consumptionStartDate, setConsumptionStartDate] = useState(today);
  const [consumptionEndDate, setConsumptionEndDate] = useState(today);
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(23);
  const [showConsumptionStartPicker, setShowConsumptionStartPicker] = useState(false);
  const [showConsumptionEndPicker, setShowConsumptionEndPicker] = useState(false);

  // Pending filter states (for Apply button)
  const [pendingStartDate, setPendingStartDate] = useState(today);
  const [pendingEndDate, setPendingEndDate] = useState(today);
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

  const events = getFilteredEvents();
  const stats = getStatistics();

  // Get current hour for highlighting
  const currentHour = new Date().getHours();

  // PERFORMANCE: Generate time series data helper - memoized
  const generateTimeSeriesData = useCallback((points: number, baseValue: number, variance: number, includeSpike: boolean = false) => {
    const data = [];
    for (let i = 0; i < points; i++) {
      let value = baseValue + (Math.random() - 0.5) * variance;

      // Add realistic spike at a random point
      if (includeSpike && i === Math.floor(points * 0.6)) {
        value = baseValue + variance * 2.5;
      }

      // Add smooth variations
      value += Math.sin(i / points * Math.PI * 2) * variance * 0.3;
      data.push(parseFloat(value.toFixed(2)));
    }
    return data;
  }, []);

  // PERFORMANCE OPTIMIZED: Better memoization with specific dependencies
  const hourlyConsumption = useMemo(() => {
    const data = [];
    const currentDate = new Date(consumptionStartDate);
    currentDate.setHours(0, 0, 0, 0); // Reset time to start of day

    const endDateObj = new Date(consumptionEndDate);
    endDateObj.setHours(23, 59, 59, 999); // Set to end of day

    // Limit to prevent performance issues (max 7 days * 24 hours = 168 data points)
    const maxDays = 7;
    let dayCount = 0;

    // Loop through each day in the range
    while (currentDate <= endDateObj && dayCount < maxDays) {
      // For each day, generate hours within the selected hour range
      for (let hour = startHour; hour <= endHour; hour++) {
        const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
        data.push({
          date: dateStr,
          hour: `${hour.toString().padStart(2, '0')}:00`,
          hourValue: hour,
          kWh: Math.random() * 0.8 + 0.2,
          timestamp: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour).getTime(),
        });
      }
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      dayCount++;
    }

    return data;
  }, [consumptionStartDate.getTime(), consumptionEndDate.getTime(), startHour, endHour]);

  // PERFORMANCE: Separate time series data calculations
  const voltageData = useMemo(() =>
    generateTimeSeriesData(hourlyConsumption.length, 220, 8, true),
    [hourlyConsumption.length, generateTimeSeriesData]
  );

  const currentTrendData = useMemo(() =>
    generateTimeSeriesData(hourlyConsumption.length, 3, 1.5, true),
    [hourlyConsumption.length, generateTimeSeriesData]
  );

  const powerData = useMemo(() =>
    generateTimeSeriesData(hourlyConsumption.length, 660, 200, false),
    [hourlyConsumption.length, generateTimeSeriesData]
  );

  const powerFactorData = useMemo(() =>
    generateTimeSeriesData(hourlyConsumption.length, 0.95, 0.08, false),
    [hourlyConsumption.length, generateTimeSeriesData]
  );

  const frequencyData = useMemo(() =>
    generateTimeSeriesData(hourlyConsumption.length, 50.0, 0.3, false),
    [hourlyConsumption.length, generateTimeSeriesData]
  );

  // Safe stats for each series
  const voltageStats = useMemo(() => {
    const arr = voltageData; if (!arr || arr.length === 0) return { has:false, min:0, max:0, avg:0 } as const;
    const sum = arr.reduce((a,b)=>a+b,0);
    return { has:true, min: Math.min(...arr), max: Math.max(...arr), avg: sum/arr.length } as const;
  }, [voltageData]);
  const currentStats = useMemo(() => {
    const arr = currentTrendData; if (!arr || arr.length === 0) return { has:false, min:0, max:0, avg:0 } as const;
    const sum = arr.reduce((a,b)=>a+b,0);
    return { has:true, min: Math.min(...arr), max: Math.max(...arr), avg: sum/arr.length } as const;
  }, [currentTrendData]);
  const powerStats = useMemo(() => {
    const arr = powerData; if (!arr || arr.length === 0) return { has:false, min:0, max:0, avg:0 } as const;
    const sum = arr.reduce((a,b)=>a+b,0);
    return { has:true, min: Math.min(...arr), max: Math.max(...arr), avg: sum/arr.length } as const;
  }, [powerData]);
  const pfStats = useMemo(() => {
    const arr = powerFactorData; if (!arr || arr.length === 0) return { has:false, min:0, max:0, avg:0 } as const;
    const sum = arr.reduce((a,b)=>a+b,0);
    return { has:true, min: Math.min(...arr), max: Math.max(...arr), avg: sum/arr.length } as const;
  }, [powerFactorData]);
  const freqStats = useMemo(() => {
    const arr = frequencyData; if (!arr || arr.length === 0) return { has:false, min:0, max:0, avg:0 } as const;
    const sum = arr.reduce((a,b)=>a+b,0);
    return { has:true, min: Math.min(...arr), max: Math.max(...arr), avg: sum/arr.length } as const;
  }, [frequencyData]);


  // PERFORMANCE: Memoize day calculations
  const { daysDifference, isMultipleDays } = useMemo(() => {
    const diff = Math.ceil((consumptionEndDate.getTime() - consumptionStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return {
      daysDifference: diff,
      isMultipleDays: diff > 1
    };
  }, [consumptionStartDate.getTime(), consumptionEndDate.getTime()]);

  // PERFORMANCE: Memoize graph labels
  const graphLabels = useMemo(() => {
    const filterInterval = isMultipleDays ? (isRTL ? 4 : 3) : (isRTL ? 3 : 2);
    const labels = hourlyConsumption
      .filter((_, index) => index % filterInterval === 0)
      .map((item) => {
        if (isMultipleDays) {
          const date = new Date(item.timestamp);
          const monthDay = `${(date.getMonth() + 1)}/${date.getDate()}`;
          return `${monthDay} ${item.hour}`;
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

  // Apply filter changes
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

  // PERFORMANCE: Memoize modal handlers
  const handleDateRangePress = useCallback(() => {
    setPendingStartDate(consumptionStartDate);
    setPendingEndDate(consumptionEndDate);
    setHasPendingChanges(false);
    setShowDateRangeModal(true);
  }, [consumptionStartDate, consumptionEndDate]);

  const handleHourRangePress = useCallback(() => {
    setPendingStartHour(startHour);
    setPendingEndHour(endHour);
    setHasPendingChanges(false);
    setShowHourRangeModal(true);
  }, [startHour, endHour]);

  const closeDateRangeModal = useCallback(() => {
    if (hasPendingChanges) {
      handleCancelFilters();
    } else {
      setShowDateRangeModal(false);
    }
  }, [hasPendingChanges, handleCancelFilters]);

  const closeHourRangeModal = useCallback(() => {
    if (hasPendingChanges) {
      handleCancelFilters();
    } else {
      setShowHourRangeModal(false);
    }
  }, [hasPendingChanges, handleCancelFilters]);

  // Chart configuration removed - Skia charts handle their own config

  // PERFORMANCE: Memoized parameter graphs component
  const parameterGraphs = useMemo(() => {

    return (
      <View style={styles.graphsSection}>
        <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
          {t('events.graphs.title')}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: themeColors.text.secondary }]}>
          {t('events.graphs.subtitle')}
        </Text>

        {/* Voltage Graph */}
        <Card style={[styles.graphCard, { backgroundColor: themeColors.surface }]}>
          <View style={styles.graphHeader}>
            <View style={styles.graphTitleRow}>
              <Ionicons name="flash" size={20} color={themeColors.primary} />
              <Text style={[styles.graphTitle, { color: themeColors.text.primary }]}>
                {t('events.graphs.voltage.title')}
              </Text>
            </View>
            {voltageStats.has && (
              <View style={styles.graphStats}>
                <View style={styles.graphStat}>
                  <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.max')}</Text>
                  <Text style={[styles.graphStatValue, { color: themeColors.danger }]}>
                    {formatVoltage(voltageStats.max)}
                  </Text>
                </View>
                <View style={styles.graphStat}>
                  <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.avg')}</Text>
                  <Text style={[styles.graphStatValue, { color: themeColors.text.primary }]}>
                    {formatVoltage(voltageStats.avg)}
                  </Text>
                </View>
                <View style={styles.graphStat}>
                  <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.min')}</Text>
                  <Text style={[styles.graphStatValue, { color: themeColors.success }]}>
                    {formatVoltage(voltageStats.min)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <SkiaLineChart
            data={isRTL ? voltageData.slice().reverse() : voltageData}
            title=""
            color="#42A5F5"
            unit={t('home.units.voltage')}
            height={200}
            animated={true}
            theme={theme}
            showStats={false}
            min={voltageStats.has ? voltageStats.min : undefined}
            max={voltageStats.has ? voltageStats.max : undefined}
            average={voltageStats.has ? voltageStats.avg : undefined}
          />

          <View style={[styles.safetyRange, { backgroundColor: themeColors.background }]}>
            <Text style={[styles.safetyRangeText, { color: themeColors.text.secondary }]}>
              {t('events.graphs.voltage.safeRange')}
            </Text>
          </View>
        </Card>

        {/* Current Graph */}
        <Card style={[styles.graphCard, { backgroundColor: themeColors.surface }]}>
          <View style={styles.graphHeader}>
            <View style={styles.graphTitleRow}>
              <Ionicons name="analytics" size={20} color={themeColors.warning} />
              <Text style={[styles.graphTitle, { color: themeColors.text.primary }]}>
                {t('events.graphs.current.title')}
              </Text>
            </View>
            {currentStats.has && (
              <View style={styles.graphStats}>
                <View style={styles.graphStat}>
                  <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.max')}</Text>
                  <Text style={[styles.graphStatValue, { color: themeColors.danger }]}>
                    {formatCurrent(currentStats.max)}
                  </Text>
                </View>
                <View style={styles.graphStat}>
                  <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.avg')}</Text>
                  <Text style={[styles.graphStatValue, { color: themeColors.text.primary }]}>
                    {formatCurrent(currentStats.avg)}
                  </Text>
                </View>
                <View style={styles.graphStat}>
                  <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.min')}</Text>
                  <Text style={[styles.graphStatValue, { color: themeColors.success }]}>
                    {formatCurrent(currentStats.min)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <SkiaLineChart
            data={isRTL ? currentTrendData.slice().reverse() : currentTrendData}
            title=""
            color="#FFA726"
            unit={t('home.units.current')}
            height={200}
            animated={true}
            theme={theme}
            showStats={false}
            min={currentStats.has ? currentStats.min : undefined}
            max={currentStats.has ? currentStats.max : undefined}
            average={currentStats.has ? currentStats.avg : undefined}
          />

          <View style={[styles.safetyRange, { backgroundColor: themeColors.background }]}>
            <Text style={[styles.safetyRangeText, { color: themeColors.text.secondary }]}>
              {t('events.graphs.current.safeLimit', { value: 16, unit: t('home.units.current') })}
            </Text>
          </View>
        </Card>

        {/* Power Graph */}
        <Card style={[styles.graphCard, { backgroundColor: themeColors.surface }]}>
          <View style={styles.graphHeader}>
            <View style={styles.graphTitleRow}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color={themeColors.success} />
              <Text style={[styles.graphTitle, { color: themeColors.text.primary }]}>
                {t('events.graphs.power.title')}
              </Text>
            </View>
            {powerStats.has && (
              <View style={styles.graphStats}>
                <View style={styles.graphStat}>
                  <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.max')}</Text>
                  <Text style={[styles.graphStatValue, { color: themeColors.danger }]}>
                    {formatPower(powerStats.max)}
                  </Text>
                </View>
                <View style={styles.graphStat}>
                  <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.avg')}</Text>
                  <Text style={[styles.graphStatValue, { color: themeColors.text.primary }]}>
                    {formatPower(powerStats.avg)}
                  </Text>
                </View>
                <View style={styles.graphStat}>
                  <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.min')}</Text>
                  <Text style={[styles.graphStatValue, { color: themeColors.success }]}>
                    {formatPower(powerStats.min)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <SkiaLineChart
            data={isRTL ? powerData.slice().reverse() : powerData}
            title=""
            color="#66BB6A"
            unit={t('home.units.power')}
            height={200}
            animated={true}
            theme={theme}
            showStats={false}
            min={powerStats.has ? powerStats.min : undefined}
            max={powerStats.has ? powerStats.max : undefined}
            average={powerStats.has ? powerStats.avg : undefined}
          />
        </Card>

        {/* Power Factor Graph */}
        <Card style={[styles.graphCard, { backgroundColor: themeColors.surface }]}>
          <View style={styles.graphHeader}>
            <View style={styles.graphTitleRow}>
              <Ionicons name="analytics" size={20} color={themeColors.secondary} />
              <Text style={[styles.graphTitle, { color: themeColors.text.primary }]}>
                {t('events.graphs.powerFactor.title')}
              </Text>
            </View>
            {pfStats.has && (
              <View style={styles.graphStats}>
                <View style={styles.graphStat}>
                  <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.max')}</Text>
                  <Text style={[styles.graphStatValue, { color: themeColors.success }]}>
                    {formatPowerFactor(pfStats.max)}
                  </Text>
                </View>
                <View style={styles.graphStat}>
                  <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.avg')}</Text>
                  <Text style={[styles.graphStatValue, { color: themeColors.text.primary }]}>
                    {formatPowerFactor(pfStats.avg)}
                  </Text>
                </View>
                <View style={styles.graphStat}>
                  <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.min')}</Text>
                  <Text style={[styles.graphStatValue, { color: themeColors.warning }]}>
                    {formatPowerFactor(pfStats.min)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <SkiaLineChart
            data={isRTL ? powerFactorData.slice().reverse() : powerFactorData}
            title=""
            color="#AB47BC"
            unit=""
            height={200}
            animated={true}
            theme={theme}
            showStats={false}
            min={pfStats.has ? pfStats.min : undefined}
            max={pfStats.has ? pfStats.max : undefined}
            average={pfStats.has ? pfStats.avg : undefined}
          />

          <View style={[styles.safetyRange, { backgroundColor: themeColors.background }]}>
            <Text style={[styles.safetyRangeText, { color: themeColors.text.secondary }]}>
              {t('events.graphs.powerFactor.goodRange')}
            </Text>
          </View>
        </Card>

        {/* Frequency Graph */}
        <Card style={[styles.graphCard, { backgroundColor: themeColors.surface }]}>
          <View style={styles.graphHeader}>
            <View style={styles.graphTitleRow}>
              <Ionicons name="pulse" size={20} color={themeColors.info} />
              <Text style={[styles.graphTitle, { color: themeColors.text.primary }]}>
                {t('events.graphs.frequency.title')}
              </Text>
            </View>
            {freqStats.has && (
              <View style={styles.graphStats}>
                <View style={styles.graphStat}>
                  <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.max')}</Text>
                  <Text style={[styles.graphStatValue, { color: themeColors.danger }]}>
                    {formatFrequency(freqStats.max)}
                  </Text>
                </View>
                <View style={styles.graphStat}>
                  <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.avg')}</Text>
                  <Text style={[styles.graphStatValue, { color: themeColors.text.primary }]}>
                    {formatFrequency(freqStats.avg)}
                  </Text>
                </View>
                <View style={styles.graphStat}>
                  <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.min')}</Text>
                  <Text style={[styles.graphStatValue, { color: themeColors.success }]}>
                    {formatFrequency(freqStats.min)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <SkiaLineChart
            data={isRTL ? frequencyData.slice().reverse() : frequencyData}
            title=""
            color="#26C6DA"
            unit={t('home.units.frequency')}
            height={200}
            animated={true}
            theme={theme}
            showStats={false}
            min={freqStats.has ? freqStats.min : undefined}
            max={freqStats.has ? freqStats.max : undefined}
            average={freqStats.has ? freqStats.avg : undefined}
          />

          <View style={[styles.safetyRange, { backgroundColor: themeColors.background }]}>
            <Text style={[styles.safetyRangeText, { color: themeColors.text.secondary }]}>
              {t('events.graphs.frequency.standard')}
            </Text>
          </View>
        </Card>
      </View>
    );
  }, [graphLabels, voltageData, currentTrendData, powerData, powerFactorData, frequencyData, isRTL, themeColors, t, theme]);

  // Render date range picker
  const renderDateRangePicker = useCallback(() => (
    <Card style={[styles.dateRangeCard, { backgroundColor: themeColors.surface }]}>
      <View style={styles.dateRangeHeader}>
        <Ionicons name="calendar" size={20} color={themeColors.primary} />
        <Text style={[styles.dateRangeTitle, { color: themeColors.text.primary }]}>
          {t('events.dateFilter.title')}
        </Text>
      </View>

      {/* Quick Presets - Same as Analytics */}
      <View style={styles.quickPresetsContainer}>
        <TouchableOpacity
          onPress={() => {
            const today = new Date();
            setStartDate(today);
            setEndDate(today);
          }}
          style={[styles.presetButton, { backgroundColor: themeColors.background, borderColor: themeColors.primary }]}
        >
          <Ionicons name="today-outline" size={16} color={themeColors.primary} />
          <Text style={[styles.presetButtonText, { color: themeColors.text.primary }]}>
            {t('events.consumption.datePresets.today')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            setStartDate(yesterday);
            setEndDate(yesterday);
          }}
          style={[styles.presetButton, { backgroundColor: themeColors.background, borderColor: themeColors.primary }]}
        >
          <Text style={[styles.presetButtonText, { color: themeColors.text.primary }]}>
            {t('events.consumption.datePresets.yesterday')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const today = new Date();
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
            setPendingEventStartDate(oneWeekAgo);
            setPendingEventEndDate(today);
            setHasEventPendingChanges(true);
          }}
          style={[styles.presetButton, { backgroundColor: themeColors.background, borderColor: themeColors.primary }]}
        >
          <Text style={[styles.presetButtonText, { color: themeColors.text.primary }]}>
            {t('events.presets.lastWeek')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const today = new Date();
            const oneMonthAgo = new Date();
            oneMonthAgo.setDate(oneMonthAgo.getDate() - 29);
            setPendingEventStartDate(oneMonthAgo);
            setPendingEventEndDate(today);
            setHasEventPendingChanges(true);
          }}
          style={[styles.presetButton, { backgroundColor: themeColors.background, borderColor: themeColors.primary }]}
        >
          <Text style={[styles.presetButtonText, { color: themeColors.text.primary }]}>
            {t('events.presets.lastMonth')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateRangeRow}>
        {/* Start Date */}
        <View style={styles.dateRangeItem}>
          <Text style={[styles.dateRangeLabel, { color: themeColors.text.secondary }]}>
            {t('events.dateFilter.from')}
          </Text>
          <TouchableOpacity
            onPress={() => setShowStartPicker(true)}
            style={[styles.dateButton, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
          >
            <Ionicons name="calendar-outline" size={16} color={themeColors.primary} />
            <View style={styles.dateTextContainer}>
              <Text style={[styles.dateText, { color: themeColors.text.primary }]}>
                {formatDateLabel(startDate)}
              </Text>
              <Text style={[styles.timeText, { color: themeColors.text.secondary }]}>
                {formatTimeLabel(startDate)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* End Date */}
        <View style={styles.dateRangeItem}>
          <Text style={[styles.dateRangeLabel, { color: themeColors.text.secondary }]}>
            {t('events.dateFilter.to')}
          </Text>
          <TouchableOpacity
            onPress={() => setShowEndPicker(true)}
            style={[styles.dateButton, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
          >
            <Ionicons name="calendar-outline" size={16} color={themeColors.primary} />
            <View style={styles.dateTextContainer}>
              <Text style={[styles.dateText, { color: themeColors.text.primary }]}>
                {formatDateLabel(endDate)}
              </Text>
              <Text style={[styles.timeText, { color: themeColors.text.secondary }]}>
                {formatTimeLabel(endDate)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={pendingEventStartDate}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartDateChange}
          maximumDate={pendingEventEndDate}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={pendingEventEndDate}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndDateChange}
          minimumDate={pendingEventStartDate}
          maximumDate={new Date()}
        />
      )}

      {/* Apply/Cancel Buttons */}
      {hasEventPendingChanges && (
        <View style={styles.modalButtons}>
          <TouchableOpacity
            onPress={handleCancelEventFilters}
            style={[styles.modalButton, styles.cancelButton, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
          >
            <Text style={[styles.cancelButtonText, { color: themeColors.text.secondary }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleApplyEventFilters}
            style={[styles.modalButton, styles.applyButton, { backgroundColor: themeColors.primary }]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.applyButtonText}>
              {t('common.apply')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  ), [themeColors, t, startDate, endDate, pendingEventStartDate, pendingEventEndDate, showStartPicker, showEndPicker, hasEventPendingChanges, formatDateLabel, formatTimeLabel, onStartDateChange, onEndDateChange, handleApplyEventFilters, handleCancelEventFilters]);

  // Render safety events filter
  const renderSafetyFilters = useCallback(() => (
    <Card style={[styles.safetyCard, { backgroundColor: themeColors.surface }]}>
      <View style={styles.safetyHeader}>
        <Ionicons name="shield-checkmark" size={20} color={themeColors.danger} />
        <Text style={[styles.safetyTitle, { color: themeColors.text.primary }]}>
          {t('events.safetyFilter.title')}
        </Text>
      </View>

      <View style={styles.safetyFilters}>
        {safetyEventTypes.map(({ label, value, icon }) => {
          const isSelected = selectedEventTypes.includes(value);
          return (
            <TouchableOpacity
              key={value}
              onPress={() => toggleEventType(value)}
              style={[
                styles.safetyFilterChip,
                {
                  backgroundColor: isSelected ? themeColors.danger + '20' : themeColors.background,
                  borderColor: isSelected ? themeColors.danger : themeColors.border,
                }
              ]}
            >
              <Ionicons
                name={icon as any}
                size={16}
                color={isSelected ? themeColors.danger : themeColors.text.secondary}
              />
              <Text style={[
                styles.safetyFilterText,
                { color: isSelected ? themeColors.danger : themeColors.text.secondary }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedEventTypes.length > 0 && (
        <TouchableOpacity
          onPress={() => setSelectedEventTypes([])}
          style={styles.clearFiltersButton}
        >
          <Text style={[styles.clearFiltersText, { color: themeColors.primary }]}>
            {t('events.safetyFilter.clearAll')}
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  ), [themeColors, t, selectedEventTypes, safetyEventTypes, toggleEventType]);

  // Render statistics card
  const renderStatistics = useCallback(() => (
    <Card style={styles.statsCard}>
      <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
        {t('events.statistics.title')}
      </Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.primary }]}>
            {stats.totalEvents}
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
            {t('events.statistics.totalEvents')}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.danger }]}>
            {stats.totalOutages}
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
            {t('events.statistics.outages')}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.warning }]}>
            {formatDurationShort(stats.averageOutageDuration)}
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
            {t('events.statistics.avgDuration')}
          </Text>
        </View>
      </View>
    </Card>
  ), [themeColors, t, stats]);

  // Render event item
  const renderEventItem = useCallback(({ item }: { item: typeof events[0] }) => {
    const eventColor = getEventColor(item.type);
    const icon = getEventIcon(item.type);

    return (
      <View
        style={[
          styles.eventCard,
          {
            backgroundColor: themeColors.surface,
            borderLeftColor: eventColor,
          },
        ]}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventIconContainer}>
            <View
              style={[
                styles.eventIconCircle,
                { backgroundColor: eventColor + '20' },
              ]}
            >
              <Ionicons name={icon} size={20} color={eventColor} />
            </View>
          </View>
          <View style={styles.eventContent}>
            <Text style={[styles.eventDescription, { color: themeColors.text.primary }]}>
              {item.description}
            </Text>
            <Text style={[styles.eventTime, { color: themeColors.text.secondary }]}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
        </View>

        {item.readings && (
          <View style={styles.eventDetails}>
            <View style={styles.eventDetailItem}>
              <Ionicons name="flash-outline" size={14} color={themeColors.text.secondary} />
              <Text style={[styles.eventDetailText, { color: themeColors.text.secondary }]}>
                {formatVoltage(item.readings.voltage)}
              </Text>
            </View>
            <View style={styles.eventDetailItem}>
              <Ionicons name="analytics-outline" size={14} color={themeColors.text.secondary} />
              <Text style={[styles.eventDetailText, { color: themeColors.text.secondary }]}>
                {formatCurrent(item.readings.current)}
              </Text>
            </View>
            <View style={styles.eventDetailItem}>
              <Ionicons name="speedometer-outline" size={14} color={themeColors.text.secondary} />
              <Text style={[styles.eventDetailText, { color: themeColors.text.secondary }]}>
                {formatPower(item.readings.power)}
              </Text>
            </View>
          </View>
        )}

        {item.duration && (
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={14} color={themeColors.danger} />
            <Text style={[styles.durationText, { color: themeColors.danger }]}>
              {formatDurationShort(item.duration)}
            </Text>
          </View>
        )}
      </View>
    );
  }, [themeColors]);

  // Filter events by selected types and date range
  const filteredEvents = useMemo(() => events.filter(event => {
    // Check date range
    const eventDate = new Date(event.timestamp);
    const isInDateRange = eventDate >= startDate && eventDate <= endDate;

    // Check event type filter
    const matchesType = selectedEventTypes.length === 0 || selectedEventTypes.includes(event.type);

    return isInDateRange && matchesType;
  }), [events, startDate, endDate, selectedEventTypes]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      {/* Header with Tabs */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text.primary }]}>
          {t('events.title')}
        </Text>

        {/* Tab Switcher */}
        <View style={[styles.tabContainer, { backgroundColor: themeColors.background }]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'consumption' && styles.activeTabButton,
              activeTab === 'consumption' && { backgroundColor: themeColors.primary },
            ]}
            onPress={() => setActiveTab('consumption')}
          >
            <Ionicons
              name="analytics"
              size={18}
              color={activeTab === 'consumption' ? '#FFFFFF' : themeColors.text.secondary}
            />
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
              styles.tabButton,
              activeTab === 'events' && styles.activeTabButton,
              activeTab === 'events' && { backgroundColor: themeColors.primary },
            ]}
            onPress={() => setActiveTab('events')}
          >
            <Ionicons
              name="list"
              size={18}
              color={activeTab === 'events' ? '#FFFFFF' : themeColors.text.secondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'events' ? '#FFFFFF' : themeColors.text.secondary }
              ]}
            >
              {t('events.tabs.eventLog')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'consumption' ? (
          <>
            {/* Energy Consumption Overview */}
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
              onDateRangePress={handleDateRangePress}
              onHourRangePress={handleHourRangePress}
            />

            {/* Electrical Parameter Graphs (Voltage, Current, Power Curves) */}
            {parameterGraphs}
          </>
        ) : (
          <>
            {/* Date Range Picker */}
            {renderDateRangePicker()}

            {/* Safety Events Filter */}
            {renderSafetyFilters()}

            {/* Statistics */}
            {renderStatistics()}

            {/* Events List */}
            <View style={styles.eventsSection}>
              <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                {t('events.eventsList.title')} ({filteredEvents.length})
              </Text>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <View key={event.id}>{renderEventItem({ item: event })}</View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-outline" size={48} color={themeColors.text.secondary} />
                  <Text style={[styles.emptyText, { color: themeColors.text.secondary }]}>
                    {t('events.eventsList.empty')}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Date Range Modal */}
      {showDateRangeModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModal, { backgroundColor: themeColors.surface }]}>
            <View style={styles.filterModalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="calendar" size={24} color={themeColors.primary} />
                <Text style={[styles.filterModalTitle, { color: themeColors.text.primary }]}>
                  {t('events.consumption.dateRange')}
                </Text>
              </View>
              <TouchableOpacity onPress={closeDateRangeModal}>
                <Ionicons name="close" size={24} color={themeColors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <View style={styles.quickPresetsContainer}>
              <TouchableOpacity
                onPress={() => {
                  const today = new Date();
                  setConsumptionStartDate(today);
                  setConsumptionEndDate(today);
                }}
                style={[styles.presetButton, { backgroundColor: themeColors.background, borderColor: themeColors.primary }]}
              >
                <Ionicons name="today-outline" size={16} color={themeColors.primary} />
                <Text style={[styles.presetButtonText, { color: themeColors.text.primary }]}>
                  {t('events.consumption.datePresets.today')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setConsumptionStartDate(yesterday);
                  setConsumptionEndDate(yesterday);
                }}
                style={[styles.presetButton, { backgroundColor: themeColors.background, borderColor: themeColors.primary }]}
              >
                <Text style={[styles.presetButtonText, { color: themeColors.text.primary }]}>
                  {t('events.consumption.datePresets.yesterday')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const today = new Date();
                  const oneWeekAgo = new Date();
                  oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
                  setConsumptionStartDate(oneWeekAgo);
                  setConsumptionEndDate(today);
                }}
                style={[styles.presetButton, { backgroundColor: themeColors.background, borderColor: themeColors.primary }]}
              >
                <Text style={[styles.presetButtonText, { color: themeColors.text.primary }]}>
                  {t('events.presets.lastWeek')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const today = new Date();
                  const oneMonthAgo = new Date();
                  oneMonthAgo.setDate(oneMonthAgo.getDate() - 29);
                  setConsumptionStartDate(oneMonthAgo);
                  setConsumptionEndDate(today);
                }}
                style={[styles.presetButton, { backgroundColor: themeColors.background, borderColor: themeColors.primary }]}
              >
                <Text style={[styles.presetButtonText, { color: themeColors.text.primary }]}>
                  {t('events.presets.lastMonth')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Custom Date Selection */}
            <View style={styles.customDateSection}>
              <Text style={[styles.customDateLabel, { color: themeColors.text.secondary }]}>
                {t('events.consumption.datePresets.customRange')}
              </Text>

              <View style={styles.datePickerRow}>
                <View style={styles.datePickerColumn}>
                  <Text style={[styles.datePickerLabel, { color: themeColors.text.secondary }]}>
                    {t('common.from')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowConsumptionStartPicker(true)}
                    style={[styles.datePickerButton, { backgroundColor: themeColors.background, borderColor: themeColors.primary }]}
                  >
                    <Ionicons name="calendar-outline" size={18} color={themeColors.primary} />
                    <Text style={[styles.datePickerText, { color: themeColors.text.primary }]}>
                      {formatDateLabel(consumptionStartDate)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Ionicons name="arrow-forward" size={20} color={themeColors.text.secondary} style={styles.dateArrow} />

                <View style={styles.datePickerColumn}>
                  <Text style={[styles.datePickerLabel, { color: themeColors.text.secondary }]}>
                    {t('common.to')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowConsumptionEndPicker(true)}
                    style={[styles.datePickerButton, { backgroundColor: themeColors.background, borderColor: themeColors.primary }]}
                  >
                    <Ionicons name="calendar-outline" size={18} color={themeColors.primary} />
                    <Text style={[styles.datePickerText, { color: themeColors.text.primary }]}>
                      {formatDateLabel(consumptionEndDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              onPress={closeDateRangeModal}
              style={[styles.applyFilterButton, { backgroundColor: themeColors.primary }]}
            >
              <Text style={styles.applyFilterText}>{t('common.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Hour Range Modal */}
      {showHourRangeModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModal, { backgroundColor: themeColors.surface }]}>
            <View style={styles.filterModalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="time" size={24} color={themeColors.info} />
                <Text style={[styles.filterModalTitle, { color: themeColors.text.primary }]}>
                  {t('events.consumption.hourRange')}
                </Text>
              </View>
              <TouchableOpacity onPress={closeHourRangeModal}>
                <Ionicons name="close" size={24} color={themeColors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Today Indicator */}
            {(() => {
              const today = new Date();
              const isToday = consumptionStartDate.toDateString() === today.toDateString() &&
                             consumptionEndDate.toDateString() === today.toDateString();

              if (isToday) {
                return (
                  <View style={[styles.todayIndicator, { backgroundColor: themeColors.success + '20', borderColor: themeColors.success }]}>
                    <Ionicons name="sunny" size={18} color={themeColors.success} />
                    <View>
                      <Text style={[styles.todayIndicatorTitle, { color: themeColors.success }]}>
                        {t('events.consumption.todayIndicator.title')}
                      </Text>
                      <Text style={[styles.todayIndicatorSubtitle, { color: themeColors.text.secondary }]}>
                        {t('events.consumption.todayIndicator.currentHour', { hour: currentHour.toString().padStart(2, '0') })}
                      </Text>
                    </View>
                  </View>
                );
              }
              return null;
            })()}

            {/* Quick Presets */}
            <View style={styles.hourPresetsContainer}>
              <TouchableOpacity
                onPress={() => {
                  setPendingStartHour(0);
                  setPendingEndHour(23);
                  setHasPendingChanges(true);
                }}
                style={[styles.hourPresetButton, { backgroundColor: themeColors.background, borderColor: themeColors.info }]}
              >
                <Text style={[styles.hourPresetText, { color: themeColors.text.primary }]}>
                  {t('events.consumption.hourPresets.fullDay')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setPendingStartHour(6);
                  setPendingEndHour(18);
                  setHasPendingChanges(true);
                }}
                style={[styles.hourPresetButton, { backgroundColor: themeColors.background, borderColor: themeColors.info }]}
              >
                <Ionicons name="sunny-outline" size={14} color={themeColors.info} />
                <Text style={[styles.hourPresetText, { color: themeColors.text.primary }]}>
                  {t('events.consumption.hourPresets.daytime')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setPendingStartHour(18);
                  setPendingEndHour(23);
                  setHasPendingChanges(true);
                }}
                style={[styles.hourPresetButton, { backgroundColor: themeColors.background, borderColor: themeColors.info }]}
              >
                <Ionicons name="moon-outline" size={14} color={themeColors.info} />
                <Text style={[styles.hourPresetText, { color: themeColors.text.primary }]}>
                  {t('events.consumption.hourPresets.evening')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const now = new Date().getHours();
                  setPendingStartHour(Math.max(0, now - 3));
                  setPendingEndHour(now);
                  setHasPendingChanges(true);
                }}
                style={[styles.hourPresetButton, { backgroundColor: themeColors.background, borderColor: themeColors.info }]}
              >
                <Ionicons name="time-outline" size={14} color={themeColors.info} />
                <Text style={[styles.hourPresetText, { color: themeColors.text.primary }]}>
                  {t('events.consumption.hourPresets.last3Hours')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Start Hour */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionLabel, { color: themeColors.text.primary }]}>
                {t('common.from')}
              </Text>
              <View style={styles.hourPickerRowCentered}>
                <TouchableOpacity
                  onPress={() => {
                    setPendingStartHour(Math.max(0, pendingStartHour - 1));
                    setHasPendingChanges(true);
                  }}
                  style={[styles.hourButton, { backgroundColor: themeColors.background, borderColor: themeColors.info }]}
                >
                  <Ionicons name="remove" size={22} color={themeColors.info} />
                </TouchableOpacity>
                <View style={[styles.hourDisplay, { backgroundColor: themeColors.background, borderColor: themeColors.info }]}>
                  <Text style={[styles.hourDisplayText, { color: themeColors.text.primary }]}>
                    {pendingStartHour.toString().padStart(2, '0')}:00
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setPendingStartHour(Math.min(pendingEndHour, pendingStartHour + 1));
                    setHasPendingChanges(true);
                  }}
                  style={[styles.hourButton, { backgroundColor: themeColors.background, borderColor: themeColors.info }]}
                >
                  <Ionicons name="add" size={22} color={themeColors.info} />
                </TouchableOpacity>
              </View>
            </View>

            {/* End Hour */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionLabel, { color: themeColors.text.primary }]}>
                {t('common.to')}
              </Text>
              <View style={styles.hourPickerRowCentered}>
                <TouchableOpacity
                  onPress={() => {
                    setPendingEndHour(Math.max(pendingStartHour, pendingEndHour - 1));
                    setHasPendingChanges(true);
                  }}
                  style={[styles.hourButton, { backgroundColor: themeColors.background, borderColor: themeColors.info }]}
                >
                  <Ionicons name="remove" size={22} color={themeColors.info} />
                </TouchableOpacity>
                <View style={[styles.hourDisplay, { backgroundColor: themeColors.background, borderColor: themeColors.info }]}>
                  <Text style={[styles.hourDisplayText, { color: themeColors.text.primary }]}>
                    {pendingEndHour.toString().padStart(2, '0')}:00
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setPendingEndHour(Math.min(23, pendingEndHour + 1));
                    setHasPendingChanges(true);
                  }}
                  style={[styles.hourButton, { backgroundColor: themeColors.background, borderColor: themeColors.info }]}
                >
                  <Ionicons name="add" size={22} color={themeColors.info} />
                </TouchableOpacity>
              </View>
            <Text style={[styles.chartSubtitle, { textAlign: 'center', color: themeColors.text.secondary }]}>
              {Math.max(0, pendingEndHour - pendingStartHour + 1)} {t('events.consumption.hours')}
            </Text>

            {/* Apply/Cancel Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={handleCancelFilters}
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
              >
                <Text style={[styles.cancelButtonText, { color: themeColors.text.secondary }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApplyFilters}
                style={[styles.modalButton, styles.applyButton, { backgroundColor: themeColors.primary }]}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.applyButtonText}>
                  {t('common.apply')}
                </Text>
              </TouchableOpacity>
            </View>

            </View>

            {/* Apply Button */}
            <TouchableOpacity
              onPress={closeHourRangeModal}
              style={[styles.applyFilterButton, { backgroundColor: themeColors.info }]}
            >
              <Text style={styles.applyFilterText}>{t('common.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Date Pickers */}
      {showConsumptionStartPicker && (
        <DateTimePicker
          value={pendingStartDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onConsumptionStartDateChange}
          maximumDate={pendingEndDate}
        />
      )}

      {showConsumptionEndPicker && (
        <DateTimePicker
          value={pendingEndDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onConsumptionEndDateChange}
          minimumDate={pendingStartDate}
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.medium,
    gap: spacing.xs,
  },
  activeTabButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  tabText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl + spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  // Consumption Styles
  consumptionCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  consumptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  consumptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
  },
  filterButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  activeFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.small,
    marginBottom: spacing.md,
  },
  activeFilterText: {
    ...typography.caption,
    fontSize: 11,
  },
  viewSelectorScroll: {
    marginBottom: spacing.md,
  },
  viewSelector: {
    flexDirection: 'row',
  },
  viewButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  viewButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  consumptionDateRange: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(66, 165, 245, 0.05)',
    borderRadius: borderRadius.medium,
  },
  dateRangeSectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  consumptionDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  consumptionDateItem: {
    flex: 1,
    marginRight: spacing.xs,
  },
  consumptionDateLabel: {
    ...typography.caption,
    fontSize: 10,
    marginBottom: 4,
  },
  consumptionDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.small,
    borderWidth: 1,
  },
  consumptionDateText: {
    ...typography.caption,
    fontSize: 11,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  currentEnergyCard: {
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  currentEnergyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentEnergyLeft: {
    flex: 1,
  },
  currentEnergyLabel: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  currentEnergyValue: {
    ...typography.h1,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  currentEnergyDateRange: {
    ...typography.caption,
    fontSize: 10,
  },
  energyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    marginBottom: spacing.lg,
  },
  chartTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  chartSubtitle: {
    ...typography.caption,
    fontSize: 11,
    marginBottom: spacing.md,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    paddingVertical: spacing.sm,
  },
  barColumn: {
    width: 50,
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  barContainer: {
    width: '80%',
    height: 80,
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: borderRadius.small,
    borderTopRightRadius: borderRadius.small,
    minHeight: 4,
  },
  barLabel: {
    ...typography.caption,
    fontSize: 10,
    marginBottom: 2,
  },
  barValue: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '600',
  },
  consumptionStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  consumptionStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consumptionStatIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  consumptionStatValue: {
    ...typography.h4,
    fontWeight: 'bold',
  },
  consumptionStatLabel: {
    ...typography.caption,
  },
  // Date Range Picker Styles
  dateRangeCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  dateRangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateRangeTitle: {
    ...typography.h4,
    marginLeft: spacing.sm,
  },
  dateRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateRangeItem: {
    flex: 1,
    marginRight: spacing.sm,
  },
  dateRangeLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
  },
  dateTextContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  dateText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  timeText: {
    ...typography.caption,
    fontSize: 10,
  },
  // Safety Filter Styles
  safetyCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  safetyTitle: {
    ...typography.h4,
    marginLeft: spacing.sm,
  },
  safetyFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  safetyFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  safetyFilterText: {
    ...typography.bodySmall,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  clearFiltersButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  clearFiltersText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  // Stats Styles
  statsCard: {
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  // Event Styles
  eventsSection: {
    marginTop: spacing.md,
  },
  eventCard: {
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventIconContainer: {
    marginRight: spacing.md,
  },
  eventIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    flex: 1,
  },
  eventDescription: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  eventTime: {
    ...typography.caption,
  },
  eventDetails: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  eventDetailText: {
    ...typography.caption,
    marginLeft: spacing.xs,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  durationText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  // Graph Styles
  graphsSection: {
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  graphCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  graphHeader: {
    marginBottom: spacing.md,
  },
  graphTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  graphTitle: {
    ...typography.h4,
    marginLeft: spacing.sm,
  },
  graphStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
  },
  graphStat: {
    alignItems: 'center',
  },
  graphStatLabel: {
    ...typography.caption,
    fontSize: 10,
  },
  graphStatValue: {
    ...typography.h4,
    fontWeight: 'bold',
    marginTop: 2,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.medium,
  },
  safetyRange: {
    padding: spacing.sm,
    borderRadius: borderRadius.small,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  safetyRangeText: {
    ...typography.caption,
    fontSize: 11,
  },
  // Filter Buttons Row
  filterButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  filterButtonContent: {
    flex: 1,
    gap: spacing.xs,
  },
  filterButtonLabel: {
    ...typography.caption,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterButtonValue: {
    ...typography.bodySmall,
    fontWeight: '600',
    fontSize: 11,
  },

  // Filter Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  filterModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.large,
    padding: spacing.lg,
    ...shadows.medium,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterModalTitle: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  filterSection: {
    marginBottom: spacing.md,
  },
  filterSectionLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },

  // Quick Presets for Date Range
  quickPresetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  presetButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },

  // Custom Date Section
  customDateSection: {
    marginBottom: spacing.lg,
  },
  customDateLabel: {
    ...typography.caption,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  datePickerColumn: {
    flex: 1,
  },
  datePickerLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
  },
  datePickerText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  dateArrow: {
    marginTop: 20,
  },

  // Today Indicator
  todayIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    marginBottom: spacing.lg,
  },
  todayIndicatorTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  todayIndicatorSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },

  // Hour Presets
  hourPresetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  hourPresetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  hourPresetText: {
    ...typography.caption,
    fontWeight: '600',
  },
  hourPickerRow: {
    flex: 0.7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hourPickerRowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  hourButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  hourDisplay: {
    minWidth: 100,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  hourDisplayText: {
    ...typography.h3,
    fontWeight: 'bold',
    fontSize: 20,
    fontFamily: 'monospace',
  },
  applyFilterButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  applyFilterText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.large,
    gap: spacing.xs,
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  applyButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  cancelButtonText: {
    ...typography.button,
    fontWeight: '600',
    fontSize: 15,
  },
});
