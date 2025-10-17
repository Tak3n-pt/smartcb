// Notification Service for SmartCB App
// Handles alerts for threshold violations, power events, and system status

import { Vibration, Platform } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { useEventsStore } from '../store/useEventsStore';
import { ElectricalData, EventType } from '../types';
import { showToast } from '../components/ui/ToastManager';

// expo-notifications removed from Expo Go SDK 53+
// Push notifications only work in production builds, not Expo Go
// Using toast notifications instead (working perfectly!)
let Notifications: any = null;
let notificationsAvailable = false;

console.log('ℹ️ Using toast notifications (Expo Go doesn\'t support push notifications)');

class NotificationService {
  private notificationPermission: boolean = false;
  private activeAlerts: Set<string> = new Set();
  private lastNotificationTime: Map<string, number> = new Map();
  private NOTIFICATION_COOLDOWN = 30000; // 30 seconds between same alerts
  private autoCutoffTime: number = 0; // Timestamp when automatic cutoff happened
  private reconnectTimer: any = null; // Timer for auto-reconnect

  constructor() {
    this.initializeNotifications();
  }

  // Initialize notification service
  private async initializeNotifications() {
    // Push notifications not available in Expo Go (SDK 53+)
    // Using toast notifications instead - they work great!
    this.notificationPermission = false;
    console.log('✅ Toast notification system ready');
  }

  // Check thresholds and trigger alerts
  public checkThresholdAlerts(data: ElectricalData): void {
    const settings = useSettingsStore.getState().settings;
    const thresholds = settings.thresholds;
    const notifications = settings.notifications;

    console.log('🔍 Checking thresholds for alerts:', {
      voltage: data.voltage,
      current: data.current,
      power: data.power,
      frequency: data.frequency,
      powerFactor: data.powerFactor,
      voltageAction: thresholds.voltage.action
    });

    // Check if we should auto-reconnect after cutoff
    this.checkAutoReconnect(data, thresholds);

    // Check voltage thresholds
    if (notifications.thresholdBreach) {
      // High voltage alert
      if (data.voltage > thresholds.voltage.max) {
        this.triggerAlert(
          'overvoltage',
          '⚠️ High Voltage Alert',
          `Voltage is ${data.voltage.toFixed(1)}V (Max: ${thresholds.voltage.max}V)`,
          'danger'
        );

        // 🔥 CRITICAL: Check if we should cutoff power
        if (thresholds.voltage.action === 'cutoff' && data.relayState) {
          console.log('🚨 CUTOFF MODE: High voltage detected - turning OFF relay');
          this.cutoffPower('High voltage protection triggered');
        }
      }

      // Low voltage alert
      if (data.voltage < thresholds.voltage.min && data.voltage > 50) {
        this.triggerAlert(
          'undervoltage',
          '⚠️ Low Voltage Alert',
          `Voltage is ${data.voltage.toFixed(1)}V (Min: ${thresholds.voltage.min}V)`,
          'warning'
        );

        // 🔥 CRITICAL: Check if we should cutoff power
        if (thresholds.voltage.action === 'cutoff' && data.relayState) {
          console.log('🚨 CUTOFF MODE: Low voltage detected - turning OFF relay');
          this.cutoffPower('Low voltage protection triggered');
        }
      }

      // Current overload alert
      if (data.current > thresholds.current.max) {
        this.triggerAlert(
          'overcurrent',
          '🔥 Overload Alert',
          `Current is ${data.current.toFixed(2)}A (Max: ${thresholds.current.max}A)`,
          'danger'
        );

        // 🔥 CRITICAL: Always cutoff on overcurrent (safety)
        if (data.relayState) {
          console.log('🚨 CUTOFF MODE: Overcurrent detected - turning OFF relay');
          this.cutoffPower('Overcurrent protection triggered');
        }
      }

      // Frequency alerts
      if (thresholds.frequency.enabled) {
        if (data.frequency > thresholds.frequency.max) {
          this.triggerAlert(
            'overfrequency',
            '📊 High Frequency Alert',
            `Frequency is ${data.frequency.toFixed(1)}Hz (Max: ${thresholds.frequency.max}Hz)`,
            'warning'
          );
        }

        if (data.frequency < thresholds.frequency.min && data.frequency > 0) {
          this.triggerAlert(
            'underfrequency',
            '📊 Low Frequency Alert',
            `Frequency is ${data.frequency.toFixed(1)}Hz (Min: ${thresholds.frequency.min}Hz)`,
            'warning'
          );
        }
      }

      // Power factor alert - triggers when BELOW threshold (low power factor = inefficient)
      if (thresholds.powerFactor.enabled && data.powerFactor < thresholds.powerFactor.min && data.current > 0.5) {
        this.triggerAlert(
          'lowpowerfactor',
          '⚠️ Low Power Factor Alert',
          `Power factor is ${data.powerFactor.toFixed(2)} (Min: ${thresholds.powerFactor.min})`,
          'warning'
        );

        // 🔥 CRITICAL: Cutoff power when power factor falls below threshold
        if (data.relayState) {
          console.log('🚨 CUTOFF MODE: Low power factor detected - turning OFF relay');
          this.cutoffPower('Low power factor protection triggered');
        }
      }
    }

    // Power outage/restore detection
    if (data.voltage < 100 && !this.activeAlerts.has('outage')) {
      if (notifications.powerOutage) {
        this.triggerAlert(
          'outage',
          '🔌 Power Outage',
          'Power supply has been interrupted',
          'danger'
        );
      }
    } else if (data.voltage > 180 && this.activeAlerts.has('outage')) {
      if (notifications.powerRestore) {
        this.clearAlert('outage');
        this.triggerAlert(
          'restore',
          '✅ Power Restored',
          'Power supply has been restored',
          'success'
        );
      }
    }
  }

  // Trigger an alert
  private triggerAlert(
    alertId: string,
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'danger' | 'success'
  ): void {
    // Check cooldown
    const lastTime = this.lastNotificationTime.get(alertId);
    const now = Date.now();

    if (lastTime && (now - lastTime) < this.NOTIFICATION_COOLDOWN) {
      console.log(`⏳ Alert ${alertId} on cooldown, skipping`);
      return;
    }

    // Add to active alerts
    this.activeAlerts.add(alertId);
    this.lastNotificationTime.set(alertId, now);

    console.log(`🚨 ALERT TRIGGERED: ${title} - ${message}`);

    // Get notification settings
    const settings = useSettingsStore.getState().settings.notifications;

    // Vibration
    if (settings.vibration && severity !== 'info') {
      const pattern = severity === 'danger' ? [0, 500, 200, 500] : [0, 200];
      Vibration.vibrate(pattern);
      console.log('📳 Vibration triggered');
    }

    // Show modern toast notification (works in Expo Go!)
    const toastType = this.mapSeverityToToastType(severity);
    showToast[toastType](message, title);

    // Log event
    const eventsStore = useEventsStore.getState();
    eventsStore.addEvent({
      id: `alert-${alertId}-${now}`,
      type: this.mapAlertToEventType(alertId),
      timestamp: now,
      description: `${title}: ${message}`,
      readings: undefined,
    });
  }

  // Note: Push notifications not available in Expo Go
  // Toast notifications are used instead and work perfectly!

  // Clear an active alert
  private clearAlert(alertId: string): void {
    this.activeAlerts.delete(alertId);
    console.log(`✅ Alert cleared: ${alertId}`);
  }

  // Map alert ID to event type
  private mapAlertToEventType(alertId: string): EventType {
    const mapping: Record<string, EventType> = {
      'overvoltage': 'overvoltage',
      'undervoltage': 'undervoltage',
      'overcurrent': 'overload',
      'overfrequency': 'frequency_max',
      'underfrequency': 'frequency_min',
      'lowpowerfactor': 'power_factor_min', // Low power factor event
      'outage': 'outage',
      'restore': 'restore',
    };

    return mapping[alertId] || 'manual_off';
  }

  // Map severity to toast type
  private mapSeverityToToastType(severity: 'info' | 'warning' | 'danger' | 'success'): 'info' | 'warning' | 'error' | 'success' {
    if (severity === 'danger') {
      return 'error';
    }
    return severity;
  }

  // Test notification system
  public testNotification(): void {
    console.log('🧪 Testing notification system...');
    this.triggerAlert(
      'test',
      '🧪 Test Notification',
      'This is a test of the SmartCB notification system',
      'info'
    );
  }

  // Cut off power (turn relay OFF) for safety
  private cutoffPower(reason: string): void {
    console.log('🚨 CUTOFF POWER:', reason);

    // Prevent multiple cutoff calls within cooldown
    if (this.activeAlerts.has('cutoff')) {
      console.log('⏳ Cutoff already in progress, skipping');
      return;
    }

    this.activeAlerts.add('cutoff');

    // Import and call the relay control - use dynamic import to avoid circular dependency
    import('../store/useElectricalStore').then(({ useElectricalStore }) => {
      const store = useElectricalStore.getState();

      // Only turn off if relay is currently on
      if (store.data?.relayState) {
        console.log('🔌 Calling toggleRelay to turn OFF power');
        store.toggleRelay();

        // Mark the time when automatic cutoff happened
        this.autoCutoffTime = Date.now();
        console.log(`⏰ Auto-cutoff at ${new Date(this.autoCutoffTime).toLocaleTimeString()}`);

        // Schedule auto-reconnect check
        this.scheduleAutoReconnect();

        // Log the cutoff event
        const eventsStore = useEventsStore.getState();
        eventsStore.addEvent({
          id: `cutoff-${Date.now()}`,
          type: 'auto_off',
          timestamp: Date.now(),
          description: `⚠️ Automatic Power Cutoff: ${reason}`,
          readings: store.data || undefined,
        });

        // Show critical toast notification
        showToast.error('Power has been automatically disconnected for safety', '🚨 Safety Cutoff');

        console.log('✅ Power cutoff complete');
      } else {
        console.log('ℹ️ Relay already OFF, no action needed');
      }

      // Clear cutoff flag after 5 seconds
      setTimeout(() => {
        this.activeAlerts.delete('cutoff');
      }, 5000);
    });
  }

  // Schedule auto-reconnect after delay
  private scheduleAutoReconnect(): void {
    const settings = useSettingsStore.getState().settings;

    if (!settings.reconnection.enabled) {
      console.log('ℹ️ Auto-reconnect is disabled in settings');
      return;
    }

    const delayMs = settings.reconnection.delay * 1000; // Convert seconds to milliseconds

    // Clear any existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    console.log(`⏰ Auto-reconnect scheduled in ${settings.reconnection.delay} seconds`);

    // Set timer for auto-reconnect
    this.reconnectTimer = setTimeout(() => {
      console.log('⏰ Auto-reconnect timer expired, checking conditions...');
      this.attemptAutoReconnect();
    }, delayMs);
  }

  // Check if conditions are safe for auto-reconnect
  private checkAutoReconnect(data: ElectricalData, thresholds: any): void {
    // Only check if relay is OFF and we had an automatic cutoff
    if (data.relayState || this.autoCutoffTime === 0) {
      return;
    }

    const settings = useSettingsStore.getState().settings;
    if (!settings.reconnection.enabled) {
      return;
    }

    const timeSinceCutoff = Date.now() - this.autoCutoffTime;
    const delayMs = settings.reconnection.delay * 1000;

    // Check if enough time has passed
    if (timeSinceCutoff >= delayMs) {
      // Check if all conditions are safe
      const isSafe = this.areConditionsSafe(data, thresholds);

      if (isSafe) {
        console.log('✅ Conditions are safe, attempting auto-reconnect...');
        this.attemptAutoReconnect();
      } else {
        console.log('⚠️ Conditions still unsafe, delaying reconnect');
      }
    }
  }

  // Check if all electrical conditions are safe
  private areConditionsSafe(data: ElectricalData, thresholds: any): boolean {
    const voltageOK = data.voltage >= thresholds.voltage.min && data.voltage <= thresholds.voltage.max;
    const currentOK = data.current <= thresholds.current.max;
    const frequencyOK = !thresholds.frequency.enabled ||
                        (data.frequency >= thresholds.frequency.min && data.frequency <= thresholds.frequency.max);

    // Power factor safety check:
    // - IGNORE if current is very low (< 0.5A) - no load means PF is meaningless
    // - Otherwise: Safe when ABOVE threshold (protection triggers when < threshold)
    const powerFactorOK = !thresholds.powerFactor.enabled ||
                          data.current < 0.5 ||  // 🔥 KEY: Ignore PF when no load!
                          (data.powerFactor >= thresholds.powerFactor.min);

    console.log('🔍 Safety check:', {
      voltage: `${voltageOK ? '✅' : '❌'} (${data.voltage}V, min:${thresholds.voltage.min}, max:${thresholds.voltage.max})`,
      current: `${currentOK ? '✅' : '❌'} (${data.current}A, max:${thresholds.current.max})`,
      frequency: `${frequencyOK ? '✅' : '❌'} (${data.frequency}Hz)`,
      powerFactor: `${powerFactorOK ? '✅' : '❌'} (${data.powerFactor}, threshold:${thresholds.powerFactor.min}, current:${data.current}A)`
    });

    return voltageOK && currentOK && frequencyOK && powerFactorOK;
  }

  // Attempt to automatically reconnect power
  private attemptAutoReconnect(): void {
    console.log('🔌 Attempting automatic reconnection...');

    // Check if auto-reconnect is enabled
    const settings = useSettingsStore.getState().settings;
    if (!settings.reconnection.enabled) {
      console.log('ℹ️ Auto-reconnect is disabled, manual reset required');
      return;
    }

    import('../store/useElectricalStore').then(({ useElectricalStore }) => {
      const store = useElectricalStore.getState();

      // Only reconnect if relay is OFF
      if (!store.data?.relayState) {
        console.log('✅ Turning relay ON (auto-reconnect)');
        store.toggleRelay();

        // Reset cutoff time
        this.autoCutoffTime = 0;

        // Log the reconnect event
        const eventsStore = useEventsStore.getState();
        eventsStore.addEvent({
          id: `reconnect-${Date.now()}`,
          type: 'auto_on',
          timestamp: Date.now(),
          description: '✅ Automatic Reconnection: Conditions are safe',
          readings: store.data || undefined,
        });

        // Show success notification
        showToast.success('Power has been automatically restored', '✅ Auto-Reconnect');

        console.log('✅ Auto-reconnect complete');
      }
    });
  }

  // Check device offline
  public checkDeviceOffline(isConnected: boolean): void {
    const settings = useSettingsStore.getState().settings.notifications;

    if (!isConnected && settings.deviceOffline && !this.activeAlerts.has('offline')) {
      this.triggerAlert(
        'offline',
        '📡 Device Offline',
        'Connection to ESP32 has been lost',
        'warning'
      );
    } else if (isConnected && this.activeAlerts.has('offline')) {
      this.clearAlert('offline');
      this.triggerAlert(
        'online',
        '✅ Device Online',
        'Connection to ESP32 restored',
        'success'
      );
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Helper function to check all alerts
export const checkAllAlerts = (data: ElectricalData, isConnected: boolean): void => {
  console.log('🔔 Running alert checks...');
  notificationService.checkThresholdAlerts(data);
  notificationService.checkDeviceOffline(isConnected);
};

// Export test function
export const testNotifications = (): void => {
  notificationService.testNotification();
};