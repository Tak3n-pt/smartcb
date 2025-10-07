// Beautiful, High-Performance Line Chart using Skia
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import i18n from '../../i18n';
import { Canvas, Path, LinearGradient, vec, Skia, Line } from '@shopify/react-native-skia';
import { colors as themeColors } from '../../theme';

interface SkiaLineChartProps {
  data: number[];
  title: string;
  color?: string;
  unit?: string;
  height?: number;
  animated?: boolean;
  theme?: 'dark' | 'light';
  showStats?: boolean;
  min?: number;
  max?: number;
  average?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const SkiaLineChartComponent: React.FC<SkiaLineChartProps> = ({
  data,
  title,
  color = '#42A5F5',
  unit = '',
  height = 200,
  animated = false,
  theme = 'dark',
  showStats = true,
  min,
  max,
  average,
}) => {
  const colors = themeColors[theme];

  // Get chart dimensions
  const chartWidth = useMemo(() => screenWidth - 64, []); // Account for padding
  const chartHeight = height - 40; // Account for padding

  // Calculate path points
  const { linePath, fillPath, gridLines } = useMemo(() => {
    if (!data || data.length === 0) {
      return { linePath: null, fillPath: null, gridLines: [] };
    }

    const minValue = min ?? Math.min(...data);
    const maxValue = max ?? Math.max(...data);
    const valueRange = maxValue - minValue || 1;

    // Create line path
    const path = Skia.Path.Make();
    const fillPath = Skia.Path.Make();

    // Calculate points
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * chartWidth;
      const y = chartHeight - ((value - minValue) / valueRange) * chartHeight;
      return { x, y };
    });

    // Draw line
    if (points.length > 0) {
      path.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        path.lineTo(points[i].x, points[i].y);
      }
    }

    // Create fill path (for gradient)
    if (points.length > 0) {
      fillPath.moveTo(points[0].x, chartHeight);
      fillPath.lineTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        fillPath.lineTo(points[i].x, points[i].y);
      }
      fillPath.lineTo(points[points.length - 1].x, chartHeight);
      fillPath.close();
    }

    // Generate grid lines
    const lines = [];
    for (let i = 0; i <= 4; i++) {
      const y = (chartHeight / 4) * i;
      lines.push(y);
    }

    return { linePath: path, fillPath, gridLines: lines };
  }, [data, chartWidth, chartHeight, min, max]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return { min: 0, max: 0, avg: 0 };
    }

    const dataMin = min ?? Math.min(...data);
    const dataMax = max ?? Math.max(...data);
    const dataAvg = average ?? data.reduce((a, b) => a + b, 0) / data.length;

    return {
      min: dataMin.toFixed(1),
      max: dataMax.toFixed(1),
      avg: dataAvg.toFixed(1),
    };
  }, [data, min, max, average]);

  if (!linePath || !fillPath) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
        <View style={[styles.emptyContainer, { height }]}>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            {i18n.t('events.eventsList.empty')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {!!title && (
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
          {showStats && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                  {i18n.t('events.graphs.stats.max')}
                </Text>
                <Text style={[styles.statValue, { color: colors.danger }]}>
                  {stats.max}{unit}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                  {i18n.t('events.graphs.stats.avg')}
                </Text>
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {stats.avg}{unit}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                  {i18n.t('events.graphs.stats.min')}
                </Text>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {stats.min}{unit}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
      {!title && showStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              {i18n.t('events.graphs.stats.max')}
            </Text>
            <Text style={[styles.statValue, { color: colors.danger }]}>
              {stats.max}{unit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              {i18n.t('events.graphs.stats.avg')}
            </Text>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {stats.avg}{unit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              {i18n.t('events.graphs.stats.min')}
            </Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {stats.min}{unit}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.chartContainer}>
        <Canvas style={{ width: chartWidth, height: height }}>
          {/* Grid lines */}
          {gridLines.map((y, index) => (
            <Line
              key={`grid-${index}`}
              p1={vec(0, y + 20)}
              p2={vec(chartWidth, y + 20)}
              color={colors.border}
              style="stroke"
              strokeWidth={0.5}
              opacity={0.2}
            />
          ))}

          {/* Gradient fill under the line */}
          <Path path={fillPath}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, chartHeight)}
              colors={[color + '50', color + '10', colors.surface + '00']}
            />
          </Path>

          {/* Main line */}
          <Path
            path={linePath}
            color={color}
            style="stroke"
            strokeWidth={3}
            strokeCap="round"
            strokeJoin="round"
          />
        </Canvas>
      </View>
    </View>
  );
};

export const SkiaLineChart = React.memo(SkiaLineChartComponent);

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  chartContainer: {
    marginTop: 8,
    marginHorizontal: -8, // Extend chart to edges
  },
  chart: {
    width: '100%',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});

export default SkiaLineChart;
