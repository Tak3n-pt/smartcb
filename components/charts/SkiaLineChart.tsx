// Modern Line Chart with Timeline and Single Point Support
import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import i18n from '../../i18n';
import { Canvas, Path, LinearGradient, vec, Skia, Line, Circle, Text as SkiaText, matchFont } from '@shopify/react-native-skia';
import { colors as themeColors } from '../../theme';

let renderCount = 0;

interface SkiaLineChartProps {
  data: number[];
  timestamps?: number[]; // Array of timestamps for each data point
  title: string;
  color?: string;
  unit?: string;
  height?: number;
  animated?: boolean;
  theme?: 'dark' | 'light';
  showStats?: boolean;
  showTimeline?: boolean; // Show timeline axis (bottom)
  showYAxis?: boolean; // Show Y-axis labels (left side)
  min?: number;
  max?: number;
  average?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const SkiaLineChartComponent: React.FC<SkiaLineChartProps> = ({
  data,
  timestamps,
  title,
  color = '#42A5F5',
  unit = '',
  height = 220,
  animated = false,
  theme = 'dark',
  showStats = true,
  showTimeline = true,
  showYAxis = true,
  min,
  max,
  average,
}) => {
  const colors = useMemo(() => themeColors[theme], [theme]);

  // PERFORMANCE FIX: Calculate dimensions once - these are constant
  const yAxisWidth = showYAxis ? 45 : 0;
  const chartWidth = screenWidth - 64 - yAxisWidth;
  const chartHeight = height - (showTimeline ? 100 : 60);

  // Performance monitoring
  useEffect(() => {
    renderCount++;
  }, [data.length]);

  // Generate timeline labels
  const timelineLabels = useMemo(() => {
    if (!showTimeline || !timestamps || timestamps.length === 0) {
      return [];
    }

    const labels: Array<{ text: string; x: number }> = [];
    const labelCount = Math.min(5, data.length); // Max 5 labels

    if (labelCount === 0) return [];

    for (let i = 0; i < labelCount; i++) {
      const index = Math.floor((i / (labelCount - 1)) * (timestamps.length - 1));
      const ts = timestamps[index];
      const date = new Date(ts);

      // Format time based on data range
      const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
      let text: string;

      if (timeSpan < 3600000) {
        // Less than 1 hour - show HH:MM:SS
        text = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      } else if (timeSpan < 86400000) {
        // Less than 1 day - show HH:MM
        text = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      } else {
        // Multiple days - show MM/DD HH:MM
        text = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }

      const x = (index / (data.length - 1)) * chartWidth;
      labels.push({ text, x });
    }

    return labels;
  }, [timestamps, data.length, chartWidth, showTimeline]);

  // Generate Y-axis labels (left side)
  const yAxisLabels = useMemo(() => {
    if (!showYAxis || !data || data.length === 0) {
      return [];
    }

    const minValue = min ?? Math.min(...data);
    const maxValue = max ?? Math.max(...data);
    const labels: Array<{ text: string; y: number }> = [];
    const labelCount = 5; // 5 labels on Y-axis

    for (let i = 0; i < labelCount; i++) {
      const value = maxValue - ((maxValue - minValue) / (labelCount - 1)) * i;
      const y = (chartHeight / (labelCount - 1)) * i;

      // Format based on value range for better readability
      let text: string;
      if (Math.abs(value) >= 1000) {
        text = (value / 1000).toFixed(1) + 'k'; // e.g., 1.5k
      } else if (Math.abs(value) >= 100) {
        text = value.toFixed(0); // e.g., 220
      } else if (Math.abs(value) >= 10) {
        text = value.toFixed(1); // e.g., 15.2
      } else {
        text = value.toFixed(2); // e.g., 0.95
      }

      labels.push({ text, y });
    }

    return labels;
  }, [data, chartHeight, showYAxis, min, max]);

  // Calculate chart rendering data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    const minValue = min ?? Math.min(...data);
    const maxValue = max ?? Math.max(...data);
    const valueRange = maxValue - minValue || 1;

    // For single data point, show as a dot in the center
    if (data.length === 1) {
      return {
        isSinglePoint: true,
        point: {
          x: chartWidth / 2,
          y: chartHeight / 2,
          value: data[0]
        },
        minValue,
        maxValue,
        valueRange
      };
    }

    // Multiple points - create paths
    const path = Skia.Path.Make();
    const fillPath = Skia.Path.Make();
    const points: Array<{x: number; y: number; value: number}> = [];

    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * chartWidth;
      const y = chartHeight - ((value - minValue) / valueRange) * chartHeight;
      points.push({ x, y, value });

      if (index === 0) {
        path.moveTo(x, y);
        fillPath.moveTo(x, chartHeight);
        fillPath.lineTo(x, y);
      } else {
        path.lineTo(x, y);
        fillPath.lineTo(x, y);
      }
    });

    // Close fill path
    fillPath.lineTo(points[points.length - 1].x, chartHeight);
    fillPath.close();

    return {
      isSinglePoint: false,
      linePath: path,
      fillPath,
      points,
      minValue,
      maxValue,
      valueRange
    };
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

  // Generate grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= 4; i++) {
      const y = (chartHeight / 4) * i;
      lines.push(y);
    }
    return lines;
  }, [chartHeight]);

  if (!chartData) {
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
        {/* Y-axis labels (left side) */}
        {showYAxis && yAxisLabels.length > 0 && (
          <View style={[styles.yAxisContainer, { width: 45 }]}>
            {yAxisLabels.map((label, index) => (
              <Text
                key={`yaxis-${index}`}
                style={[
                  styles.yAxisLabel,
                  { color: colors.text.secondary, top: label.y + 30 }
                ]}
                numberOfLines={1}
              >
                {label.text}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.chartCanvasContainer}>
          <Canvas style={{ width: chartWidth, height: height }}>
          {/* Grid lines */}
          {gridLines.map((y, index) => (
            <Line
              key={`grid-${index}`}
              p1={vec(0, y + 30)}
              p2={vec(chartWidth, y + 30)}
              color={colors.border}
              style="stroke"
              strokeWidth={0.5}
              opacity={0.15}
            />
          ))}

          {/* Single point display */}
          {chartData.isSinglePoint && chartData.point && (
            <>
              {/* Glow effect */}
              <Circle
                cx={chartData.point.x}
                cy={chartData.point.y + 30}
                r={16}
                color={color}
                opacity={0.2}
              />
              <Circle
                cx={chartData.point.x}
                cy={chartData.point.y + 30}
                r={12}
                color={color}
                opacity={0.4}
              />
              {/* Main dot */}
              <Circle
                cx={chartData.point.x}
                cy={chartData.point.y + 30}
                r={8}
                color={color}
              />
              <Circle
                cx={chartData.point.x}
                cy={chartData.point.y + 30}
                r={4}
                color={colors.surface}
              />
            </>
          )}

          {/* Multiple points display */}
          {!chartData.isSinglePoint && chartData.fillPath && chartData.linePath && (
            <>
              {/* Gradient fill under the line */}
              <Path path={chartData.fillPath}>
                <LinearGradient
                  start={vec(0, 30)}
                  end={vec(0, chartHeight + 30)}
                  colors={[color + '40', color + '15', colors.surface + '00']}
                />
              </Path>

              {/* Main line with shadow */}
              <Path
                path={chartData.linePath}
                color={color + '30'}
                style="stroke"
                strokeWidth={5}
                strokeCap="round"
                strokeJoin="round"
              />
              <Path
                path={chartData.linePath}
                color={color}
                style="stroke"
                strokeWidth={3}
                strokeCap="round"
                strokeJoin="round"
              />

              {/* Dots removed per user request */}
            </>
          )}
        </Canvas>

          {/* Timeline labels */}
          {showTimeline && timelineLabels.length > 0 && (
            <View style={styles.timelineContainer}>
              {timelineLabels.map((label, index) => (
                <Text
                  key={`timeline-${index}`}
                  style={[
                    styles.timelineLabel,
                    { color: colors.text.secondary, left: label.x - 30 }
                  ]}
                  numberOfLines={1}
                >
                  {label.text}
                </Text>
              ))}
            </View>
          )}

          {/* Value label for single point */}
          {chartData.isSinglePoint && chartData.point && (
            <View style={styles.singlePointLabel}>
              <Text style={[styles.singlePointValue, { color: colors.text.primary }]}>
                {chartData.point.value.toFixed(1)}{unit}
              </Text>
              <Text style={[styles.singlePointText, { color: colors.text.secondary }]}>
                {i18n.t('events.graphs.waitingForData')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export const SkiaLineChart = React.memo(SkiaLineChartComponent);

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
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
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartContainer: {
    marginTop: 8,
    position: 'relative',
    flexDirection: 'row',
  },
  yAxisContainer: {
    position: 'relative',
    justifyContent: 'center',
    paddingRight: 5,
  },
  yAxisLabel: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'right',
    width: '100%',
  },
  chartCanvasContainer: {
    flex: 1,
    position: 'relative',
  },
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    height: 30,
    position: 'relative',
  },
  timelineLabel: {
    position: 'absolute',
    fontSize: 10,
    width: 60,
    textAlign: 'center',
  },
  singlePointLabel: {
    position: 'absolute',
    top: '10%',
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  singlePointValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  singlePointText: {
    fontSize: 12,
    fontStyle: 'italic',
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
