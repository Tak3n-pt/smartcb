// Circular Gauge Component

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useThemeStore } from '../../store';
import { colors, typography } from '../../theme';

interface GaugeProps {
  value: number;
  minValue: number;
  maxValue: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  unit?: string;
  label?: string;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  minValue,
  maxValue,
  size = 140,
  strokeWidth = 12,
  color,
  unit = '',
  label = '',
}) => {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  // Calculate percentage and arc
  const percentage = ((value - minValue) / (maxValue - minValue)) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // SVG circle calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // 270° arc (3/4 circle)
  const arcLength = (circumference * 270) / 360;
  const progress = (clampedPercentage / 100) * arcLength;
  const strokeDashoffset = arcLength - progress;

  // Rotation to start from bottom-left (-135°)
  const rotation = 135;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={themeColors.border}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          rotation={rotation}
          origin={`${size / 2}, ${size / 2}`}
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={rotation}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.content}>
        <Text style={[styles.value, { color: themeColors.text.primary }]}>
          {value.toFixed(1)}
        </Text>
        {unit && (
          <Text style={[styles.unit, { color: themeColors.text.secondary }]}>
            {unit}
          </Text>
        )}
        {label && (
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {label}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 36,  // Reduced from 48
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  unit: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    marginTop: -4,
  },
  label: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    marginTop: 2,
  },
});