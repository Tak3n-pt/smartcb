// Current Meter Component (Linear Bar)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store';
import { colors, typography, spacing, borderRadius, getCurrentColor } from '../../theme';
import { formatCurrent } from '../../utils';

interface CurrentMeterProps {
  current: number;
  maxCurrent?: number;
}

export const CurrentMeter: React.FC<CurrentMeterProps> = ({
  current,
  maxCurrent = 16,
}) => {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const color = getCurrentColor(current, theme === 'dark');

  // Calculate percentage
  const percentage = Math.min((current / maxCurrent) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: themeColors.text.secondary }]}>
          Current
        </Text>
        <Text style={[styles.value, { color: themeColors.text.primary }]}>
          {formatCurrent(current)}
        </Text>
      </View>

      <View style={[styles.trackContainer, { backgroundColor: themeColors.border }]}>
        <View
          style={[
            styles.progress,
            {
              width: `${percentage}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: themeColors.text.secondary }]}>
          0A
        </Text>
        <Text style={[styles.footerText, { color: themeColors.text.secondary }]}>
          {maxCurrent}A
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.body,
  },
  value: {
    ...typography.metric,
  },
  trackContainer: {
    height: 20,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: borderRadius.large,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  footerText: {
    ...typography.caption,
  },
});