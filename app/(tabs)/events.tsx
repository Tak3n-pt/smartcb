// Events/Log Screen with Advanced Filtering

import React, { useState } from 'react';
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
import { useEventsStore, useThemeStore, useElectricalStore } from '../../store';
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
  getEventIcon,
  getEventColor,
} from '../../utils';
import { EventType } from '../../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

type TimeRange = 'hour' | 'day' | 'week' | 'month' | 'custom';
type ConsumptionView = 'hourly' | 'daily' | 'weekly' | 'monthly';

export default function EventsScreen() {
  const { filter, setFilter, getFilteredEvents, getStatistics } = useEventsStore();
  const { theme } = useThemeStore();
  const { data } = useElectricalStore();
  const themeColors = colors[theme];
  const { t } = useTranslation();

  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [consumptionView, setConsumptionView] = useState<ConsumptionView>('daily');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [selectedEventTypes, setSelectedEventTypes] = useState<EventType[]>([]);

  // Event date range filter states
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // 7 days ago
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Consumption date range filter states
  const [consumptionStartDate, setConsumptionStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [consumptionEndDate, setConsumptionEndDate] = useState(new Date());
  const [showConsumptionStartPicker, setShowConsumptionStartPicker] = useState(false);
  const [showConsumptionEndPicker, setShowConsumptionEndPicker] = useState(false);

  const events = getFilteredEvents();
  const stats = getStatistics();

  // Get current hour for highlighting
  const currentHour = new Date().getHours();

  // Mock hourly consumption (for today)
  const hourlyConsumption = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    hourValue: i,
    kWh: Math.random() * 0.8 + 0.2,
  }));

  // Mock daily consumption (for this week)
  const dailyConsumption = [
    { dayKey: 'monday', kWh: 8.2 },
    { dayKey: 'tuesday', kWh: 9.5 },
    { dayKey: 'wednesday', kWh: 7.8 },
    { dayKey: 'thursday', kWh: 10.2 },
    { dayKey: 'friday', kWh: 9.1 },
    { dayKey: 'saturday', kWh: 6.5 },
    { dayKey: 'sunday', kWh: 5.8 },
  ];

  // Mock weekly consumption (for this month)
  const weeklyConsumption = [
    { weekNumber: 1, kWh: 52.3 },
    { weekNumber: 2, kWh: 48.7 },
    { weekNumber: 3, kWh: 55.1 },
    { weekNumber: 4, kWh: 51.2 },
  ];

  // Mock monthly consumption (for this year)
  const monthlyConsumption = [
    { monthIndex: 0, kWh: 210.5 },
    { monthIndex: 1, kWh: 195.3 },
    { monthIndex: 2, kWh: 225.8 },
    { monthIndex: 3, kWh: 207.3 },
  ];

  const monthKeyOrder = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  // Generate realistic time-series data for electrical parameters
  const generateTimeSeriesData = (points: number, baseValue: number, variance: number, includeSpike: boolean = false) => {
    const data = [];
    for (let i = 0; i < points; i++) {
      let value = baseValue + (Math.random() - 0.5) * variance;

      // Add realistic spike at a random point (simulating overvoltage/overcurrent)
      if (includeSpike && i === Math.floor(points * 0.6)) {
        value = baseValue + variance * 2.5; // Spike to unsafe level
      }

      // Add smooth variations (sine wave for more realistic curves)
      value += Math.sin(i / points * Math.PI * 2) * variance * 0.3;

      data.push(parseFloat(value.toFixed(2)));
    }
    return data;
  };

  // Mock voltage data (normal: 220V ±10V, with occasional spike)
  const voltageData = generateTimeSeriesData(
    consumptionView === 'hourly' ? 24 :
    consumptionView === 'daily' ? 7 :
    consumptionView === 'weekly' ? 4 : 12,
    220, // base voltage
    8,   // variance
    true // include spike
  );

  // Mock current trend data (normal: 2-4A, with occasional spike)
  const currentTrendData = generateTimeSeriesData(
    consumptionView === 'hourly' ? 24 :
    consumptionView === 'daily' ? 7 :
    consumptionView === 'weekly' ? 4 : 12,
    3,   // base current
    1.5, // variance
    true // include spike
  );

  // Mock power data (calculated-ish, varies with load)
  const powerData = generateTimeSeriesData(
    consumptionView === 'hourly' ? 24 :
    consumptionView === 'daily' ? 7 :
    consumptionView === 'weekly' ? 4 : 12,
    660,  // base power (220V * 3A)
    200,  // variance
    false
  );

  // Generate labels for graphs based on view
  const getGraphLabels = () => {
    switch (consumptionView) {
      case 'hourly':
        return hourlyConsumption.map((item) => item.hour);
      case 'daily':
        return dailyConsumption.map((item) => t(`settings.schedule.daysOfWeek.${item.dayKey}`));
      case 'weekly':
        return weeklyConsumption.map((item) =>
          t('events.consumption.weekAbbreviation', { count: item.weekNumber })
        );
      case 'monthly':
        return monthlyConsumption.map((item) =>
          t(`common.months.short.${monthKeyOrder[item.monthIndex]}`)
        );
      default:
        return [];
    }
  };

  // Get current consumption data based on view
  const getCurrentConsumptionData = () => {
    switch (consumptionView) {
      case 'hourly':
        return hourlyConsumption.map((item) => ({ ...item, label: item.hour }));
      case 'daily':
        return dailyConsumption.map((item) => ({
          ...item,
          label: t(`settings.schedule.daysOfWeek.${item.dayKey}`),
        }));
      case 'weekly':
        return weeklyConsumption.map((item) => ({
          ...item,
          label: t('events.consumption.weekLabel', { count: item.weekNumber }),
          shortLabel: t('events.consumption.weekAbbreviation', { count: item.weekNumber }),
        }));
      case 'monthly':
        return monthlyConsumption.map((item) => ({
          ...item,
          label: t(`common.months.short.${monthKeyOrder[item.monthIndex]}`),
        }));
      default:
        return dailyConsumption.map((item) => ({
          ...item,
          label: t(`settings.schedule.daysOfWeek.${item.dayKey}`),
        }));
    }
  };

  const currentData = getCurrentConsumptionData();
  const maxConsumption = Math.max(...currentData.map((d: any) => d.kWh));
  const totalConsumption = currentData.reduce((sum: number, d: any) => sum + d.kWh, 0);
  const avgConsumption = totalConsumption / currentData.length;

  // Safety event types
  const safetyEventTypes: Array<{ label: string; value: EventType; icon: string }> = [
    { label: t('events.safetyFilter.types.overvoltage'), value: 'overvoltage', icon: 'arrow-up-circle' },
    { label: t('events.safetyFilter.types.undervoltage'), value: 'undervoltage', icon: 'arrow-down-circle' },
    { label: t('events.safetyFilter.types.overcurrent'), value: 'overcurrent', icon: 'speedometer' },
    { label: t('events.safetyFilter.types.overload'), value: 'overload', icon: 'warning' },
    { label: t('events.safetyFilter.types.outage'), value: 'outage', icon: 'flash-off' },
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

  // Render consumption overview with time range selection
  const renderConsumptionOverview = () => (
    <Card style={[styles.consumptionCard, { backgroundColor: themeColors.surface }]}>
      <View style={styles.consumptionHeader}>
        <View style={styles.consumptionTitleRow}>
          <MaterialCommunityIcons name="lightning-bolt" size={24} color={themeColors.primary} />
          <Text style={[styles.sectionTitle, { color: themeColors.text.primary, marginBottom: 0, marginLeft: spacing.sm }]}>
            {t('events.consumption.title')}
          </Text>
        </View>
      </View>

      {/* Consumption View Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.viewSelectorScroll}
        contentContainerStyle={styles.viewSelector}
      >
        {(['hourly', 'daily', 'weekly', 'monthly'] as ConsumptionView[]).map(view => (
          <TouchableOpacity
            key={view}
            onPress={() => setConsumptionView(view)}
            style={[
              styles.viewButton,
              {
                backgroundColor: consumptionView === view ? themeColors.primary : themeColors.background,
                borderColor: consumptionView === view ? themeColors.primary : themeColors.border,
              }
            ]}
          >
            <Text style={[
              styles.viewButtonText,
              { color: consumptionView === view ? themeColors.text.inverse : themeColors.text.secondary }
            ]}>
              {t(`events.consumption.views.${view}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Consumption Date Range Selector */}
      <View style={styles.consumptionDateRange}>
        <Text style={[styles.dateRangeSectionLabel, { color: themeColors.text.secondary }]}>
          {t('events.consumption.dateRange')}
        </Text>
        <View style={styles.consumptionDateRow}>
          {/* Consumption Start Date */}
          <View style={styles.consumptionDateItem}>
            <Text style={[styles.consumptionDateLabel, { color: themeColors.text.secondary }]}>
              {t('common.from')}
            </Text>
            <TouchableOpacity
              onPress={() => setShowConsumptionStartPicker(true)}
              style={[styles.consumptionDateButton, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
            >
              <Ionicons name="calendar-outline" size={14} color={themeColors.primary} />
              <Text style={[styles.consumptionDateText, { color: themeColors.text.primary }]}>
                {formatDateLabel(consumptionStartDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Consumption End Date */}
          <View style={styles.consumptionDateItem}>
            <Text style={[styles.consumptionDateLabel, { color: themeColors.text.secondary }]}>
              {t('common.to')}
            </Text>
            <TouchableOpacity
              onPress={() => setShowConsumptionEndPicker(true)}
              style={[styles.consumptionDateButton, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
            >
              <Ionicons name="calendar-outline" size={14} color={themeColors.primary} />
              <Text style={[styles.consumptionDateText, { color: themeColors.text.primary }]}>
                {formatDateLabel(consumptionEndDate)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Consumption Date Pickers */}
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
      </View>

      {/* Current Total Energy */}
      <View style={[styles.currentEnergyCard, { backgroundColor: themeColors.primaryLight }]}>
        <View style={styles.currentEnergyContent}>
          <View style={styles.currentEnergyLeft}>
            <Text style={[styles.currentEnergyLabel, { color: themeColors.text.secondary }]}>
              {t('events.consumption.total')} ({t(`events.consumption.views.${consumptionView}`)})
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
          {t(`events.graphs.breakdown.${consumptionView}`)}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.barChart}
        >
          {currentData.map((item: any, index: number) => {
            const height = (item.kWh / maxConsumption) * 100;
            // For hourly view, highlight current hour; for others, highlight last item
            const isCurrent = consumptionView === 'hourly'
              ? item.hourValue === currentHour
              : index === currentData.length - 1;

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
  );

  // Render electrical parameters graphs (voltage, current, power curves)
  const renderParameterGraphs = () => {
    const labels = getGraphLabels();
    const chartWidth = screenWidth - spacing.lg * 2;

    // Common chart configuration
    const chartConfig = {
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
        strokeWidth: '2',
      },
      propsForBackgroundLines: {
        strokeDasharray: '', // solid background lines
        stroke: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
    };

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
                labels: labels.length > 12 ? labels.filter((_, i) => i % 2 === 0) : labels,
                datasets: [{ data: voltageData }],
              }}
              width={chartWidth < 400 ? 400 : chartWidth}
              height={200}
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
                labels: labels.length > 12 ? labels.filter((_, i) => i % 2 === 0) : labels,
                datasets: [{ data: currentTrendData }],
              }}
              width={chartWidth < 400 ? 400 : chartWidth}
              height={200}
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
                labels: labels.length > 12 ? labels.filter((_, i) => i % 2 === 0) : labels,
                datasets: [{ data: powerData }],
              }}
              width={chartWidth < 400 ? 400 : chartWidth}
              height={200}
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
      </View>
    );
  };

  // Render date range picker
  const renderDateRangePicker = () => (
    <Card style={[styles.dateRangeCard, { backgroundColor: themeColors.surface }]}>
      <View style={styles.dateRangeHeader}>
        <Ionicons name="calendar" size={20} color={themeColors.primary} />
        <Text style={[styles.dateRangeTitle, { color: themeColors.text.primary }]}>
          {t('events.dateFilter.title')}
        </Text>
      </View>

      <View style={styles.dateRangeRow}>
        {/* Start Date */}
        <View style={styles.dateRangeItem}>
          <Text style={[styles.dateRangeLabel, { color: themeColors.text.secondary }]}>
            From
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
            To
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
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text.primary }]}>
          {t('events.title')}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Energy Consumption Overview */}
        {renderConsumptionOverview()}

        {/* Electrical Parameter Graphs (Voltage, Current, Power Curves) */}
        {renderParameterGraphs()}

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...typography.h2,
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
    marginBottom: spacing.md,
  },
  consumptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
});
