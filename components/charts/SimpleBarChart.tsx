// Simple Bar Chart using react-native-chart-kit (Works with Expo Go)
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { colors as themeColors } from '../../theme';

interface BarData {
  label: string;
  value: number;
  highlight?: boolean;
}

interface SimpleBarChartProps {
  data: BarData[];
  maxValue: number;
  height?: number;
  theme?: 'dark' | 'light';
  primaryColor?: string;
  highlightColor?: string;
  formatValue?: (value: number) => string;
}

const { width: screenWidth } = Dimensions.get('window');

export const SimpleBarChart: React.FC<SimpleBarChartProps> = React.memo(({
  data,
  maxValue,
  height = 220,
  theme = 'dark',
  primaryColor = '#42A5F5',
  highlightColor = '#2196F3',
  formatValue = (v) => v.toFixed(2),
}) => {
  const colors = themeColors[theme];

  if (!data || data.length === 0) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.text.secondary }}>No data available</Text>
      </View>
    );
  }

  // Prepare data for react-native-chart-kit - MEMOIZED to prevent infinite loops
  const chartData = useMemo(() => ({
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.value),
      },
    ],
  }), [data]);

  // Calculate width based on data length - MEMOIZED
  const chartWidth = useMemo(() => Math.max(screenWidth - 32, data.length * 60), [data.length]);

  // Memoize chartConfig to prevent recreation on every render
  const chartConfig = useMemo(() => ({
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 2,
    color: () => primaryColor,
    labelColor: () => colors.text.secondary,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.5,
    propsForLabels: {
      fontSize: 10,
    },
  }), [colors.surface, colors.text.secondary, primaryColor]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollContainer}
    >
      <BarChart
        data={chartData}
        width={chartWidth}
        height={height}
        yAxisLabel=""
        yAxisSuffix=""
        yAxisInterval={1}
        chartConfig={chartConfig}
        style={styles.chart}
        showValuesOnTopOfBars={true}
        fromZero={true}
      />
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 0,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default SimpleBarChart;