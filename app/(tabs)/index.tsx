// Home Screen (Dashboard)

import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useElectricalStore, useThemeStore } from '../../store';
import { useMockData } from '../../hooks/useMockData';
import {
  VoltageGauge,
  CurrentMeter,
  MetricCard,
  StatusBar,
} from '../../components/dashboard';
import { Toggle } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';
import {
  formatPower,
  formatEnergy,
  formatFrequency,
  formatPowerFactor,
} from '../../utils';

export default function HomeScreen() {
  // Initialize mock data updates
  useMockData();

  const { data, connection, toggleRelay } = useElectricalStore();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  if (!data) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <Text style={{ color: themeColors.text.primary }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings Icon */}
        <View style={styles.topBar}>
          <View />
          <Link href="/settings" asChild>
            <TouchableOpacity>
              <Ionicons
                name="settings-outline"
                size={28}
                color={themeColors.text.secondary}
              />
            </TouchableOpacity>
          </Link>
        </View>

        {/* Logo Section */}
        <View style={[
          styles.logoSection,
          {
            backgroundColor: themeColors.surfaceElevated
          }
        ]}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={[
              styles.logo,
              theme === 'dark' && { tintColor: '#FFFFFF' }  // Make logo white in dark mode
            ]}
            resizeMode="contain"
          />
        </View>

        {/* Main Voltage Gauge */}
        <View style={styles.gaugeSection}>
          <VoltageGauge voltage={data.voltage} />
        </View>

        {/* Current Meter */}
        <View style={styles.section}>
          <CurrentMeter current={data.current} maxCurrent={16} />
        </View>

        {/* Metrics Cards Row 1 */}
        <View style={styles.metricsRow}>
          <MetricCard
            icon="flash"
            label="Power"
            value={formatPower(data.power)}
            color={themeColors.warning}
          />
          <MetricCard
            icon="battery-charging"
            label="Energy"
            value={formatEnergy(data.energy)}
            color={themeColors.success}
          />
        </View>

        {/* Metrics Cards Row 2 */}
        <View style={styles.metricsRow}>
          <MetricCard
            icon="pulse"
            label="Frequency"
            value={formatFrequency(data.frequency)}
            color={themeColors.info}
          />
          <MetricCard
            icon="stats-chart"
            label="Power Factor"
            value={formatPowerFactor(data.powerFactor)}
            color={themeColors.info}
          />
        </View>

        {/* Circuit Breaker Toggle */}
        <View style={styles.section}>
          <Toggle
            value={data.relayState}
            onToggle={toggleRelay}
            label="Circuit Breaker"
            size="large"
          />
        </View>

        {/* Status Bar */}
        <View style={styles.section}>
          <StatusBar
            isConnected={connection.isConnected}
            signalStrength={connection.signalStrength}
            lastEventTime={data.timestamp}
            lastEventDescription={
              data.relayState ? 'Circuit breaker ON' : 'Circuit breaker OFF'
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl, // Extra padding for tab bar
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    borderRadius: borderRadius.xlarge,
    marginBottom: spacing.lg,
    height: 180,
    position: 'relative',
  },
  logo: {
    width: 140,
    height: 140,
    zIndex: 2,
  },
  logoGlow: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: '#4A90E2',  // Soft blue glow that complements the logo
  },
  gaugeSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    marginHorizontal: -spacing.xs,
  },
});