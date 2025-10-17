// Beautiful Bar Chart using React Native Skia
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import i18n from '../../i18n';
import { Canvas, RoundedRect, Group } from '@shopify/react-native-skia';
import { colors as themeColors } from '../../theme';

interface BarData {
  label: string;
  value: number;
  highlight?: boolean;
}

interface SkiaBarChartProps {
  data: BarData[];
  maxValue: number;
  height?: number;
  barWidth?: number;
  spacing?: number;
  primaryColor?: string;
  highlightColor?: string;
  theme?: 'dark' | 'light';
  formatValue?: (value: number) => string;
}

const SkiaBarChartComponent: React.FC<SkiaBarChartProps> = ({
  data,
  maxValue,
  height = 120,
  barWidth = 40,
  spacing = 8,
  primaryColor = '#42A5F5',
  highlightColor = '#2196F3',
  theme = 'dark',
  formatValue = (v) => v.toFixed(2),
}) => {
  // CRITICAL FIX: Memoize colors to prevent new object on every render
  const colors = useMemo(() => themeColors[theme], [theme]);
  const hasData = Array.isArray(data) && data.length > 0 && maxValue > 0;
  const safeMax = Math.max(1e-6, maxValue || 0);
  const chartWidth = (hasData ? data.length : 1) * (barWidth + spacing) + spacing;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollContainer}
    >
      <View style={{ width: chartWidth }}>
        {!hasData ? (
          <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.text.secondary }}>{i18n.t('events.eventsList.empty')}</Text>
          </View>
        ) : (
          <Canvas style={{ height, width: chartWidth }}>
            {data.map((item, index) => {
              const barHeight = (item.value / safeMax) * (height - 40);
              const x = spacing + index * (barWidth + spacing);
              const y = height - barHeight - 30;
              const isHighlight = item.highlight;
              const barColor = isHighlight ? highlightColor : primaryColor;

              return (
                <Group key={index}>
                  {/* Bar with gradient effect */}
                  <RoundedRect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    r={4}
                    color={barColor}
                    opacity={isHighlight ? 1 : 0.7}
                  />

                  {/* Top rounded cap for modern look */}
                  <RoundedRect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={8}
                    r={4}
                    color={barColor}
                  />
                </Group>
              );
            })}
          </Canvas>
        )}

        {hasData && (
          <View style={styles.labelsContainer}>
            {data.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.labelContainer,
                  { width: barWidth, marginRight: spacing }
                ]}
              >
                <Text style={[styles.label, { color: colors.text.secondary }]}>
                  {item.label}
                </Text>
                <Text style={[
                  styles.value,
                  {
                    color: item.highlight ? highlightColor : colors.text.primary,
                    fontWeight: item.highlight ? 'bold' : 'normal',
                  }
                ]}>
                  {formatValue(item.value)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export const SkiaBarChart = React.memo(SkiaBarChartComponent);

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 0,
  },
  labelsContainer: {
    flexDirection: 'row',
    paddingLeft: 8,
    marginTop: 4,
  },
  labelContainer: {
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    marginBottom: 2,
  },
  value: {
    fontSize: 9,
  },
});

export default SkiaBarChart;
