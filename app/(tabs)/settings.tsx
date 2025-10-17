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

  // Inline editing state - simple approach
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const startEditing = (field: string, value: number, isDecimal: boolean) => {
    setEditingField(field);
    setEditValue(isDecimal ? value.toFixed(isDecimal ? 2 : 1) : value.toString());
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
  };

  const incrementValue = (isDecimal: boolean, amount: number) => {
    const current = parseFloat(editValue) || 0;
    const step = isDecimal ? 0.1 : 1;
    const newValue = Math.max(0, current + (amount * step));
    setEditValue(isDecimal ? newValue.toFixed(isDecimal ? 2 : 1) : newValue.toString());
  };

  const saveValue = () => {
    if (!editingField) return;

    const value = parseFloat(editValue) || 0;

    switch (editingField) {
      case 'voltage.max':
        updateThresholds({ voltage: { ...settings.thresholds.voltage, max: value } });
        break;
      case 'voltage.min':
        updateThresholds({ voltage: { ...settings.thresholds.voltage, min: value } });
        break;
      case 'current.max':
        updateThresholds({ current: { ...settings.thresholds.current, max: value } });
        break;
      case 'current.min':
        updateThresholds({ current: { ...settings.thresholds.current, min: value } });
        break;
      case 'frequency.min':
        updateThresholds({ frequency: { ...settings.thresholds.frequency, min: value } });
        break;
      case 'frequency.max':
        updateThresholds({ frequency: { ...settings.thresholds.frequency, max: value } });
        break;
      case 'powerFactor.min':
        updateThresholds({ powerFactor: { ...settings.thresholds.powerFactor, min: value } });
        break;
      case 'reconnection.delay':
        updateThresholds({ reconnection: { ...settings.reconnection, delay: value } });
        break;
    }

    cancelEditing();
  };

  // Lightweight time editing modal state (display-only UX)
  const [timeModal, setTimeModal] = useState<{
    visible: boolean;
    scheduleId?: string;
    field?: 'onTime' | 'offTime';
    hour?: number;
    minute?: number;
  }>({ visible: false });

  const openTimeModal = (scheduleId: string, field: 'onTime' | 'offTime', value: string) => {
    const [h, m] = value.split(':');
    const hour = Math.max(0, Math.min(23, parseInt(h || '0', 10)));
    const minute = Math.max(0, Math.min(59, parseInt(m || '0', 10)));
    setTimeModal({ visible: true, scheduleId, field, hour, minute });
  };

  const closeTimeModal = () => setTimeModal({ visible: false });

  const applyTimeModal = () => {
    if (!timeModal.visible || !timeModal.scheduleId || !timeModal.field) {
      return;
    }
    const hh = String(timeModal.hour ?? 0).padStart(2, '0');
    const mm = String(timeModal.minute ?? 0).padStart(2, '0');
    const next = (settings.schedule.schedules || []).map((s) =>
      s.id === timeModal.scheduleId ? { ...s, [timeModal.field!]: `${hh}:${mm}` } : s
    );
    updateSchedule({ schedules: next });
    closeTimeModal();
  };

  const stepTime = (part: 'hour' | 'minute', delta: number) => {
    setTimeModal((prev) => {
      if (!prev.visible) return prev;
      let hour = prev.hour ?? 0;
      let minute = prev.minute ?? 0;
      if (part === 'hour') {
        hour = (hour + delta + 24) % 24;
      } else {
        minute = (minute + delta + 60) % 60;
      }
      return { ...prev, hour, minute };
    });
  };

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
          {editingField === 'voltage.max' ? (
            <View style={styles.inlineEditContainer}>
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => incrementValue(false, -1)}
              >
                <Ionicons name="remove-circle" size={32} color={themeColors.primary} />
              </TouchableOpacity>
              <Text style={[styles.inlineValue, { color: themeColors.text.primary }]}>
                {editValue} {t('home.units.voltage')}
              </Text>
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => incrementValue(false, 1)}
              >
                <Ionicons name="add-circle" size={32} color={themeColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inlineSaveButton, { backgroundColor: themeColors.success }]}
                onPress={saveValue}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineCancelButton}
                onPress={cancelEditing}
              >
                <Ionicons name="close" size={20} color={themeColors.text.secondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.numberChip,
                { backgroundColor: themeColors.background, borderColor: themeColors.border }
              ]}
              onPress={() => startEditing('voltage.max', settings.thresholds.voltage.max, false)}
            >
              <Text style={[styles.numberChipText, { color: themeColors.text.primary }]}>
                {settings.thresholds.voltage.max}
              </Text>
              <Text style={[styles.numberChipUnit, { color: themeColors.text.secondary }]}>
                {t('home.units.voltage')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.thresholds.voltage.min')}
          </Text>
          {editingField === 'voltage.min' ? (
            <View style={styles.inlineEditContainer}>
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => incrementValue(false, -1)}
              >
                <Ionicons name="remove-circle" size={32} color={themeColors.primary} />
              </TouchableOpacity>
              <Text style={[styles.inlineValue, { color: themeColors.text.primary }]}>
                {editValue} {t('home.units.voltage')}
              </Text>
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => incrementValue(false, 1)}
              >
                <Ionicons name="add-circle" size={32} color={themeColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inlineSaveButton, { backgroundColor: themeColors.success }]}
                onPress={saveValue}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineCancelButton}
                onPress={cancelEditing}
              >
                <Ionicons name="close" size={20} color={themeColors.text.secondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.numberChip,
                { backgroundColor: themeColors.background, borderColor: themeColors.border }
              ]}
              onPress={() => startEditing('voltage.min', settings.thresholds.voltage.min, false)}
            >
              <Text style={[styles.numberChipText, { color: themeColors.text.primary }]}>
                {settings.thresholds.voltage.min}
              </Text>
              <Text style={[styles.numberChipUnit, { color: themeColors.text.secondary }]}>
                {t('home.units.voltage')}
              </Text>
            </TouchableOpacity>
          )}
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
          {editingField === 'current.max' ? (
            <View style={styles.inlineEditContainer}>
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => incrementValue(false, -1)}
              >
                <Ionicons name="remove-circle" size={32} color={themeColors.primary} />
              </TouchableOpacity>
              <Text style={[styles.inlineValue, { color: themeColors.text.primary }]}>
                {editValue} {t('home.units.current')}
              </Text>
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => incrementValue(false, 1)}
              >
                <Ionicons name="add-circle" size={32} color={themeColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inlineSaveButton, { backgroundColor: themeColors.success }]}
                onPress={saveValue}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineCancelButton}
                onPress={cancelEditing}
              >
                <Ionicons name="close" size={20} color={themeColors.text.secondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.numberChip,
                { backgroundColor: themeColors.background, borderColor: themeColors.border }
              ]}
              onPress={() => startEditing('current.max', settings.thresholds.current.max, false)}
            >
              <Text style={[styles.numberChipText, { color: themeColors.text.primary }]}>
                {settings.thresholds.current.max}
              </Text>
              <Text style={[styles.numberChipUnit, { color: themeColors.text.secondary }]}>
                {t('home.units.current')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.thresholds.current.min')}
          </Text>
          {editingField === 'current.min' ? (
            <View style={styles.inlineEditContainer}>
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => incrementValue(true, -1)}
              >
                <Ionicons name="remove-circle" size={32} color={themeColors.primary} />
              </TouchableOpacity>
              <Text style={[styles.inlineValue, { color: themeColors.text.primary }]}>
                {editValue} {t('home.units.current')}
              </Text>
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => incrementValue(true, 1)}
              >
                <Ionicons name="add-circle" size={32} color={themeColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inlineSaveButton, { backgroundColor: themeColors.success }]}
                onPress={saveValue}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineCancelButton}
                onPress={cancelEditing}
              >
                <Ionicons name="close" size={20} color={themeColors.text.secondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.numberChip,
                { backgroundColor: themeColors.background, borderColor: themeColors.border }
              ]}
              onPress={() => startEditing('current.min', settings.thresholds.current.min, true)}
            >
              <Text style={[styles.numberChipText, { color: themeColors.text.primary }]}>
                {settings.thresholds.current.min.toFixed(1)}
              </Text>
              <Text style={[styles.numberChipUnit, { color: themeColors.text.secondary }]}>
                {t('home.units.current')}
              </Text>
            </TouchableOpacity>
          )}
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
          {editingField === 'frequency.min' ? (
            <View style={styles.inlineEditContainer}>
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => incrementValue(true, -1)}
              >
                <Ionicons name="remove-circle" size={32} color={themeColors.primary} />
              </TouchableOpacity>
              <Text style={[styles.inlineValue, { color: themeColors.text.primary }]}>
                {editValue} {t('home.units.frequency')}
              </Text>
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => incrementValue(true, 1)}
              >
                <Ionicons name="add-circle" size={32} color={themeColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inlineSaveButton, { backgroundColor: themeColors.success }]}
                onPress={saveValue}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineCancelButton}
                onPress={cancelEditing}
              >
                <Ionicons name="close" size={20} color={themeColors.text.secondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.numberChip,
                { backgroundColor: themeColors.background, borderColor: themeColors.border }
              ]}
              onPress={() => startEditing('frequency.min', settings.thresholds.frequency.min, true)}
            >
              <Text style={[styles.numberChipText, { color: themeColors.text.primary }]}>
                {settings.thresholds.frequency.min.toFixed(1)}
              </Text>
              <Text style={[styles.numberChipUnit, { color: themeColors.text.secondary }]}>
                {t('home.units.frequency')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.thresholds.frequency.max')}
          </Text>
          {editingField === 'frequency.max' ? (
            <View style={styles.inlineEditContainer}>
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => incrementValue(true, -1)}
              >
                <Ionicons name="remove-circle" size={32} color={themeColors.primary} />
              </TouchableOpacity>
              <Text style={[styles.inlineValue, { color: themeColors.text.primary }]}>
                {editValue} {t('home.units.frequency')}
              </Text>
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => incrementValue(true, 1)}
              >
                <Ionicons name="add-circle" size={32} color={themeColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inlineSaveButton, { backgroundColor: themeColors.success }]}
                onPress={saveValue}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineCancelButton}
                onPress={cancelEditing}
              >
                <Ionicons name="close" size={20} color={themeColors.text.secondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.numberChip,
                { backgroundColor: themeColors.background, borderColor: themeColors.border }
              ]}
              onPress={() => startEditing('frequency.max', settings.thresholds.frequency.max, true)}
            >
              <Text style={[styles.numberChipText, { color: themeColors.text.primary }]}>
                {settings.thresholds.frequency.max.toFixed(1)}
              </Text>
              <Text style={[styles.numberChipUnit, { color: themeColors.text.secondary }]}>
                {t('home.units.frequency')}
              </Text>
            </TouchableOpacity>
          )}
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
          {editingField === 'powerFactor.min' ? (
            <View style={styles.inlineEditContainer}>
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => incrementValue(true, -1)}
              >
                <Ionicons name="remove-circle" size={32} color={themeColors.primary} />
              </TouchableOpacity>
              <Text style={[styles.inlineValue, { color: themeColors.text.primary }]}>
                {editValue}
              </Text>
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => incrementValue(true, 1)}
              >
                <Ionicons name="add-circle" size={32} color={themeColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inlineSaveButton, { backgroundColor: themeColors.success }]}
                onPress={saveValue}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineCancelButton}
                onPress={cancelEditing}
              >
                <Ionicons name="close" size={20} color={themeColors.text.secondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.numberChip,
                { backgroundColor: themeColors.background, borderColor: themeColors.border }
              ]}
              onPress={() => startEditing('powerFactor.min', settings.thresholds.powerFactor.min, true)}
            >
              <Text style={[styles.numberChipText, { color: themeColors.text.primary }]}>
                {settings.thresholds.powerFactor.min.toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          {t('settings.thresholds.reconnection.title')}
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.thresholds.reconnection.enabled')}
          </Text>
          <Switch
            value={settings.reconnection.enabled}
            onValueChange={(value) => {
              updateThresholds({
                reconnection: {
                  ...settings.reconnection,
                  enabled: value
                }
              });
            }}
            trackColor={{ false: themeColors.border, true: themeColors.success }}
            thumbColor="white"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.thresholds.reconnection.delay')}
          </Text>
          {editingField === 'reconnection.delay' ? (
            <View style={styles.inlineEditContainer}>
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => incrementValue(false, -1)}
              >
                <Ionicons name="remove-circle" size={32} color={themeColors.primary} />
              </TouchableOpacity>
              <Text style={[styles.inlineValue, { color: themeColors.text.primary }]}>
                {editValue} {t('settings.thresholds.reconnection.delayUnit')}
              </Text>
              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => incrementValue(false, 1)}
              >
                <Ionicons name="add-circle" size={32} color={themeColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inlineSaveButton, { backgroundColor: themeColors.success }]}
                onPress={saveValue}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineCancelButton}
                onPress={cancelEditing}
              >
                <Ionicons name="close" size={20} color={themeColors.text.secondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.numberChip,
                { backgroundColor: themeColors.background, borderColor: themeColors.border }
              ]}
              onPress={() => startEditing('reconnection.delay', settings.reconnection.delay, false)}
            >
              <Text style={[styles.numberChipText, { color: themeColors.text.primary }]}>
                {settings.reconnection.delay}
              </Text>
              <Text style={[styles.numberChipUnit, { color: themeColors.text.secondary }]}>
                {t('settings.thresholds.reconnection.delayUnit')}
              </Text>
            </TouchableOpacity>
          )}
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

        {/* Keep only Power Restore & Device Offline */}
        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.notifications.powerRestore')}
          </Text>
          <Switch
            value={settings.notifications.powerRestore}
            onValueChange={(value) => updateNotifications({ powerRestore: value })}
            trackColor={{ false: themeColors.border, true: themeColors.success }}
            thumbColor="white"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('settings.notifications.deviceOffline')}
          </Text>
          <Switch
            value={settings.notifications.deviceOffline}
            onValueChange={(value) => updateNotifications({ deviceOffline: value })}
            trackColor={{ false: themeColors.border, true: themeColors.success }}
            thumbColor="white"
          />
        </View>
      </Card>

      {/* Safety alerts derived from Events safety filter */}
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>
          {t('settings.notifications.safetyAlerts')}
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('events.safetyFilter.types.overvoltage')}
          </Text>
          <Switch
            value={settings.notifications.overvoltage ?? true}
            onValueChange={(value) => updateNotifications({ overvoltage: value })}
            trackColor={{ false: themeColors.border, true: themeColors.success }}
            thumbColor="white"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('events.safetyFilter.types.undervoltage')}
          </Text>
          <Switch
            value={settings.notifications.undervoltage ?? true}
            onValueChange={(value) => updateNotifications({ undervoltage: value })}
            trackColor={{ false: themeColors.border, true: themeColors.success }}
            thumbColor="white"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('events.safetyFilter.types.overload')}
          </Text>
          <Switch
            value={settings.notifications.overload ?? true}
            onValueChange={(value) => updateNotifications({ overload: value })}
            trackColor={{ false: themeColors.border, true: themeColors.success }}
            thumbColor="white"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('events.safetyFilter.types.underload')}
          </Text>
          <Switch
            value={settings.notifications.underload ?? true}
            onValueChange={(value) => updateNotifications({ underload: value })}
            trackColor={{ false: themeColors.border, true: themeColors.success }}
            thumbColor="white"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('events.safetyFilter.types.frequencyMin')}
          </Text>
          <Switch
            value={settings.notifications.frequencyMin ?? true}
            onValueChange={(value) => updateNotifications({ frequencyMin: value })}
            trackColor={{ false: themeColors.border, true: themeColors.success }}
            thumbColor="white"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('events.safetyFilter.types.frequencyMax')}
          </Text>
          <Switch
            value={settings.notifications.frequencyMax ?? true}
            onValueChange={(value) => updateNotifications({ frequencyMax: value })}
            trackColor={{ false: themeColors.border, true: themeColors.success }}
            thumbColor="white"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>
            {t('events.safetyFilter.types.powerFactorLow')}
          </Text>
          <Switch
            value={settings.notifications.powerFactorLow ?? true}
            onValueChange={(value) => updateNotifications({ powerFactorLow: value })}
            trackColor={{ false: themeColors.border, true: themeColors.success }}
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

    const updateScheduleField = (
      scheduleId: string,
      changes: Partial<{ onTime: string; offTime: string; enabled: boolean }>
    ) => {
      const updatedSchedules = (settings.schedule.schedules || []).map((s) =>
        s.id === scheduleId ? { ...s, ...changes } : s
      );
      updateSchedule({ schedules: updatedSchedules });
    };

    const schedules = settings.schedule.schedules || [];

    return (
      <View>
        {/* Multiple Schedules */}
        {schedules.map((schedule, index) => (
          <Card key={schedule.id} style={[styles.card, { opacity: schedule.enabled ? 1 : 0.65 }]}>
            <View style={styles.scheduleHeader}>
              <Text style={[styles.scheduleTitle, { color: themeColors.text.primary }]}>
                {t('settings.tabs.timer')} {index + 1}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Switch
                  value={schedule.enabled}
                  onValueChange={(value) => updateScheduleField(schedule.id, { enabled: value })}
                  trackColor={{ false: themeColors.border, true: themeColors.success }}
                  thumbColor="white"
                />
                <TouchableOpacity onPress={() => deleteSchedule(schedule.id)}>
                  <Ionicons name="trash-outline" size={20} color={themeColors.danger} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.label, { color: themeColors.text.secondary }]}>
                {t('settings.schedule.onTime')}
              </Text>
              <TouchableOpacity
                style={[
                  styles.timeChip,
                  { backgroundColor: themeColors.background, borderColor: themeColors.border },
                ]}
                onPress={() => openTimeModal(schedule.id, 'onTime', schedule.onTime)}
              >
                <Ionicons name="time-outline" size={16} color={themeColors.text.secondary} />
                <Text style={[styles.timeChipText, { color: themeColors.text.primary }]}>
                  {schedule.onTime}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.label, { color: themeColors.text.secondary }]}>
                {t('settings.schedule.offTime')}
              </Text>
              <TouchableOpacity
                style={[
                  styles.timeChip,
                  { backgroundColor: themeColors.background, borderColor: themeColors.border },
                ]}
                onPress={() => openTimeModal(schedule.id, 'offTime', schedule.offTime)}
              >
                <Ionicons name="time-outline" size={16} color={themeColors.text.secondary} />
                <Text style={[styles.timeChipText, { color: themeColors.text.primary }]}>
                  {schedule.offTime}
                </Text>
              </TouchableOpacity>
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
          <Text style={styles.addScheduleText}>{t('settings.schedule.add')}</Text>
        </TouchableOpacity>

        {/* Time Picker Modal - Display only */}
        {timeModal.visible && (
          <View style={styles.timeModalOverlay}>
            <View style={[styles.timeModalCard, { backgroundColor: themeColors.surface }]}> 
              <Text style={[styles.modalTitle, { color: themeColors.text.primary }]}>
                {timeModal.field === 'onTime' ? t('settings.schedule.onTime') : t('settings.schedule.offTime')}
              </Text>

              <View style={styles.timePickerRow}>
                <View style={styles.timeColumn}>
                  <TouchableOpacity style={styles.stepButton} onPress={() => stepTime('hour', +1)}>
                    <Ionicons name="chevron-up" size={20} color={themeColors.text.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.timeNumber, { color: themeColors.text.primary }]}>
                    {String(timeModal.hour ?? 0).padStart(2, '0')}
                  </Text>
                  <TouchableOpacity style={styles.stepButton} onPress={() => stepTime('hour', -1)}>
                    <Ionicons name="chevron-down" size={20} color={themeColors.text.primary} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.timeSeparator, { color: themeColors.text.secondary }]}>:</Text>

                <View style={styles.timeColumn}>
                  <TouchableOpacity style={styles.stepButton} onPress={() => stepTime('minute', +1)}>
                    <Ionicons name="chevron-up" size={20} color={themeColors.text.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.timeNumber, { color: themeColors.text.primary }]}>
                    {String(timeModal.minute ?? 0).padStart(2, '0')}
                  </Text>
                  <TouchableOpacity style={styles.stepButton} onPress={() => stepTime('minute', -1)}>
                    <Ionicons name="chevron-down" size={20} color={themeColors.text.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.presetsRow}>
                {['06:00','08:00','18:00','22:00'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.presetChip, { borderColor: themeColors.border, backgroundColor: themeColors.background }]}
                    onPress={() => {
                      const [h,m] = p.split(':');
                      setTimeModal((prev) => ({ ...prev, hour: parseInt(h,10), minute: parseInt(m,10) }));
                    }}
                  >
                    <Text style={[styles.presetChipText, { color: themeColors.text.primary }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, { borderColor: themeColors.border }]} onPress={closeTimeModal}>
                  <Text style={[styles.modalButtonText, { color: themeColors.text.secondary }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButtonPrimary, { backgroundColor: themeColors.primary }]} onPress={applyTimeModal}>
                  <Text style={[styles.modalButtonPrimaryText, { color: themeColors.text.inverse }]}>{t('common.done')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
                {t('settings.system.languages.arabic')}
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
  // Time editing UX
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
  },
  timeChipText: {
    ...typography.body,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  timeModalOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  timeModalCard: {
    borderTopLeftRadius: borderRadius.xlarge,
    borderTopRightRadius: borderRadius.xlarge,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  timeColumn: {
    alignItems: 'center',
  },
  timeNumber: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
    marginVertical: 2,
  },
  timeSeparator: {
    fontSize: 26,
    fontWeight: '700',
    marginHorizontal: spacing.sm,
  },
  stepButton: {
    width: 40,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.medium,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.large,
    borderWidth: 1,
  },
  presetChipText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    ...typography.body,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Number input styles
  numberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    minWidth: 100,
  },
  numberChipText: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 18,
  },
  numberChipUnit: {
    ...typography.bodySmall,
    marginLeft: 4,
  },
  // Inline editing styles
  inlineEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  inlineButton: {
    padding: 4,
  },
  inlineValue: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 18,
    minWidth: 80,
    textAlign: 'center',
  },
  inlineSaveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  inlineCancelButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Number modal popup styles (bottom sheet)
  numberModalOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  numberModalCard: {
    borderTopLeftRadius: borderRadius.xlarge,
    borderTopRightRadius: borderRadius.xlarge,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  numberPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  numberDisplayContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  numberDisplay: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
    marginVertical: spacing.xs,
  },
  largeStepButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallStepButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
