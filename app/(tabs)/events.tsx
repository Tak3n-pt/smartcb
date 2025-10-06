// Events/Log Screen with Advanced Filtering

import React, { useState, useMemo, useCallback } from 'react';
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
import { LineChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

type TimeRange = 'hour' | 'day' | 'week' | 'month' | 'custom';
type ConsumptionView = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
type TabType = 'events' | 'consumption';

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

  // Consumption filter states - DEFAULT TO TODAY FOR BEST PERFORMANCE
  const [consumptionStartDate, setConsumptionStartDate] = useState(new Date()); // TODAY
  const [consumptionEndDate, setConsumptionEndDate] = useState(new Date()); // TODAY
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(23);
  const [showConsumptionStartPicker, setShowConsumptionStartPicker] = useState(false);
  const [showConsumptionEndPicker, setShowConsumptionEndPicker] = useState(false);

  // Event date range filter states
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const events = getFilteredEvents();
  const stats = getStatistics();

  // Get current hour for highlighting
  const currentHour = new Date().getHours();

  // OPTIMIZED: Memoize hourly consumption data generation - only recalculate when dates or hours change
  const hourlyConsumption = useMemo(() => {
    const data = [];
    const currentDate = new Date(consumptionStartDate);
    const endDateObj = new Date(consumptionEndDate);

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
  }, [consumptionStartDate, consumptionEndDate, startHour, endHour]);

  // OPTIMIZED: Memoize time series data generation
  const { voltageData, currentTrendData, powerData, powerFactorData, frequencyData } = useMemo(() => {
    const generateTimeSeriesData = (points: number, baseValue: number, variance: number, includeSpike: boolean = false) => {
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
    };

    return {
      voltageData: generateTimeSeriesData(hourlyConsumption.length, 220, 8, true),
      currentTrendData: generateTimeSeriesData(hourlyConsumption.length, 3, 1.5, true),
      powerData: generateTimeSeriesData(hourlyConsumption.length, 660, 200, false),
      powerFactorData: generateTimeSeriesData(hourlyConsumption.length, 0.95, 0.08, false),
      frequencyData: generateTimeSeriesData(hourlyConsumption.length, 50.0, 0.3, false),
    };
  }, [hourlyConsumption.length]);

  // OPTIMIZED: Memoize day calculations
  const { daysDifference, isMultipleDays } = useMemo(() => {
    const diff = Math.ceil((consumptionEndDate.getTime() - consumptionStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return {
      daysDifference: diff,
      isMultipleDays: diff > 1
    };
  }, [consumptionStartDate, consumptionEndDate]);

  // OPTIMIZED: Memoize graph labels
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

  // OPTIMIZED: Memoize consumption data and calculations
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
      avgConsumption: total / data.length
    };
  }, [hourlyConsumption, isMultipleDays]);

  // Safety event types
  const safetyEventTypes: Array<{ label: string; value: EventType; icon: string }> = [
    { label: t('events.safetyFilter.types.overvoltage'), value: 'overvoltage', icon: 'arrow-up-circle' },
    { label: t('events.safetyFilter.types.undervoltage'), value: 'undervoltage', icon: 'arrow-down-circle' },
    { label: t('events.safetyFilter.types.overload'), value: 'overload', icon: 'warning' },
    { label: 'Underload', value: 'underload', icon: 'arrow-down' },
    { label: t('events.safetyFilter.types.outage'), value: 'outage', icon: 'flash-off' },
    { label: 'Frequency Min', value: 'frequency_min', icon: 'pulse' },
    { label: 'Frequency Max', value: 'frequency_max', icon: 'pulse' },
    { label: 'Power Factor Low', value: 'power_factor_min', icon: 'analytics' },
  ];

  const toggleEventType = (type: EventType) => {
    setSelectedEventTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Format date for display
  const formatDateLabel = (date: Date) => formatDate(date.getTime());
  const formatTimeLabel = (date: Date) => formatTime(date.getTime());

  // Handle event date picker changes
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  // Handle consumption date picker changes
  const onConsumptionStartDateChange = (event: any, selectedDate?: Date) => {
    setShowConsumptionStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setConsumptionStartDate(selectedDate);
    }
  };

  const onConsumptionEndDateChange = (event: any, selectedDate?: Date) => {
    setShowConsumptionEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setConsumptionEndDate(selectedDate);
    }
  };

  // MEMOIZED: Only re-render when actual data or theme changes, NOT on every state update
  const consumptionOverview = useMemo(() => (
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
          onPress={() => setShowDateRangeModal(true)}
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
          onPress={() => setShowHourRangeModal(true)}
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

      {/* Bar Chart */}
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: themeColors.text.primary }]}>
          {t('events.consumption.hourlyBreakdown')}
        </Text>
        <Text style={[styles.chartSubtitle, { color: themeColors.text.secondary }]}>
          {currentData.length} {t('events.consumption.hours')}
          {isMultipleDays && ` • ${daysDifference} ${t('common.days')}`}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.barChart}
        >
          {currentData.map((item: any, index: number) => {
            const height = (item.kWh / maxConsumption) * 100;
            const isCurrent = item.hourValue === currentHour;

            return (
              <View key={index} style={styles.barColumn}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${height}%`,
                        backgroundColor: isCurrent ? themeColors.primary : themeColors.text.disabled,
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: themeColors.text.secondary }]}>
                  {item.label}
                </Text>
                <Text style={[styles.barValue, {
                  color: isCurrent ? themeColors.primary : themeColors.text.secondary
                }]}>
                  {formatEnergy(item.kWh)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
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
  ), [currentData, maxConsumption, avgConsumption, totalConsumption, daysDifference, consumptionStartDate, consumptionEndDate, startHour, endHour, themeColors, t, formatEnergy, formatDateLabel]);

  // OPTIMIZED: Memoize chart width calculation
  const chartWidth = useMemo(() => {
    const baseWidth = screenWidth - spacing.lg * 2;
    const dataPointWidth = isRTL ? 60 : 50;
    return Math.max(baseWidth, graphLabels.length * dataPointWidth);
  }, [graphLabels.length, isRTL]);

  // OPTIMIZED: Memoize chart configuration
  const chartConfig = useMemo(() => ({
    backgroundGradientFrom: themeColors.surface,
    backgroundGradientTo: themeColors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(66, 165, 245, ${opacity})`,
    labelColor: (opacity = 1) => theme === 'dark'
      ? `rgba(255, 255, 255, ${opacity * 0.6})`
      : `rgba(0, 0, 0, ${opacity * 0.6})`,
    style: {
      borderRadius: borderRadius.medium,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '1',
    },
    propsForLabels: {
      fontSize: 9,
    },
  }), [themeColors.surface, theme]);

  // MEMOIZED: Expensive charts only re-render when data actually changes
  const parameterGraphs = useMemo(() => {
    // Use memoized values
    const labels = graphLabels;

    return (
      <View style={styles.graphsSection}>
        <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
          Parameter Trends
        </Text>
        <Text style={[styles.sectionSubtitle, { color: themeColors.text.secondary }]}>
          Analyze electrical parameters over time
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
            <View style={styles.graphStats}>
              <View style={styles.graphStat}>
                <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.max')}</Text>
                <Text style={[styles.graphStatValue, { color: themeColors.danger }]}>
                  {formatVoltage(Math.max(...voltageData))}
                </Text>
              </View>
              <View style={styles.graphStat}>
                <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.avg')}</Text>
                <Text style={[styles.graphStatValue, { color: themeColors.text.primary }]}>
                  {formatVoltage(voltageData.reduce((a, b) => a + b, 0) / voltageData.length)}
                </Text>
              </View>
              <View style={styles.graphStat}>
                <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.min')}</Text>
                <Text style={[styles.graphStatValue, { color: themeColors.success }]}>
                  {formatVoltage(Math.min(...voltageData))}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{
                labels: labels,
                datasets: [{ data: isRTL ? voltageData.slice().reverse() : voltageData }],
              }}
              width={chartWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(66, 165, 245, ${opacity})`, // Blue for voltage
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={false}
            />
          </ScrollView>

          <View style={[styles.safetyRange, { backgroundColor: themeColors.background }]}>
            <Text style={[styles.safetyRangeText, { color: themeColors.text.secondary }]}>
              Safe Range: 200V - 240V
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
            <View style={styles.graphStats}>
              <View style={styles.graphStat}>
                <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.max')}</Text>
                <Text style={[styles.graphStatValue, { color: themeColors.danger }]}>
                  {formatCurrent(Math.max(...currentTrendData))}
                </Text>
              </View>
              <View style={styles.graphStat}>
                <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.avg')}</Text>
                <Text style={[styles.graphStatValue, { color: themeColors.text.primary }]}>
                  {formatCurrent(currentTrendData.reduce((a, b) => a + b, 0) / currentTrendData.length)}
                </Text>
              </View>
              <View style={styles.graphStat}>
                <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.min')}</Text>
                <Text style={[styles.graphStatValue, { color: themeColors.success }]}>
                  {formatCurrent(Math.min(...currentTrendData))}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{
                labels: labels,
                datasets: [{ data: isRTL ? currentTrendData.slice().reverse() : currentTrendData }],
              }}
              width={chartWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(255, 167, 38, ${opacity})`, // Orange for current
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={true}
            />
          </ScrollView>

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
            <View style={styles.graphStats}>
              <View style={styles.graphStat}>
                <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.max')}</Text>
                <Text style={[styles.graphStatValue, { color: themeColors.danger }]}>
                  {formatPower(Math.max(...powerData))}
                </Text>
              </View>
              <View style={styles.graphStat}>
                <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.avg')}</Text>
                <Text style={[styles.graphStatValue, { color: themeColors.text.primary }]}>
                  {formatPower(powerData.reduce((a, b) => a + b, 0) / powerData.length)}
                </Text>
              </View>
              <View style={styles.graphStat}>
                <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.min')}</Text>
                <Text style={[styles.graphStatValue, { color: themeColors.success }]}>
                  {formatPower(Math.min(...powerData))}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{
                labels: labels,
                datasets: [{ data: isRTL ? powerData.slice().reverse() : powerData }],
              }}
              width={chartWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for power
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={true}
            />
          </ScrollView>
        </Card>

        {/* Power Factor Graph */}
        <Card style={[styles.graphCard, { backgroundColor: themeColors.surface }]}>
          <View style={styles.graphHeader}>
            <View style={styles.graphTitleRow}>
              <Ionicons name="analytics" size={20} color={themeColors.secondary} />
              <Text style={[styles.graphTitle, { color: themeColors.text.primary }]}>
                Power Factor
              </Text>
            </View>
            <View style={styles.graphStats}>
              <View style={styles.graphStat}>
                <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.max')}</Text>
                <Text style={[styles.graphStatValue, { color: themeColors.success }]}>
                  {formatPowerFactor(Math.max(...powerFactorData))}
                </Text>
              </View>
              <View style={styles.graphStat}>
                <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.avg')}</Text>
                <Text style={[styles.graphStatValue, { color: themeColors.text.primary }]}>
                  {formatPowerFactor(powerFactorData.reduce((a, b) => a + b, 0) / powerFactorData.length)}
                </Text>
              </View>
              <View style={styles.graphStat}>
                <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.min')}</Text>
                <Text style={[styles.graphStatValue, { color: themeColors.warning }]}>
                  {formatPowerFactor(Math.min(...powerFactorData))}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{
                labels: labels,
                datasets: [{ data: isRTL ? powerFactorData.slice().reverse() : powerFactorData }],
              }}
              width={chartWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`, // Purple for power factor
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={false}
            />
          </ScrollView>

          <View style={[styles.safetyRange, { backgroundColor: themeColors.background }]}>
            <Text style={[styles.safetyRangeText, { color: themeColors.text.secondary }]}>
              Good Range: 0.85 - 1.0
            </Text>
          </View>
        </Card>

        {/* Frequency Graph */}
        <Card style={[styles.graphCard, { backgroundColor: themeColors.surface }]}>
          <View style={styles.graphHeader}>
            <View style={styles.graphTitleRow}>
              <Ionicons name="pulse" size={20} color={themeColors.info} />
              <Text style={[styles.graphTitle, { color: themeColors.text.primary }]}>
                Frequency
              </Text>
            </View>
            <View style={styles.graphStats}>
              <View style={styles.graphStat}>
                <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.max')}</Text>
                <Text style={[styles.graphStatValue, { color: themeColors.danger }]}>
                  {formatFrequency(Math.max(...frequencyData))}
                </Text>
              </View>
              <View style={styles.graphStat}>
                <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.avg')}</Text>
                <Text style={[styles.graphStatValue, { color: themeColors.text.primary }]}>
                  {formatFrequency(frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length)}
                </Text>
              </View>
              <View style={styles.graphStat}>
                <Text style={[styles.graphStatLabel, { color: themeColors.text.secondary }]}>{t('events.graphs.stats.min')}</Text>
                <Text style={[styles.graphStatValue, { color: themeColors.success }]}>
                  {formatFrequency(Math.min(...frequencyData))}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{
                labels: labels,
                datasets: [{ data: isRTL ? frequencyData.slice().reverse() : frequencyData }],
              }}
              width={chartWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(0, 188, 212, ${opacity})`, // Cyan for frequency
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={false}
            />
          </ScrollView>

          <View style={[styles.safetyRange, { backgroundColor: themeColors.background }]}>
            <Text style={[styles.safetyRangeText, { color: themeColors.text.secondary }]}>
              Standard: 50 Hz ±0.5 Hz
            </Text>
          </View>
        </Card>
      </View>
    );
  }, [graphLabels, voltageData, currentTrendData, powerData, powerFactorData, frequencyData, chartWidth, chartConfig, isRTL, themeColors, t]);

  // Render date range picker
  const renderDateRangePicker = () => (
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
            setStartDate(oneWeekAgo);
            setEndDate(today);
          }}
          style={[styles.presetButton, { backgroundColor: themeColors.background, borderColor: themeColors.primary }]}
        >
          <Text style={[styles.presetButtonText, { color: themeColors.text.primary }]}>
            Last Week
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const today = new Date();
            const oneMonthAgo = new Date();
            oneMonthAgo.setDate(oneMonthAgo.getDate() - 29);
            setStartDate(oneMonthAgo);
            setEndDate(today);
          }}
          style={[styles.presetButton, { backgroundColor: themeColors.background, borderColor: themeColors.primary }]}
        >
          <Text style={[styles.presetButtonText, { color: themeColors.text.primary }]}>
            Last Month
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
          value={startDate}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartDateChange}
          maximumDate={endDate}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndDateChange}
          minimumDate={startDate}
          maximumDate={new Date()}
        />
      )}
    </Card>
  );

  // Render safety events filter
  const renderSafetyFilters = () => (
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
  );

  // Render statistics card
  const renderStatistics = () => (
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
            Outages
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.warning }]}>
            {formatDurationShort(stats.averageOutageDuration)}
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
            Avg Duration
          </Text>
        </View>
      </View>
    </Card>
  );

  // Render event item
  const renderEventItem = ({ item }: { item: typeof events[0] }) => {
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
  };

  // Filter events by selected types and date range
  const filteredEvents = events.filter(event => {
    // Check date range
    const eventDate = new Date(event.timestamp);
    const isInDateRange = eventDate >= startDate && eventDate <= endDate;

    // Check event type filter
    const matchesType = selectedEventTypes.length === 0 || selectedEventTypes.includes(event.type);

    return isInDateRange && matchesType;
  });

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
            {consumptionOverview}

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
                    No events found
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
              <TouchableOpacity onPress={() => setShowDateRangeModal(false)}>
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
                  Last Week
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
                  Last Month
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
              onPress={() => setShowDateRangeModal(false)}
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
              <TouchableOpacity onPress={() => setShowHourRangeModal(false)}>
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
                  setStartHour(0);
                  setEndHour(23);
                }}
                style={[styles.hourPresetButton, { backgroundColor: themeColors.background, borderColor: themeColors.info }]}
              >
                <Text style={[styles.hourPresetText, { color: themeColors.text.primary }]}>
                  {t('events.consumption.hourPresets.fullDay')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setStartHour(6);
                  setEndHour(18);
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
                  setStartHour(18);
                  setEndHour(23);
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
                  setStartHour(Math.max(0, now - 3));
                  setEndHour(now);
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
                  onPress={() => setStartHour(Math.max(0, startHour - 1))}
                  style={[styles.hourButton, { backgroundColor: themeColors.background, borderColor: themeColors.info }]}
                >
                  <Ionicons name="remove" size={22} color={themeColors.info} />
                </TouchableOpacity>
                <View style={[styles.hourDisplay, { backgroundColor: themeColors.background, borderColor: themeColors.info }]}>
                  <Text style={[styles.hourDisplayText, { color: themeColors.text.primary }]}>
                    {startHour.toString().padStart(2, '0')}:00
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setStartHour(Math.min(endHour, startHour + 1))}
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
                  onPress={() => setEndHour(Math.max(startHour, endHour - 1))}
                  style={[styles.hourButton, { backgroundColor: themeColors.background, borderColor: themeColors.info }]}
                >
                  <Ionicons name="remove" size={22} color={themeColors.info} />
                </TouchableOpacity>
                <View style={[styles.hourDisplay, { backgroundColor: themeColors.background, borderColor: themeColors.info }]}>
                  <Text style={[styles.hourDisplayText, { color: themeColors.text.primary }]}>
                    {endHour.toString().padStart(2, '0')}:00
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setEndHour(Math.min(23, endHour + 1))}
                  style={[styles.hourButton, { backgroundColor: themeColors.background, borderColor: themeColors.info }]}
                >
                  <Ionicons name="add" size={22} color={themeColors.info} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              onPress={() => setShowHourRangeModal(false)}
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
          value={consumptionStartDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onConsumptionStartDateChange}
          maximumDate={consumptionEndDate}
        />
      )}

      {showConsumptionEndPicker && (
        <DateTimePicker
          value={consumptionEndDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onConsumptionEndDateChange}
          minimumDate={consumptionStartDate}
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
});
