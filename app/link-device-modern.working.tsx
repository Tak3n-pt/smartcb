// Ultra-Simple ESP32 Connection
// Just connect to ESP32 at 192.168.4.1 - that's it!

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useThemeStore, useElectricalStore } from '../store';

export default function SimpleConnectionScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { connectToESP32 } = useElectricalStore();
  const themeColors = colors[theme];

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState(1);
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    // Automatically try to connect when screen loads
    handleDirectConnect();
  }, []);

  const handleDirectConnect = async () => {
    setIsConnecting(true);
    setConnectionStep(1);

    try {
      // Step 1: Check if connected to ESP32 hotspot
      setConnectionStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try to reach ESP32 at standard hotspot IP
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('http://192.168.4.1/api/info', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setDeviceInfo(data);

        // Step 2: Connect to device
        setConnectionStep(2);
        const connected = await connectToESP32('192.168.4.1');

        if (connected) {
          // Step 3: Success!
          setConnectionStep(3);
          await new Promise(resolve => setTimeout(resolve, 1000));

          Alert.alert(
            '✅ Connected Successfully!',
            `Connected to ${data.deviceName || 'SmartCB Device'}`,
            [
              {
                text: 'Go to Dashboard',
                onPress: () => router.replace('/(tabs)'),
              },
            ]
          );
        } else {
          throw new Error('Failed to establish connection');
        }
      } else {
        throw new Error('ESP32 not responding');
      }
    } catch (error) {
      console.error('Connection error:', error);

      // Show instructions for manual connection
      Alert.alert(
        'Connection Failed',
        'Could not connect to ESP32. Please ensure:\\n\\n' +
        '1. ESP32 is powered on\\n' +
        '2. You are connected to SmartCB-XXXXXXXX WiFi network\\n' +
        '3. ESP32 hotspot is active',
        [
          {
            text: 'WiFi Instructions',
            onPress: () => showWiFiInstructions()
          },
          {
            text: 'Try Again',
            onPress: () => handleDirectConnect()
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const showWiFiInstructions = () => {
    Alert.alert(
      '📶 WiFi Connection Steps',
      '1. Go to phone Settings > WiFi\\n' +
      '2. Look for network "SmartCB-SETUP-XXXXXXXX"\\n' +
      '3. Connect to this network (no password needed)\\n' +
      '4. Return to this app and try again',
      [
        { text: 'Got it', onPress: () => handleDirectConnect() }
      ]
    );
  };

  const testConnection = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('http://192.168.4.1/api/info', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          '✅ ESP32 Responding',
          `Device: ${data.deviceName || 'SmartCB'}\\n` +
          `ID: ${data.deviceId}\\n` +
          `IP: 192.168.4.1`,
          [
            { text: 'Connect Now', onPress: () => handleDirectConnect() }
          ]
        );
      } else {
        throw new Error('No response');
      }
    } catch (error) {
      Alert.alert(
        '❌ No Connection',
        'ESP32 not responding at 192.168.4.1\\n\\n' +
        'Make sure you are connected to ESP32 hotspot WiFi network.',
        [
          { text: 'WiFi Settings', onPress: () => showWiFiInstructions() }
        ]
      );
    }
  };

  const renderConnectionSteps = () => {
    const steps = [
      { id: 1, title: 'Checking Connection', desc: 'Looking for ESP32 at 192.168.4.1' },
      { id: 2, title: 'Connecting', desc: 'Establishing communication' },
      { id: 3, title: 'Success!', desc: 'Ready to monitor electrical data' },
    ];

    return (
      <View style={styles.stepsContainer}>
        {steps.map((step) => (
          <View key={step.id} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              {
                backgroundColor: connectionStep >= step.id
                  ? themeColors.primary
                  : themeColors.text.secondary
              }
            ]}>
              {connectionStep > step.id ? (
                <Ionicons name="checkmark" size={16} color="white" />
              ) : connectionStep === step.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.stepNumber}>{step.id}</Text>
              )}
            </View>

            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: themeColors.text.primary }]}>
                {step.title}
              </Text>
              <Text style={[styles.stepDesc, { color: themeColors.text.secondary }]}>
                {step.desc}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <LinearGradient
        colors={[themeColors.background, `${themeColors.primary}10`]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text.primary }]}>
            Direct Connection
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="wifi"
              size={80}
              color={themeColors.primary}
            />
          </View>

          <Text style={[styles.title, { color: themeColors.text.primary }]}>
            Simple ESP32 Connection
          </Text>

          <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
            Connect directly to ESP32 hotspot - no home WiFi setup needed!
          </Text>

          {isConnecting ? (
            <View style={styles.connectingContainer}>
              {renderConnectionSteps()}
            </View>
          ) : (
            <View style={styles.actionsContainer}>
              <View style={styles.instructionBox}>
                <MaterialCommunityIcons
                  name="information"
                  size={24}
                  color={themeColors.primary}
                />
                <Text style={[styles.instructionText, { color: themeColors.text.primary }]}>
                  Make sure you're connected to the ESP32 hotspot WiFi network before proceeding.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: themeColors.primary }]}
                onPress={handleDirectConnect}
              >
                <Ionicons name="flash" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Connect to ESP32</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: themeColors.primary }]}
                onPress={testConnection}
              >
                <Ionicons name="pulse" size={20} color={themeColors.primary} />
                <Text style={[styles.secondaryButtonText, { color: themeColors.primary }]}>
                  Test Connection
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tertiaryButton]}
                onPress={showWiFiInstructions}
              >
                <Ionicons name="help-circle" size={20} color={themeColors.text.secondary} />
                <Text style={[styles.tertiaryButtonText, { color: themeColors.text.secondary }]}>
                  WiFi Setup Help
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {deviceInfo && (
            <View style={[styles.deviceInfoBox, { backgroundColor: themeColors.surface }]}>
              <Text style={[styles.deviceInfoTitle, { color: themeColors.text.primary }]}>
                Device Found
              </Text>
              <Text style={[styles.deviceInfoText, { color: themeColors.text.secondary }]}>
                {deviceInfo.deviceName || 'SmartCB Device'}
              </Text>
              <Text style={[styles.deviceInfoText, { color: themeColors.text.secondary }]}>
                ID: {deviceInfo.deviceId}
              </Text>
              <Text style={[styles.deviceInfoText, { color: themeColors.text.secondary }]}>
                IP: 192.168.4.1
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  title: {
    ...typography.h2,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  connectingContainer: {
    marginVertical: spacing.xl,
  },
  stepsContainer: {
    marginVertical: spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  stepDesc: {
    ...typography.caption,
  },
  actionsContainer: {
    marginTop: spacing.xl,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#E3F2FD',
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  instructionText: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    ...typography.body,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    marginBottom: spacing.md,
  },
  secondaryButtonText: {
    ...typography.body,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  tertiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  tertiaryButtonText: {
    ...typography.body,
    marginLeft: spacing.sm,
  },
  deviceInfoBox: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
  },
  deviceInfoTitle: {
    ...typography.body,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  deviceInfoText: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
});