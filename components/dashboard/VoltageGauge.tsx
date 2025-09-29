// Voltage Gauge Component

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Gauge } from '../ui';
import { getVoltageColor } from '../../theme';
import { useThemeStore } from '../../store';

interface VoltageGaugeProps {
  voltage: number;
}

export const VoltageGauge: React.FC<VoltageGaugeProps> = ({ voltage }) => {
  const { theme } = useThemeStore();
  const color = getVoltageColor(voltage, theme === 'dark');

  return (
    <View style={styles.container}>
      <Gauge
        value={voltage}
        minValue={180}
        maxValue={260}
        color={color}
        unit="V"
        label="Voltage"
        size={160}
        strokeWidth={14}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});