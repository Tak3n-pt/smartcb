// Metric Card Component for displaying electrical metrics

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui';
import { useThemeStore } from '../../store';
import { colors, typography, spacing } from '../../theme';

interface MetricCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  unit?: string;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  unit,
  color,
}) => {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const iconColor = color || themeColors.primary;

  return (
    <Card style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: themeColors.text.primary }]}>
        {value}
      </Text>
      {unit && (
        <Text style={[styles.unit, { color: themeColors.text.secondary }]}>
          {unit}
        </Text>
      )}
      <Text style={[styles.label, { color: themeColors.text.secondary }]}>
        {label}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    marginHorizontal: spacing.xs,
  },
  iconContainer: {
    marginBottom: spacing.sm,
  },
  value: {
    ...typography.metricSmall,
  },
  unit: {
    ...typography.caption,
    marginTop: -4,
  },
  label: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});