// Settings Screen

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore, useThemeStore } from '../../store';
import { Card } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';

type SettingsTab = 'thresholds' | 'notifications' | 'schedule' | 'system';

export default function SettingsScreen() {
  const { settings, updateThresholds, updateNotifications, updateSchedule } =
    useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();
  const themeColors = colors[theme];

  const [activeTab, setActiveTab] = useState<SettingsTab>('thresholds');

  // Tab buttons with icons
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'thresholds' && {
            borderBottomColor: themeColors.primary,
            borderBottomWidth: 3,
          },
        ]}
        onPress={() => setActiveTab('thresholds')}
      >
        <Ionicons
          name="speedometer-outline"
          size={20}
          color={activeTab === 'thresholds' ? themeColors.primary : themeColors.text.secondary}
        />
        <Text
          style={[
            styles.tabText,
            { color: themeColors.text.secondary },
            activeTab === 'thresholds' && {
              color: themeColors.primary,
              fontWeight: '600',
            },
          ]}
        >
          Limits
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'notifications' && {
            borderBottomColor: themeColors.primary,
            borderBottomWidth: 3,
          },
        ]}
        onPress={() => setActiveTab('notifications')}
      >
        <Ionicons
          name="notifications-outline"
          size={20}
          color={activeTab === 'notifications' ? themeColors.primary : themeColors.text.secondary}
        />
        <Text
          style={[
            styles.tabText,
            { color: themeColors.text.secondary },
            activeTab === 'notifications' && {
              color: themeColors.primary,
              fontWeight: '600',
            },
          ]}
        >
          Alerts
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'schedule' && {
            borderBottomColor: themeColors.primary,
            borderBottomWidth: 3,
          },
        ]}
        onPress={() => setActiveTab('schedule')}
      >
        <Ionicons
          name="calendar-outline"
          size={20}
          color={activeTab === 'schedule' ? themeColors.primary : themeColors.text.secondary}
        />
        <Text
          style={[
            styles.tabText,
            { color: themeColors.text.secondary },
            activeTab === 'schedule' && {
              color: themeColors.primary,
              fontWeight: '600',
            },
          ]}
        >
          Timer
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'system' && {
            borderBottomColor: themeColors.primary,
            borderBottomWidth: 3,
          },
        ]}
        onPress={() => setActiveTab('system')}
      >
        <Ionicons
          name="settings-outline"
          size={20}
          color={activeTab === 'system' ? themeColors.primary : themeColors.text.secondary}
        />
        <Text
          style={[
            styles.tabText,
            { color: themeColors.text.secondary },
            activeTab === 'system' && {
              color: themeColors.primary,
              fontWeight: '600',
            },
          ]}
        >
          Info
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Thresholds Tab
  const renderThresholdsTab = () => (
    <View>
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          Voltage Protection
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Maximum Voltage
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  color: themeColors.text.primary,
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                },
              ]}
              value={settings.thresholds.voltage.max.toString()}
              keyboardType="numeric"
              onChangeText={(text) => {
                const value = parseInt(text) || settings.thresholds.voltage.max;
                updateThresholds({
                  voltage: { ...settings.thresholds.voltage, max: value },
                });
              }}
            />
            <Text style={[styles.unit, { color: themeColors.text.secondary }]}>
              V
            </Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Minimum Voltage
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  color: themeColors.text.primary,
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                },
              ]}
              value={settings.thresholds.voltage.min.toString()}
              keyboardType="numeric"
              onChangeText={(text) => {
                const value = parseInt(text) || settings.thresholds.voltage.min;
                updateThresholds({
                  voltage: { ...settings.thresholds.voltage, min: value },
                });
              }}
            />
            <Text style={[styles.unit, { color: themeColors.text.secondary }]}>
              V
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          Current Protection
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Maximum Current
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  color: themeColors.text.primary,
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                },
              ]}
              value={settings.thresholds.current.max.toString()}
              keyboardType="numeric"
              onChangeText={(text) => {
                const value = parseInt(text) || settings.thresholds.current.max;
                updateThresholds({
                  current: { ...settings.thresholds.current, max: value },
                });
              }}
            />
            <Text style={[styles.unit, { color: themeColors.text.secondary }]}>
              A
            </Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Protection Enabled
          </Text>
          <Switch
            value={settings.thresholds.current.enabled}
            onValueChange={(value) =>
              updateThresholds({
                current: { ...settings.thresholds.current, enabled: value },
              })
            }
            trackColor={{
              false: themeColors.border,
              true: themeColors.success,
            }}
            thumbColor="white"
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          Energy Limit
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Maximum Energy
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  color: themeColors.text.primary,
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                },
              ]}
              value={settings.thresholds.energy.max.toString()}
              keyboardType="numeric"
              onChangeText={(text) => {
                const value = parseInt(text) || settings.thresholds.energy.max;
                updateThresholds({
                  energy: { ...settings.thresholds.energy, max: value },
                });
              }}
            />
            <Text style={[styles.unit, { color: themeColors.text.secondary }]}>
              kWh
            </Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Energy Limit Enabled
          </Text>
          <Switch
            value={settings.thresholds.energy.enabled}
            onValueChange={(value) =>
              updateThresholds({
                energy: { ...settings.thresholds.energy, enabled: value },
              })
            }
            trackColor={{
              false: themeColors.border,
              true: themeColors.success,
            }}
            thumbColor="white"
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          Frequency Protection
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Minimum Frequency
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  color: themeColors.text.primary,
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                },
              ]}
              value={settings.thresholds.frequency.min.toFixed(1)}
              keyboardType="numeric"
              onChangeText={(text) => {
                const value = parseFloat(text) || settings.thresholds.frequency.min;
                updateThresholds({
                  frequency: { ...settings.thresholds.frequency, min: value },
                });
              }}
            />
            <Text style={[styles.unit, { color: themeColors.text.secondary }]}>
              Hz
            </Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Maximum Frequency
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  color: themeColors.text.primary,
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                },
              ]}
              value={settings.thresholds.frequency.max.toFixed(1)}
              keyboardType="numeric"
              onChangeText={(text) => {
                const value = parseFloat(text) || settings.thresholds.frequency.max;
                updateThresholds({
                  frequency: { ...settings.thresholds.frequency, max: value },
                });
              }}
            />
            <Text style={[styles.unit, { color: themeColors.text.secondary }]}>
              Hz
            </Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Frequency Protection
          </Text>
          <Switch
            value={settings.thresholds.frequency.enabled}
            onValueChange={(value) =>
              updateThresholds({
                frequency: { ...settings.thresholds.frequency, enabled: value },
              })
            }
            trackColor={{
              false: themeColors.border,
              true: themeColors.success,
            }}
            thumbColor="white"
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          Power Factor Protection
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Minimum Power Factor
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  color: themeColors.text.primary,
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                },
              ]}
              value={settings.thresholds.powerFactor.min.toFixed(2)}
              keyboardType="numeric"
              onChangeText={(text) => {
                const value = parseFloat(text) || settings.thresholds.powerFactor.min;
                updateThresholds({
                  powerFactor: { ...settings.thresholds.powerFactor, min: value },
                });
              }}
            />
            <Text style={[styles.unit, { color: themeColors.text.secondary }]}>
              PF
            </Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            PF Protection Enabled
          </Text>
          <Switch
            value={settings.thresholds.powerFactor.enabled}
            onValueChange={(value) =>
              updateThresholds({
                powerFactor: { ...settings.thresholds.powerFactor, enabled: value },
              })
            }
            trackColor={{
              false: themeColors.border,
              true: themeColors.success,
            }}
            thumbColor="white"
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          Reconnection Settings
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Reconnection Delay
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  color: themeColors.text.primary,
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                },
              ]}
              value={settings.reconnection.delay.toString()}
              keyboardType="numeric"
            />
            <Text style={[styles.unit, { color: themeColors.text.secondary }]}>
              sec
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );

  // Notifications Tab
  const renderNotificationsTab = () => (
    <View>
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          Alert Types
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Power Outage
          </Text>
          <Switch
            value={settings.notifications.powerOutage}
            onValueChange={(value) =>
              updateNotifications({ powerOutage: value })
            }
            trackColor={{
              false: themeColors.border,
              true: themeColors.success,
            }}
            thumbColor="white"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Power Restore
          </Text>
          <Switch
            value={settings.notifications.powerRestore}
            onValueChange={(value) =>
              updateNotifications({ powerRestore: value })
            }
            trackColor={{
              false: themeColors.border,
              true: themeColors.success,
            }}
            thumbColor="white"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Threshold Breach
          </Text>
          <Switch
            value={settings.notifications.thresholdBreach}
            onValueChange={(value) =>
              updateNotifications({ thresholdBreach: value })
            }
            trackColor={{
              false: themeColors.border,
              true: themeColors.success,
            }}
            thumbColor="white"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Device Offline
          </Text>
          <Switch
            value={settings.notifications.deviceOffline}
            onValueChange={(value) =>
              updateNotifications({ deviceOffline: value })
            }
            trackColor={{
              false: themeColors.border,
              true: themeColors.success,
            }}
            thumbColor="white"
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          Notification Settings
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Sound
          </Text>
          <Switch
            value={settings.notifications.sound}
            onValueChange={(value) => updateNotifications({ sound: value })}
            trackColor={{
              false: themeColors.border,
              true: themeColors.success,
            }}
            thumbColor="white"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Vibration
          </Text>
          <Switch
            value={settings.notifications.vibration}
            onValueChange={(value) => updateNotifications({ vibration: value })}
            trackColor={{
              false: themeColors.border,
              true: themeColors.success,
            }}
            thumbColor="white"
          />
        </View>
      </Card>
    </View>
  );

  // Schedule Tab
  const renderScheduleTab = () => (
    <View>
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          Daily Schedule
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Schedule Enabled
          </Text>
          <Switch
            value={settings.schedule.enabled}
            onValueChange={(value) => updateSchedule({ enabled: value })}
            trackColor={{
              false: themeColors.border,
              true: themeColors.success,
            }}
            thumbColor="white"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            ON Time
          </Text>
          <Text style={[styles.value, { color: themeColors.text.primary }]}>
            {settings.schedule.onTime}
          </Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            OFF Time
          </Text>
          <Text style={[styles.value, { color: themeColors.text.primary }]}>
            {settings.schedule.offTime}
          </Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          Active Days
        </Text>
        <View style={styles.daysContainer}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
            (day, index) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  {
                    backgroundColor: settings.schedule.days.includes(index)
                      ? themeColors.primary
                      : themeColors.background,
                    borderColor: themeColors.border,
                  },
                ]}
                onPress={() => {
                  const newDays = settings.schedule.days.includes(index)
                    ? settings.schedule.days.filter((d) => d !== index)
                    : [...settings.schedule.days, index];
                  updateSchedule({ days: newDays });
                }}
              >
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: settings.schedule.days.includes(index)
                        ? 'white'
                        : themeColors.text.secondary,
                    },
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </Card>
    </View>
  );

  // System Tab
  const renderSystemTab = () => (
    <View>
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          Appearance
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.labelWithIcon}>
            <Ionicons
              name={theme === 'dark' ? 'moon' : 'sunny'}
              size={20}
              color={themeColors.text.secondary}
            />
            <Text
              style={[
                styles.label,
                { color: themeColors.text.secondary, marginLeft: spacing.sm },
              ]}
            >
              Dark Mode
            </Text>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{
              false: themeColors.border,
              true: themeColors.success,
            }}
            thumbColor="white"
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          WiFi Configuration
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Network
          </Text>
          <Text style={[styles.value, { color: themeColors.text.primary }]}>
            {settings.wifi.ssid}
          </Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Signal Strength
          </Text>
          <Text style={[styles.value, { color: themeColors.text.primary }]}>
            {settings.wifi.signalStrength}%
          </Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          Device Information
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Device Name
          </Text>
          <Text style={[styles.value, { color: themeColors.text.primary }]}>
            {settings.device.name}
          </Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            Firmware Version
          </Text>
          <Text style={[styles.value, { color: themeColors.text.primary }]}>
            {settings.device.firmwareVersion}
          </Text>
        </View>
      </Card>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text.primary }]}>
          Settings
        </Text>
      </View>

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'thresholds' && renderThresholdsTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'schedule' && renderScheduleTab()}
        {activeTab === 'system' && renderSystemTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...typography.h2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    flexDirection: 'column',
    gap: 4,
  },
  tabText: {
    fontSize: 11,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl + spacing.md, // Extra padding for tab bar
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  label: {
    ...typography.body,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    ...typography.body,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: 80,
    height: 45,
    borderWidth: 1,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    textAlign: 'right',
    fontSize: 16,
    lineHeight: 20,
  },
  unit: {
    ...typography.body,
    marginLeft: spacing.sm,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    ...typography.caption,
    fontWeight: '600',
  },
});