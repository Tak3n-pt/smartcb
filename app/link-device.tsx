// ESP32 Connection Screen - WiFi Only

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  TextInput,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { useThemeStore, useElectricalStore } from '../store';

type ThemePalette = (typeof colors)['light'];
type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'failed';

const { width: screenWidth } = Dimensions.get('window');

// WiFi-only connection - removed Bluetooth components

export default function LinkDeviceScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { setConnected } = useElectricalStore();
  const themeColors = colors[theme] as ThemePalette;
  const { t } = useTranslation();

  // Connection tips
  const wifiTips = [
    t('linkDevice.wifi.tips.network'),
    t('linkDevice.wifi.tips.ip'),
    t('linkDevice.wifi.tips.port'),
  ];

  // WiFi connection state only
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [wifiIP, setWifiIP] = useState('');
  const [wifiPort, setWifiPort] = useState('80');
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasAutoDetected, setHasAutoDetected] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for scanning
  useEffect(() => {
    if (connectionStatus === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [connectionStatus]);

  // Rotation animation for connecting
  useEffect(() => {
    if (connectionStatus === 'connecting') {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [connectionStatus]);

  // Auto-detect IP on component mount
  useEffect(() => {
    if (!hasAutoDetected) {
      handleAutoDetect();
      setHasAutoDetected(true);
    }
  }, []);

  const handleAutoDetect = () => {
    setIsDetecting(true);

    // Common ESP32 IP addresses to try
    const commonIPs = [
      '192.168.1.100',
      '192.168.0.100',
      '192.168.4.1',    // ESP32 Access Point default
      '192.168.1.10',
      '192.168.0.10',
      '10.0.0.100',
    ];

    // Simulate detection process
    setTimeout(() => {
      // In a real app, you would try to ping or connect to these IPs
      // For demo, randomly select one
      const randomIndex = Math.floor(Math.random() * commonIPs.length);
      setWifiIP(commonIPs[randomIndex]);
      setIsDetecting(false);
    }, 1500);
  };

  const handleConnect = () => {
    // WiFi connection only

    setConnectionStatus('connecting');

    // Simulate connection process
    setTimeout(() => {
      setConnectionStatus('connected');
      // Update store to indicate we're connected (not in demo mode)
      setConnected(true);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
    }, 3000);
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              // Navigate to welcome screen instead of using back
              router.replace('/welcome');
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
          </TouchableOpacity>

          {/* Modern Logo Section */}
          <View style={styles.logoSection}>
            <View style={[styles.logoContainer, {
              backgroundColor: themeColors.primaryLight,
              borderColor: themeColors.primary
            }]}>
              <Image
                source={require('../assets/images/logo.png')}
                style={[styles.logo, { tintColor: themeColors.primary }]}
                resizeMode="contain"
              />
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={[styles.appName, { color: themeColors.primary }]}>{t('common.appName')}</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: themeColors.text.primary }]}>
            {t('linkDevice.title')}
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
            {t('linkDevice.subtitle')}
          </Text>
        </View>

        {/* WiFi Connection Card */}
        <View style={styles.methodSelector}>
          <TouchableOpacity
            style={[
              styles.methodCard,
              styles.methodCardActive,
              {
                backgroundColor: themeColors.primaryLight,
                borderColor: themeColors.primary,
              }
            ]}
          >
            {/* ESP32 Visual Badge */}
            <View style={[styles.esp32Badge, {
              backgroundColor: themeColors.primary
            }]}>
              <Text style={styles.esp32Text}>{t('linkDevice.wifi.esp32Badge')}</Text>
            </View>

            <View style={[styles.methodIconContainer, {
              backgroundColor: 'rgba(33, 150, 243, 0.1)'
            }]}>
              <Ionicons
                name="wifi"
                size={24}
                color={themeColors.primary}
              />
            </View>

            <Text style={[
              styles.methodTitle,
              { color: themeColors.primary }
            ]}>
              {t('linkDevice.wifi.title')}
            </Text>
            <Text style={[styles.methodDescription, { color: themeColors.text.secondary }]}>
              {t('linkDevice.wifi.description')}
            </Text>

            {/* ESP32 Module Visual */}
            <View style={styles.moduleVisual}>
              <View style={[styles.moduleDot, { backgroundColor: themeColors.success }]} />
              <View style={[styles.moduleDot, { backgroundColor: themeColors.warning }]} />
              <View style={[styles.moduleDot, { backgroundColor: themeColors.primary }]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* WiFi Configuration */}
        <View style={[styles.configSection, { backgroundColor: themeColors.surface }]}>
              {/* WiFi Configuration */}
              <View style={styles.wifiConfig}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: themeColors.text.secondary }]}>
                    {t('linkDevice.wifi.ipAddress')}
                  </Text>
                  <View style={styles.inputWithButton}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputFlex,
                        {
                          backgroundColor: themeColors.background,
                          color: themeColors.text.primary,
                          borderColor: themeColors.border,
                        }
                      ]}
                      value={wifiIP}
                      onChangeText={setWifiIP}
                      placeholder="192.168.1.100"
                      placeholderTextColor={themeColors.text.disabled}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      onPress={handleAutoDetect}
                      disabled={isDetecting}
                      style={[
                        styles.autoDetectButton,
                        {
                          backgroundColor: isDetecting ? themeColors.primaryLight : themeColors.primary,
                          opacity: isDetecting ? 0.6 : 1,
                        }
                      ]}
                    >
                      {isDetecting ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Ionicons name="search" size={20} color="white" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: themeColors.text.secondary }]}>
                    {t('linkDevice.wifi.port')}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: themeColors.background,
                        color: themeColors.text.primary,
                        borderColor: themeColors.border,
                      }
                    ]}
                    value={wifiPort}
                    onChangeText={setWifiPort}
                    placeholder="80"
                    placeholderTextColor={themeColors.text.disabled}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* WiFi Tips */}
              <View style={styles.tipsContainer}>
                {wifiTips.map((tip, index) => (
                  <View key={index} style={styles.tipRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={themeColors.success}
                    />
                    <Text style={[styles.tipText, { color: themeColors.text.secondary }]}>
                      {tip}
                    </Text>
                  </View>
                ))}
              </View>
        </View>

        {/* Connection Status */}
        {connectionStatus !== 'idle' && (
          <View style={[styles.statusContainer, { backgroundColor: themeColors.surface }]}>
            {/* Use Animated.View only for rotating statuses */}
            {(connectionStatus === 'scanning' || connectionStatus === 'connecting') && (
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                {connectionStatus === 'scanning' && (
                  <ActivityIndicator size="large" color={themeColors.primary} />
                )}
                {connectionStatus === 'connecting' && (
                  <MaterialCommunityIcons name="loading" size={32} color={themeColors.primary} />
                )}
              </Animated.View>
            )}
            {/* Static icons without rotation */}
            {connectionStatus === 'connected' && (
              <Ionicons name="checkmark-circle" size={32} color={themeColors.success} />
            )}
            {connectionStatus === 'failed' && (
              <Ionicons name="close-circle" size={32} color={themeColors.danger} />
            )}
            <Text style={[styles.statusText, { color: themeColors.text.primary }]}>
              {connectionStatus === 'scanning' && t('linkDevice.status.scanning')}
              {connectionStatus === 'connecting' && t('linkDevice.status.connecting')}
              {connectionStatus === 'connected' && t('linkDevice.status.connected')}
              {connectionStatus === 'failed' && t('linkDevice.status.failed')}
            </Text>
          </View>
        )}

        {/* Connect Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleConnect}
          disabled={connectionStatus === 'connecting' || connectionStatus === 'scanning'}
          style={[
            styles.connectButton,
            {
              backgroundColor: themeColors.primary,
              opacity: connectionStatus === 'connecting' ? 0.6 : 1,
            }
          ]}
        >
          <Text style={[styles.connectButtonText, { color: themeColors.text.inverse }]}>
            {connectionStatus === 'connecting'
              ? t('linkDevice.buttons.connecting')
              : t('linkDevice.buttons.connect')}
          </Text>
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            // Ensure we're in demo mode
            setConnected(false);
            // Navigate to home screen in demo mode
            router.replace('/(tabs)');
          }}
          style={[
            styles.skipButton,
            {
              borderColor: themeColors.text.secondary,
            }
          ]}
        >
          <Text style={[styles.skipButtonText, { color: themeColors.text.secondary }]}>
            {t('linkDevice.demoMode')}
          </Text>
          <Ionicons
            name="arrow-forward-outline"
            size={18}
            color={themeColors.text.secondary}
            style={{ marginLeft: spacing.xs }}
          />
        </TouchableOpacity>

        {/* Help Link */}
        <TouchableOpacity style={styles.helpLink}>
          <Ionicons name="help-circle-outline" size={20} color={themeColors.text.secondary} />
          <Text style={[styles.helpText, { color: themeColors.text.secondary }]}>
            {t('linkDevice.help')}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: spacing.sm,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
  logo: {
    width: 35,
    height: 35,
  },
  logoTextContainer: {
    alignItems: 'center',
  },
  appName: {
    ...typography.h3,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  appTagline: {
    ...typography.caption,
    letterSpacing: 0.5,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  methodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  methodCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.large,
    borderWidth: 2,
    alignItems: 'center',
    ...shadows.small,
  },
  methodCardActive: {
    borderWidth: 2,
  },
  esp32Badge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.small,
  },
  esp32Text: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  methodIconContainer: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  methodTitle: {
    ...typography.body,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  methodDescription: {
    ...typography.caption,
    textAlign: 'center',
    fontSize: 10,
  },
  moduleVisual: {
    position: 'absolute',
    bottom: spacing.sm,
    flexDirection: 'row',
  },
  moduleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  configSection: {
    padding: spacing.md,
    borderRadius: borderRadius.large,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  scanButtonText: {
    ...typography.button,
  },
  wifiConfig: {
    // gap replaced with margins on children
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.bodySmall,
    marginLeft: spacing.xs,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap not supported in all React Native versions, use marginLeft on button instead
  },
  inputFlex: {
    flex: 1,
  },
  autoDetectButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  tipsContainer: {
    marginTop: spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tipText: {
    ...typography.bodySmall,
    flex: 1,
    marginLeft: spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.large,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  statusText: {
    ...typography.bodySmall,
    marginLeft: spacing.sm,
  },
  connectButton: {
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    ...shadows.medium,
  },
  connectButtonText: {
    ...typography.button,
    fontWeight: '600',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  skipButtonText: {
    ...typography.bodySmall,
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  helpText: {
    ...typography.bodySmall,
    marginLeft: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xlarge,
    borderTopRightRadius: borderRadius.xlarge,
    paddingTop: spacing.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    ...typography.h3,
  },
  deviceList: {
    padding: spacing.lg,
  },
  scanningContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  scanningText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    padding: spacing.xl,
  },
});