// Home Screen (Dashboard)

import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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
  formatFrequency,
  formatPowerFactor,
} from '../../utils';

export default function HomeScreen() {
  // Initialize mock data updates
  useMockData();

  const { data, connection, toggleRelay, isDemoMode } = useElectricalStore();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { t } = useTranslation();

  if (!data) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <Text style={{ color: themeColors.text.primary }}>{t('common.loading')}</Text>
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

        {/* Demo Mode Indicator */}
        {isDemoMode && (
          <View
            style={[
              styles.demoModeBanner,
              { backgroundColor: themeColors.warning + '20' },
            ]}
          >
            <View style={styles.demoModeContent}>
              <View style={styles.demoModeLeft}>
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={themeColors.warning}
                />
                <Text
                  style={[styles.demoModeText, { color: themeColors.warning }]}
                >
                  {t('home.connectionStatus.demoMode')}
                </Text>
              </View>
              <Link href="/link-device" asChild>
                <TouchableOpacity
                  style={[
                    styles.connectButton,
                    { backgroundColor: themeColors.warning },
                  ]}
                >
                  <Text style={[styles.connectButtonText, { color: '#FFFFFF' }]}>
                    {t('home.connectionStatus.connectButton')}
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        )}

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={[
              styles.logo,
              theme === 'dark' && { tintColor: '#FFFFFF' },
            ]}
            resizeMode="contain"
          />
        </View>

        {/* Circuit Breaker Toggle */}
        <View style={styles.toggleSection}>
          <Toggle
            value={data.relayState}
            onToggle={toggleRelay}
            label={t('home.relayControl.title')}
            size="large"
          />
        </View>

        {/* Power Consumption */}
        <View style={styles.metricCardWrapper}>
          <MetricCard
            icon="flash"
            label={t('home.readings.power')}
            value={formatPower(data.power)}
            color={themeColors.warning}
          />
        </View>

        {/* Voltage */}
        <View style={styles.gaugeSection}>
          <VoltageGauge voltage={data.voltage} />
        </View>

        {/* Current */}
        <View style={styles.section}>
          <CurrentMeter current={data.current} maxCurrent={16} />
        </View>

        {/* Power Factor */}
        <View style={styles.metricCardWrapper}>
          <MetricCard
            icon="stats-chart"
            label={t('home.readings.powerFactor')}
            value={formatPowerFactor(data.powerFactor)}
            color={themeColors.info}
          />
        </View>

        {/* Frequency */}
        <View style={styles.metricCardWrapper}>
          <MetricCard
            icon="pulse"
            label={t('home.readings.frequency')}
            value={formatFrequency(data.frequency)}
            color={themeColors.info}
          />
        </View>

        {/* Status Bar */}
        <View style={styles.section}>
          <StatusBar
            isConnected={connection.isConnected}
            signalStrength={connection.signalStrength}
            lastEventTime={data.timestamp}
            lastEventDescription={
              data.relayState ? t('home.relayControl.turnedOn') : t('home.relayControl.turnedOff')
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
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  demoModeBanner: {
    borderRadius: borderRadius.medium,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  demoModeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demoModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  demoModeText: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  connectButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.medium,
  },
  connectButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 140,
    height: 140,
  },
  toggleSection: {
    marginBottom: spacing.lg,
  },
  gaugeSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  metricCardWrapper: {
    marginBottom: spacing.lg,
  },
});
