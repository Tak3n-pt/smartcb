// SIMPLE Connection Screen - One Button Does Everything
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useThemeStore, useElectricalStore } from '../store';

export default function SimpleLinkDeviceScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { connectToESP32 } = useElectricalStore();
  const themeColors = colors[theme];

  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setIsConnecting(true);
    setStatus('Checking ESP32...');
    setError('');

    try {
      // Step 1: Test if ESP32 is responding
      setStatus('Testing connection to 192.168.4.1...');

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('http://192.168.4.1/api/status', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error('ESP32 not responding');
      }

      const data = await response.json();

      // Check if we got real data
      if (data.voltage === undefined && data.current === undefined) {
        throw new Error('No data from ESP32');
      }

      // Step 2: Connect using store
      setStatus('Connecting...');
      const connected = await connectToESP32('192.168.4.1');

      if (connected) {
        setStatus('✅ Connected! Redirecting...');

        // Wait a moment then navigate
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 500);
      } else {
        throw new Error('Failed to establish connection');
      }

    } catch (error: any) {
      console.error('Connection error:', error);

      if (error.name === 'AbortError') {
        setError('⏱️ Connection timeout\n\nMake sure:\n• ESP32 is powered on\n• Phone connected to SmartCB-SETUP-XXXXXXXX WiFi');
      } else {
        setError(`❌ ${error.message}\n\nMake sure:\n• ESP32 is powered on\n• Phone connected to ESP32 hotspot`);
      }

      setStatus('');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="lightning-bolt-circle"
            size={80}
            color={themeColors.primary}
          />
          <Text style={[styles.title, { color: themeColors.text.primary }]}>
            SmartCB
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
            Connect to your device
          </Text>
        </View>

        {/* Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.instructionTitle, { color: themeColors.text.primary }]}>
            Before connecting:
          </Text>
          <View style={styles.instruction}>
            <Text style={[styles.instructionNumber, { color: themeColors.primary }]}>1</Text>
            <Text style={[styles.instructionText, { color: themeColors.text.secondary }]}>
              Make sure ESP32 is powered on
            </Text>
          </View>
          <View style={styles.instruction}>
            <Text style={[styles.instructionNumber, { color: themeColors.primary }]}>2</Text>
            <Text style={[styles.instructionText, { color: themeColors.text.secondary }]}>
              Connect phone to WiFi: SmartCB-SETUP-XXXXXXXX
            </Text>
          </View>
          <View style={styles.instruction}>
            <Text style={[styles.instructionNumber, { color: themeColors.primary }]}>3</Text>
            <Text style={[styles.instructionText, { color: themeColors.text.secondary }]}>
              Tap "Connect" below
            </Text>
          </View>
        </View>

        {/* Status Messages */}
        {status && !error && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={themeColors.primary} />
            <Text style={[styles.statusText, { color: themeColors.primary }]}>
              {status}
            </Text>
          </View>
        )}

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: themeColors.danger + '20' }]}>
            <Text style={[styles.errorText, { color: themeColors.danger }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Connect Button */}
        <TouchableOpacity
          style={[styles.connectButton, { opacity: isConnecting ? 0.5 : 1 }]}
          onPress={handleConnect}
          disabled={isConnecting}
        >
          <LinearGradient
            colors={['#0EA5E9', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            {isConnecting ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="link-variant" size={32} color="white" />
                <Text style={styles.connectButtonText}>Connect to ESP32</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Demo Mode Link */}
        <TouchableOpacity
          style={styles.demoButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={[styles.demoText, { color: themeColors.text.secondary }]}>
            Continue in Demo Mode
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  instructionsCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.large,
    marginBottom: spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  instructionTitle: {
    ...typography.h4,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  instructionText: {
    ...typography.body,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  statusText: {
    ...typography.body,
    fontWeight: '500',
  },
  errorContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  connectButton: {
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    marginBottom: spacing.md,
    elevation: 4,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  demoText: {
    ...typography.bodySmall,
    textDecorationLine: 'underline',
  },
});
