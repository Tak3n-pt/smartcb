// Status Bar Component

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store';
import { colors, typography, spacing } from '../../theme';
import { getRelativeTime } from '../../utils';

interface StatusBarProps {
  isConnected: boolean;
  signalStrength: number;
  lastEventTime?: number;
  lastEventDescription?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isConnected,
  signalStrength,
  lastEventTime,
  lastEventDescription,
}) => {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const getWifiIcon = (): keyof typeof Ionicons.glyphMap => {
    if (!isConnected) return 'wifi-outline';
    if (signalStrength > 75) return 'wifi';
    if (signalStrength > 50) return 'wifi';
    if (signalStrength > 25) return 'wifi';
    return 'wifi-outline';
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.surface }]}>
      {/* Connection Status */}
      <View style={styles.statusItem}>
        <Ionicons
          name={getWifiIcon()}
          size={20}
          color={isConnected ? themeColors.success : themeColors.danger}
        />
        <Text
          style={[
            styles.statusText,
            {
              color: isConnected ? themeColors.success : themeColors.danger,
            },
          ]}
        >
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>

      {/* Last Event */}
      {lastEventTime && lastEventDescription && (
        <View style={styles.eventItem}>
          <Ionicons
            name="time-outline"
            size={16}
            color={themeColors.text.secondary}
          />
          <Text style={[styles.eventText, { color: themeColors.text.secondary }]}>
            {lastEventDescription} • {getRelativeTime(lastEventTime)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusText: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventText: {
    ...typography.caption,
    marginLeft: spacing.sm,
    flex: 1,
  },
});