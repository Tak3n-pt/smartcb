// Simple Line Chart using react-native-chart-kit (Works with Expo Go)
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors as themeColors } from '../../theme';

interface SimpleLineChartProps {
  data: number[];
  title?: string;
  color?: string;
  unit?: string;
  height?: number;
  theme?: 'dark' | 'light';
  showStats?: boolean;
  min?: number;
  max?: number;
  average?: number;
  animated?: boolean; // Added for compatibility but ignored
}

const { width: screenWidth } = Dimensions.get('window');

export const SimpleLineChart: React.FC<SimpleLineChartProps> = React.memo(({
  data,
  title,
  color = '#42A5F5',
  unit = '',
  height = 200,
  theme = 'dark',
  showStats = true,
  min,
  max,
  average,
}) => {
  const colors = themeColors[theme];

  // Ensure we have data to display
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        {title && (
          <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
        )}
        <View style={[styles.emptyContainer, { height }]}>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            No data available
          </Text>
        </View>
      </View>
    );
  }

  // Calculate stats - MEMOIZED to prevent infinite loops
  const { dataMin, dataMax, dataAvg } = useMemo(() => ({
    dataMin: min ?? Math.min(...data),
    dataMax: max ?? Math.max(...data),
    dataAvg: average ?? data.reduce((a, b) => a + b, 0) / data.length,
  }), [data, min, max, average]);

  // Prepare chart data - MEMOIZED to prevent infinite loops
  const chartData = useMemo(() => ({
    labels: data.length > 10
      ? data.map((_, i) => i % Math.ceil(data.length / 5) === 0 ? `${i}` : '').filter(Boolean)
      : data.map((_, i) => `${i}`),
    datasets: [
      {
        data: data,
        color: () => color,
        strokeWidth: 2,
      },
    ],
  }), [data, color]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {title && (
        <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
      )}

      {showStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Max</Text>
            <Text style={[styles.statValue, { color: colors.danger }]}>
              {dataMax.toFixed(1)}{unit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Avg</Text>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {dataAvg.toFixed(1)}{unit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Min</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {dataMin.toFixed(1)}{unit}
            </Text>
          </View>
        </View>
      )}

      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={height}
        chartConfig={useMemo(() => ({
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 1,
          color: () => color,
          labelColor: () => colors.text.secondary,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '3',
            strokeWidth: '1',
            stroke: color,
          },
        }), [colors.surface, colors.text.secondary, color])}
        bezier
        style={styles.chart}
        withInnerLines={false}
        withOuterLines={true}
        withHorizontalLabels={true}
        withVerticalLabels={false}
        withDots={data.length <= 20}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  chart: {
    marginLeft: -16,
    borderRadius: 16,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});

export default SimpleLineChart;