// Home Screen (Dashboard) - Professional Redesign (No Scroll)
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useElectricalStore, useThemeStore } from "../../store";
import { useMockData } from "../../hooks/useMockData";
import { colors, typography, spacing, borderRadius } from "../../theme";
import {
  formatPower,
  formatFrequency,
  formatPowerFactor,
  formatEnergy,
  formatVoltage,
  formatCurrent,
  getRelativeTime,
} from "../../utils";

export default function HomeScreen() {
  // Keep mock data active while designing the layout
  useMockData();

  const { data, connection, toggleRelay } = useElectricalStore();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { t } = useTranslation();

  if (!data) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={{ color: themeColors.text.primary, ...typography.h3 }}>
            {t('common.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const lastUpdatedLabel = getRelativeTime(connection.lastUpdate);

  // All electrical metrics organized by importance
  const electricalMetrics = [
    {
      key: "voltage",
      icon: "flash-outline" as const,
      label: t('home.readings.voltage'),
      value: formatVoltage(data.voltage),
      color: themeColors.primary,
      unit: "V",
      rawValue: data.voltage,
    },
    {
      key: "current",
      icon: "trending-up-outline" as const,
      label: t('home.readings.current'),
      value: formatCurrent(data.current),
      color: themeColors.warning,
      unit: "A",
      rawValue: data.current,
    },
    {
      key: "energy",
      icon: "battery-charging" as const,
      label: t('home.readings.energy'),
      value: formatEnergy(data.energy),
      color: themeColors.success,
      unit: "kWh",
      rawValue: data.energy,
    },
    {
      key: "frequency",
      icon: "pulse-outline" as const,
      label: t('home.readings.frequency'),
      value: formatFrequency(data.frequency),
      color: themeColors.info,
      unit: "Hz",
      rawValue: data.frequency,
    },
    {
      key: "powerFactor",
      icon: "analytics-outline" as const,
      label: t('home.readings.powerFactor'),
      value: formatPowerFactor(data.powerFactor),
      color: themeColors.secondary,
      unit: "PF",
      rawValue: data.powerFactor,
    },
    {
      key: "apparentPower",
      icon: "speedometer-outline" as const,
      label: t('home.readings.apparentPower'),
      value: `${data.apparentPower.toFixed(0)} VA`,
      color: themeColors.tertiary || themeColors.primary,
      unit: "VA",
      rawValue: data.apparentPower,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <View style={styles.mainContent}>
        {/* Header with centered logo */}
        <View style={styles.header}>
          <Link href="/settings" asChild>
            <TouchableOpacity style={[styles.headerButton, { backgroundColor: `${themeColors.text.secondary}10` }]}>
              <Ionicons
                name="settings-outline"
                size={22}
                color={themeColors.text.secondary}
              />
            </TouchableOpacity>
          </Link>

          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={[styles.logo, theme === "dark" && styles.logoDark]}
              resizeMode="contain"
            />
            <Text style={[styles.logoText, { color: themeColors.text.primary }]}>
              SmartCB
            </Text>
          </View>

          <Link href="/events" asChild>
            <TouchableOpacity style={[styles.headerButton, { backgroundColor: `${themeColors.text.secondary}10` }]}>
              <Ionicons
                name="list-outline"
                size={22}
                color={themeColors.text.secondary}
              />
            </TouchableOpacity>
          </Link>
        </View>

        {/* Connection Status Pills */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: connection.isConnected
                  ? `${themeColors.success}20`
                  : `${themeColors.danger}20`,
                borderColor: connection.isConnected
                  ? themeColors.success
                  : themeColors.danger,
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: connection.isConnected ? themeColors.success : themeColors.danger }]} />
            <Text
              style={[
                styles.statusText,
                {
                  color: connection.isConnected
                    ? themeColors.success
                    : themeColors.danger
                },
              ]}
            >
              {connection.isConnected ? t('home.connectionStatus.connected') : t('home.connectionStatus.disconnected')}
            </Text>
          </View>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: `${themeColors.info}20`,
                borderColor: themeColors.info,
              },
            ]}
          >
            <Ionicons name="time-outline" size={14} color={themeColors.info} />
            <Text style={[styles.statusText, { color: themeColors.info }]}>
              {lastUpdatedLabel}
            </Text>
          </View>
        </View>

        {/* Main Power Display & Relay Control */}
        <View style={styles.heroSection}>
          {/* Power Display Card */}
          <LinearGradient
            colors={theme === 'dark'
              ? [themeColors.primary + '20', themeColors.primary + '10']
              : [themeColors.primary + '15', themeColors.primary + '05']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.powerCard}
          >
            <View style={styles.powerHeader}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={24}
                color={themeColors.primary}
              />
            </View>
            <Text style={[styles.powerLabel, { color: themeColors.text.secondary }]}>
              {t('home.readings.powerLabel')}
            </Text>
            <Text style={[styles.powerValue, { color: themeColors.primary }]}>
              {formatPower(data.power)}
            </Text>
            <View style={styles.powerStatus}>
              <View style={[
                styles.powerIndicator,
                { backgroundColor: data.power > 0 ? themeColors.success : themeColors.text.secondary }
              ]} />
              <Text style={[styles.powerStatusText, { color: themeColors.text.secondary }]}>
                {data.power > 0 ? t('home.powerStatus.active') : t('home.powerStatus.idle')}
              </Text>
            </View>
          </LinearGradient>

          {/* Relay Control Card - Beautiful Button Design */}
          <View style={[styles.relayCard, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.relayLabel, { color: themeColors.text.secondary }]}>
              {t('home.relayControl.label')}
            </Text>

            <Pressable
              onPress={toggleRelay}
              style={({ pressed }) => [
                styles.relayButton,
                {
                  backgroundColor: data.relayState ? themeColors.success : themeColors.surface,
                  borderColor: data.relayState ? themeColors.success : themeColors.danger,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                  shadowColor: data.relayState ? themeColors.success : themeColors.danger,
                  elevation: data.relayState ? 8 : 4,
                }
              ]}
            >
              <LinearGradient
                colors={data.relayState
                  ? [themeColors.success, themeColors.success + 'DD']
                  : ['transparent', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.relayButtonGradient}
              >
                <MaterialCommunityIcons
                  name={data.relayState ? "power-plug" : "power-plug-off"}
                  size={36}
                  color={data.relayState ? '#FFFFFF' : themeColors.danger}
                />
                <Text style={[
                  styles.relayButtonText,
                  {
                    color: data.relayState ? '#FFFFFF' : themeColors.text.primary,
                    fontWeight: 'bold'
                  }
                ]}>
                  {data.relayState ? "ON" : "OFF"}
                </Text>
              </LinearGradient>
            </Pressable>

            <Text style={[
              styles.relayHelpText,
              { color: themeColors.text.secondary }
            ]}>
              {t('home.relayControl.tapToToggle')}
            </Text>
          </View>
        </View>

        {/* Electrical Metrics Grid - Modern Clear Cards */}
        <View style={styles.metricsContainer}>
          <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
            {t('home.electricalReadings')}
          </Text>
          <View style={styles.metricsGrid}>
            {electricalMetrics.map((metric) => (
              <View
                key={metric.key}
                style={[styles.metricCard, {
                  backgroundColor: themeColors.surface,
                  borderLeftWidth: 3,
                  borderLeftColor: metric.color,
                }]}
              >
                <View style={styles.metricContent}>
                  {/* Top row with icon and label */}
                  <View style={styles.metricTopRow}>
                    <Ionicons
                      name={metric.icon}
                      size={18}
                      color={metric.color}
                    />
                    <Text style={[styles.metricLabel, { color: themeColors.text.secondary }]}>
                      {metric.label}
                    </Text>
                  </View>

                  {/* Large centered value */}
                  <View style={styles.metricValueContainer}>
                    <Text style={[styles.metricValue, { color: themeColors.text.primary }]}>
                      {metric.key === 'voltage' ? data.voltage.toFixed(1) :
                       metric.key === 'current' ? data.current.toFixed(2) :
                       metric.key === 'frequency' ? data.frequency.toFixed(1) :
                       metric.key === 'powerFactor' ? data.powerFactor.toFixed(2) :
                       metric.key === 'energy' ? data.energy.toFixed(2) :
                       data.apparentPower.toFixed(0)}
                    </Text>
                    <Text style={[styles.metricUnit, { color: metric.color }]}>
                      {metric.key === 'voltage' ? 'V' :
                       metric.key === 'current' ? 'A' :
                       metric.key === 'frequency' ? 'Hz' :
                       metric.key === 'powerFactor' ? 'PF' :
                       metric.key === 'energy' ? 'kWh' : 'VA'}
                    </Text>
                  </View>

                  {/* Optional status indicator */}
                  <View style={styles.metricStatus}>
                    <View style={[styles.metricStatusDot, {
                      backgroundColor:
                        metric.key === 'voltage' ? (data.voltage >= 210 && data.voltage <= 230 ? themeColors.success : themeColors.warning) :
                        metric.key === 'current' ? (data.current < 15 ? themeColors.success : themeColors.danger) :
                        metric.key === 'frequency' ? (data.frequency >= 49.5 && data.frequency <= 50.5 ? themeColors.success : themeColors.warning) :
                        metric.key === 'powerFactor' ? (data.powerFactor >= 0.9 ? themeColors.success : themeColors.warning) :
                        themeColors.success
                    }]} />
                    <Text style={[styles.metricStatusText, { color: themeColors.text.secondary }]}>
                      {metric.key === 'voltage' ? (data.voltage >= 210 && data.voltage <= 230 ? t('home.metricStatus.normal') : t('home.metricStatus.check')) :
                       metric.key === 'current' ? (data.current < 15 ? t('home.metricStatus.safe') : t('home.metricStatus.high')) :
                       metric.key === 'frequency' ? (data.frequency >= 49.5 && data.frequency <= 50.5 ? t('home.metricStatus.stable') : t('home.metricStatus.unstable')) :
                       metric.key === 'powerFactor' ? (data.powerFactor >= 0.9 ? t('home.metricStatus.good') : t('home.metricStatus.low')) :
                       metric.key === 'energy' ? t('home.metricStatus.total') : t('home.metricStatus.activeStatus')}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    flex: 1,
  },
  logo: {
    width: 45,
    height: 45,
  },
  logoDark: {
    tintColor: "#FFFFFF",
  },
  logoText: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 2,
  },

  // Status Pills
  statusContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Hero Section (Power & Relay)
  heroSection: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    flex: 0.35,
  },

  // Power Card
  powerCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  powerHeader: {
    marginBottom: 4,
  },
  powerLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  powerValue: {
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 4,
  },
  powerStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  powerIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  powerStatusText: {
    fontSize: 10,
    fontWeight: "500",
  },

  // Relay Card - Professional Button
  relayCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  relayLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  relayButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
    overflow: 'hidden',
    marginVertical: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  relayButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relayButtonText: {
    fontSize: 16,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  relayHelpText: {
    fontSize: 10,
    fontWeight: "500",
  },

  // Metrics Section - Professional Cards
  metricsContainer: {
    flex: 0.65,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    flex: 1,
  },
  metricCard: {
    width: "31%",
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
    height: "46%",
  },
  metricContent: {
    padding: spacing.sm,
    flex: 1,
    justifyContent: 'space-between',
  },
  metricTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
    marginVertical: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: "600",
  },
  metricStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  metricStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  metricStatusText: {
    fontSize: 9,
    fontWeight: "500",
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});