// Toggle Switch Component for Relay Control

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

interface ToggleProps {
  value: boolean;
  onToggle: () => void;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  value,
  onToggle,
  label,
  size = 'large',
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const isLarge = size === 'large';
  const isMedium = size === 'medium';

  return (
    <TouchableOpacity
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.container,
        isLarge && styles.containerLarge,
        isMedium && styles.containerMedium,
        {
          backgroundColor: value ? themeColors.success : themeColors.danger,
        },
        shadows.medium,
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={value ? 'power' : 'power-outline'}
          size={isLarge ? 48 : isMedium ? 32 : 24}
          color="white"
        />
        <Text style={[styles.label, isLarge && styles.labelLarge, isMedium && styles.labelMedium]}>
          {t(value ? 'common.on' : 'common.off')}
        </Text>
        {label && (isLarge || isMedium) && (
          <Text style={[styles.sublabel, isMedium && styles.sublabelMedium]}>{label}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xlarge,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  containerLarge: {
    padding: spacing.lg,
    minHeight: 100,
  },
  containerMedium: {
    padding: spacing.md,
    minHeight: 80,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.h4,
    color: 'white',
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  labelLarge: {
    ...typography.h2,
    marginTop: spacing.sm,
  },
  labelMedium: {
    ...typography.h3,
    marginTop: spacing.xs,
  },
  sublabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  sublabelMedium: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
});



