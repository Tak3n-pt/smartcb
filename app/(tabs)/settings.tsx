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
import { useTranslation } from 'react-i18next';
import { useSettingsStore, useThemeStore, useLanguageStore } from '../../store';
import { Card } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';

type SettingsTab = 'thresholds' | 'notifications' | 'schedule' | 'system';

export default function SettingsScreen() {
  const { settings, updateThresholds, updateNotifications, updateSchedule } =
    useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const themeColors = colors[theme];
  const { t } = useTranslation();

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
          {t('settings.tabs.limits')}
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
          {t('settings.tabs.alerts')}
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
          {t('settings.tabs.timer')}
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
          {t('settings.tabs.system')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Thresholds Tab
  const renderThresholdsTab = () => (
    <View>
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          {t('settings.thresholds.voltage.title')}
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.thresholds.voltage.max')}
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
              {t('home.units.voltage')}
            </Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.thresholds.voltage.min')}
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
              {t('home.units.voltage')}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          {t('settings.thresholds.current.title')}
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.thresholds.current.max')}
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
              {t('home.units.current')}
            </Text>
          </View>
        </View>

      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          {t('settings.thresholds.frequency.title')}
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.thresholds.frequency.min')}
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
              {t('home.units.frequency')}
            </Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.thresholds.frequency.max')}
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
              {t('home.units.frequency')}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          {t('settings.thresholds.powerFactor.title')}
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.thresholds.powerFactor.min')}
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
              {t('settings.thresholds.powerFactor.unit')}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          {t('settings.thresholds.reconnection.title')}
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.thresholds.reconnection.delay')}
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
              {t('settings.thresholds.reconnection.delayUnit')}
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
          {t('settings.notifications.alertsTitle')}
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.notifications.powerOutage')}
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
            {t('settings.notifications.powerRestore')}
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
            {t('settings.notifications.thresholdBreach')}
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
            Frequency Alerts
          </Text>
          <Switch
            value={settings.notifications.frequencyAlerts ?? true}
            onValueChange={(value) =>
              updateNotifications({ frequencyAlerts: value })
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
            Power Factor Alerts
          </Text>
          <Switch
            value={settings.notifications.powerFactorAlerts ?? true}
            onValueChange={(value) =>
              updateNotifications({ powerFactorAlerts: value })
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
            {t('settings.notifications.deviceOffline')}
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
          {t('settings.notifications.preferencesTitle')}
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.notifications.sound')}
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
            {t('settings.notifications.vibration')}
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

  // Schedule Tab - Multiple Schedules Support
  const renderScheduleTab = () => {
    const dayOptions = [
      { index: 0, label: t('settings.schedule.daysOfWeek.sunday') },
      { index: 1, label: t('settings.schedule.daysOfWeek.monday') },
      { index: 2, label: t('settings.schedule.daysOfWeek.tuesday') },
      { index: 3, label: t('settings.schedule.daysOfWeek.wednesday') },
      { index: 4, label: t('settings.schedule.daysOfWeek.thursday') },
      { index: 5, label: t('settings.schedule.daysOfWeek.friday') },
      { index: 6, label: t('settings.schedule.daysOfWeek.saturday') },
    ];

    const addNewSchedule = () => {
      const newSchedule = {
        id: Date.now().toString(),
        onTime: '06:00',
        offTime: '22:00',
        days: [1, 2, 3, 4, 5], // Monday to Friday
        enabled: true,
      };
      updateSchedule({
        schedules: [...(settings.schedule.schedules || []), newSchedule]
      });
    };

    const deleteSchedule = (scheduleId: string) => {
      const updatedSchedules = (settings.schedule.schedules || []).filter(s => s.id !== scheduleId);
      updateSchedule({ schedules: updatedSchedules });
    };

    const toggleScheduleDay = (scheduleId: string, dayIndex: number) => {
      const updatedSchedules = (settings.schedule.schedules || []).map(schedule => {
        if (schedule.id === scheduleId) {
          const includesDay = schedule.days.includes(dayIndex);
          const updatedDays = includesDay
            ? schedule.days.filter((d) => d !== dayIndex)
            : [...schedule.days, dayIndex];
          return { ...schedule, days: updatedDays.sort((a, b) => a - b) };
        }
        return schedule;
      });
      updateSchedule({ schedules: updatedSchedules });
    };

    const schedules = settings.schedule.schedules || [];

    return (
      <View>
        <Card style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
              {t('settings.schedule.title')}
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
        </Card>

        {/* Multiple Schedules */}
        {schedules.map((schedule, index) => (
          <Card key={schedule.id} style={styles.card}>
            <View style={styles.scheduleHeader}>
              <Text style={[styles.scheduleTitle, { color: themeColors.text.primary }]}>
                Schedule {index + 1}
              </Text>
              <TouchableOpacity onPress={() => deleteSchedule(schedule.id)}>
                <Ionicons name="trash-outline" size={20} color={themeColors.danger} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.label, { color: themeColors.text.secondary }]}>
                {t('settings.schedule.onTime')}
              </Text>
              <Text style={[styles.value, { color: themeColors.text.primary }]}>
                {schedule.onTime}
              </Text>
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.label, { color: themeColors.text.secondary }]}>
                {t('settings.schedule.offTime')}
              </Text>
              <Text style={[styles.value, { color: themeColors.text.primary }]}>
                {schedule.offTime}
              </Text>
            </View>

            <Text style={[styles.daysLabel, { color: themeColors.text.secondary }]}>
              {t('settings.schedule.days')}
            </Text>
            <View style={styles.daysContainer}>
              {dayOptions.map(({ index: dayIndex, label }) => {
                const isSelected = schedule.days.includes(dayIndex);
                return (
                  <TouchableOpacity
                    key={`${schedule.id}-${dayIndex}`}
                    style={[
                      styles.dayButton,
                      {
                        backgroundColor: isSelected
                          ? themeColors.primary
                          : themeColors.background,
                        borderColor: themeColors.border,
                      },
                    ]}
                    onPress={() => toggleScheduleDay(schedule.id, dayIndex)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: isSelected ? 'white' : themeColors.text.secondary },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        ))}

        {/* Add New Schedule Button */}
        <TouchableOpacity
          style={[styles.addScheduleButton, { backgroundColor: themeColors.primary }]}
          onPress={addNewSchedule}
        >
          <Ionicons name="add-circle-outline" size={24} color="white" />
          <Text style={styles.addScheduleText}>Add Schedule</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // System Tab
  const renderSystemTab = () => (
    <View>
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          {t('settings.system.app.title')}
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
              {t('settings.system.app.theme')}
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

        {/* Language Selector */}
        <View style={styles.settingRow}>
          <View style={styles.labelWithIcon}>
            <Ionicons
              name="language"
              size={20}
              color={themeColors.text.secondary}
            />
            <Text
              style={[
                styles.label,
                { color: themeColors.text.secondary, marginLeft: spacing.sm },
              ]}
            >
              {t('settings.system.app.language')}
            </Text>
          </View>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                {
                  backgroundColor: language === 'en' ? themeColors.primary : themeColors.background,
                  borderColor: themeColors.border,
                }
              ]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[
                styles.languageButtonText,
                { color: language === 'en' ? themeColors.text.inverse : themeColors.text.secondary }
              ]}>
                {t('settings.system.languages.english')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                {
                  backgroundColor: language === 'ar' ? themeColors.primary : themeColors.background,
                  borderColor: themeColors.border,
                }
              ]}
              onPress={() => setLanguage('ar')}
            >
              <Text style={[
                styles.languageButtonText,
                { color: language === 'ar' ? themeColors.text.inverse : themeColors.text.secondary }
              ]}>
                العربية
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          {t('settings.system.network.title')}
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.system.network.wifi')}
          </Text>
          <Text style={[styles.value, { color: themeColors.text.primary }]}>
            {settings.wifi.ssid}
          </Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.system.network.signalStrength')}
          </Text>
          <Text style={[styles.value, { color: themeColors.text.primary }]}>
            {settings.wifi.signalStrength}%
          </Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          {t('settings.system.device.title')}
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.system.device.name')}
          </Text>
          <Text style={[styles.value, { color: themeColors.text.primary }]}>
            {settings.device.name}
          </Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.system.device.firmware')}
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
          {t('settings.title')}
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
  languageButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  languageButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  languageButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  daysLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  addScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  addScheduleText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});