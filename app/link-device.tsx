// ESP32 Connection Screen - Bluetooth & WiFi

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
  Dimensions,
  Modal,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { useThemeStore, useElectricalStore } from '../store';

type ThemePalette = (typeof colors)['light'];
type ConnectionMethod = 'bluetooth' | 'wifi';
type ConnectionStatus = 'idle' | 'scanning' | 'connecting' | 'connected' | 'failed';

const { width: screenWidth } = Dimensions.get('window');

// Mock Bluetooth devices for demo
const mockBluetoothDevices = [
  { id: '1', name: 'SmartCB-ESP32-001', rssi: -45, address: 'AA:BB:CC:DD:EE:FF' },
  { id: '2', name: 'SmartCB-ESP32-002', rssi: -62, address: 'FF:EE:DD:CC:BB:AA' },
  { id: '3', name: 'ESP32-DevKit', rssi: -78, address: '11:22:33:44:55:66' },
];

interface DeviceItemProps {
  device: typeof mockBluetoothDevices[0];
  onPress: () => void;
  themeColors: ThemePalette;
  isSelected: boolean;
}

function DeviceItem({ device, onPress, themeColors, isSelected }: DeviceItemProps) {
  const signalStrength = device.rssi > -50 ? 'strong' : device.rssi > -70 ? 'medium' : 'weak';
  const signalColor = signalStrength === 'strong' ? themeColors.success :
                      signalStrength === 'medium' ? themeColors.warning :
                      themeColors.text.disabled;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.deviceItem,
        {
          backgroundColor: isSelected ? themeColors.primaryLight : themeColors.surface,
          borderColor: isSelected ? themeColors.primary : themeColors.border,
        }
      ]}
    >
      <View style={styles.deviceIcon}>
        <MaterialCommunityIcons
          name="chip"
          size={24}
          color={isSelected ? themeColors.primary : themeColors.text.secondary}
        />
      </View>

      <View style={styles.deviceInfo}>
        <Text style={[styles.deviceName, { color: themeColors.text.primary }]}>
          {device.name}
        </Text>
        <Text style={[styles.deviceAddress, { color: themeColors.text.secondary }]}>
          {device.address}
        </Text>
      </View>

      <View style={styles.deviceSignal}>
        <View style={styles.signalBars}>
          {[1, 2, 3].map((bar) => (
            <View
              key={bar}
              style={[
                styles.signalBar,
                {
                  backgroundColor: bar <= (signalStrength === 'strong' ? 3 : signalStrength === 'medium' ? 2 : 1)
                    ? signalColor
                    : themeColors.text.disabled,
                  height: bar * 5 + 5,
                }
              ]}
            />
          ))}
        </View>
        <Text style={[styles.rssiText, { color: themeColors.text.secondary }]}>
          {device.rssi} dBm
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function LinkDeviceScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { setConnected } = useElectricalStore();
  const themeColors = colors[theme] as ThemePalette;
  const { t } = useTranslation();

  // Connection tips
  const bluetoothTips = [
    t('linkDevice.bluetooth.tips.power'),
    t('linkDevice.bluetooth.tips.enable'),
    t('linkDevice.bluetooth.tips.distance'),
  ];

  const wifiTips = [
    t('linkDevice.wifi.tips.network'),
    t('linkDevice.wifi.tips.ip'),
    t('linkDevice.wifi.tips.port'),
  ];

  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>('bluetooth');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [selectedDevice, setSelectedDevice] = useState<typeof mockBluetoothDevices[0] | null>(null);
  const [wifiIP, setWifiIP] = useState('192.168.1.100');
  const [wifiPort, setWifiPort] = useState('80');
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [foundDevices, setFoundDevices] = useState<typeof mockBluetoothDevices>([]);

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

  const handleBluetoothScan = () => {
    setConnectionStatus('scanning');
    setShowDeviceList(true);

    // Simulate device discovery
    setTimeout(() => {
      setFoundDevices(mockBluetoothDevices);
      setConnectionStatus('idle');
    }, 2000);
  };

  const handleDeviceSelect = (device: typeof mockBluetoothDevices[0]) => {
    setSelectedDevice(device);
    setShowDeviceList(false);
  };

  const handleConnect = () => {
    if (connectionMethod === 'bluetooth' && !selectedDevice) {
      handleBluetoothScan();
      return;
    }

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

  const handleMethodChange = (method: ConnectionMethod) => {
    setConnectionMethod(method);
    setConnectionStatus('idle');
    setSelectedDevice(null);
    setFoundDevices([]);
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
              <Text style={[styles.appTagline, { color: themeColors.text.secondary }]}>{t('linkDevice.subtitle')}</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: themeColors.text.primary }]}>
            {t('linkDevice.title')}
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
            {t('linkDevice.subtitle')}
          </Text>
        </View>

        {/* Connection Method Selector with ESP32 Branding */}
        <View style={styles.methodSelector}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleMethodChange('bluetooth')}
            style={[
              styles.methodCard,
              connectionMethod === 'bluetooth' && styles.methodCardActive,
              {
                backgroundColor: connectionMethod === 'bluetooth'
                  ? themeColors.primaryLight
                  : themeColors.surface,
                borderColor: connectionMethod === 'bluetooth'
                  ? themeColors.primary
                  : themeColors.border,
              }
            ]}
          >
            {/* ESP32 Visual Badge */}
            <View style={[styles.esp32Badge, {
              backgroundColor: connectionMethod === 'bluetooth'
                ? themeColors.primary
                : themeColors.text.disabled
            }]}>
              <Text style={styles.esp32Text}>ESP32</Text>
            </View>

            <Animated.View style={{ transform: [{ scale: connectionMethod === 'bluetooth' ? pulseAnim : 1 }] }}>
              <View style={[styles.methodIconContainer, {
                backgroundColor: connectionMethod === 'bluetooth'
                  ? 'rgba(33, 150, 243, 0.1)'
                  : 'transparent'
              }]}>
                <Ionicons
                  name="bluetooth"
                  size={32}
                  color={connectionMethod === 'bluetooth' ? themeColors.primary : themeColors.text.secondary}
                />
              </View>
            </Animated.View>

            <Text style={[
              styles.methodTitle,
              { color: connectionMethod === 'bluetooth' ? themeColors.primary : themeColors.text.primary }
            ]}>
              {t('linkDevice.bluetooth.title')}
            </Text>
            <Text style={[styles.methodDescription, { color: themeColors.text.secondary }]}>
              {t('linkDevice.bluetooth.description')}
            </Text>

            {/* ESP32 Module Visual */}
            <View style={styles.moduleVisual}>
              <View style={[styles.moduleDot, { backgroundColor: themeColors.success }]} />
              <View style={[styles.moduleDot, { backgroundColor: themeColors.warning }]} />
              <View style={[styles.moduleDot, { backgroundColor: themeColors.primary }]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleMethodChange('wifi')}
            style={[
              styles.methodCard,
              connectionMethod === 'wifi' && styles.methodCardActive,
              {
                backgroundColor: connectionMethod === 'wifi'
                  ? themeColors.primaryLight
                  : themeColors.surface,
                borderColor: connectionMethod === 'wifi'
                  ? themeColors.primary
                  : themeColors.border,
              }
            ]}
          >
            {/* ESP32 Visual Badge */}
            <View style={[styles.esp32Badge, {
              backgroundColor: connectionMethod === 'wifi'
                ? themeColors.primary
                : themeColors.text.disabled
            }]}>
              <Text style={styles.esp32Text}>ESP32</Text>
            </View>

            <View style={[styles.methodIconContainer, {
              backgroundColor: connectionMethod === 'wifi'
                ? 'rgba(33, 150, 243, 0.1)'
                : 'transparent'
            }]}>
              <Ionicons
                name="wifi"
                size={32}
                color={connectionMethod === 'wifi' ? themeColors.primary : themeColors.text.secondary}
              />
            </View>

            <Text style={[
              styles.methodTitle,
              { color: connectionMethod === 'wifi' ? themeColors.primary : themeColors.text.primary }
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

        {/* Connection Configuration */}
        <View style={[styles.configSection, { backgroundColor: themeColors.surface }]}>
          {connectionMethod === 'bluetooth' ? (
            <>
              {selectedDevice ? (
                <View style={styles.selectedDeviceContainer}>
                  <View style={styles.selectedDeviceHeader}>
                    <MaterialCommunityIcons name="chip" size={24} color={themeColors.primary} />
                    <Text style={[styles.selectedDeviceLabel, { color: themeColors.text.secondary }]}>
                      {t('linkDevice.bluetooth.found')}
                    </Text>
                  </View>
                  <View style={[styles.selectedDeviceInfo, { backgroundColor: themeColors.background }]}>
                    <Text style={[styles.selectedDeviceName, { color: themeColors.text.primary }]}>
                      {selectedDevice.name}
                    </Text>
                    <Text style={[styles.selectedDeviceAddress, { color: themeColors.text.secondary }]}>
                      {selectedDevice.address}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleBluetoothScan}
                    style={styles.changeDeviceButton}
                  >
                    <Text style={[styles.changeDeviceText, { color: themeColors.primary }]}>
                      {t('linkDevice.bluetooth.changeDevice')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleBluetoothScan}
                  style={[styles.scanButton, { borderColor: themeColors.primary }]}
                >
                  <Ionicons name="search" size={24} color={themeColors.primary} />
                  <Text style={[styles.scanButtonText, { color: themeColors.primary, marginLeft: spacing.sm }]}>
                    {t('linkDevice.bluetooth.scanButton')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Bluetooth Tips */}
              <View style={styles.tipsContainer}>
                {bluetoothTips.map((tip, index) => (
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
            </>
          ) : (
            <>
              {/* WiFi Configuration */}
              <View style={styles.wifiConfig}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: themeColors.text.secondary }]}>
                    {t('linkDevice.wifi.ipAddress')}
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
                    value={wifiIP}
                    onChangeText={setWifiIP}
                    placeholder="192.168.1.100"
                    placeholderTextColor={themeColors.text.disabled}
                    keyboardType="numeric"
                  />
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
            </>
          )}
        </View>

        {/* Connection Status */}
        {connectionStatus !== 'idle' && (
          <View style={[styles.statusContainer, { backgroundColor: themeColors.surface }]}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              {connectionStatus === 'scanning' && (
                <ActivityIndicator size="large" color={themeColors.primary} />
              )}
              {connectionStatus === 'connecting' && (
                <MaterialCommunityIcons name="loading" size={32} color={themeColors.primary} />
              )}
              {connectionStatus === 'connected' && (
                <Ionicons name="checkmark-circle" size={32} color={themeColors.success} />
              )}
              {connectionStatus === 'failed' && (
                <Ionicons name="close-circle" size={32} color={themeColors.danger} />
              )}
            </Animated.View>
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
              opacity: connectionStatus === 'connecting' || connectionStatus === 'scanning' ? 0.6 : 1,
            }
          ]}
        >
          <Text style={[styles.connectButtonText, { color: themeColors.text.inverse }]}>
            {connectionStatus === 'connecting'
              ? t('linkDevice.buttons.connecting')
              : connectionStatus === 'scanning'
              ? t('linkDevice.buttons.scanning')
              : connectionMethod === 'bluetooth' && !selectedDevice
              ? t('linkDevice.buttons.scanAndConnect')
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
      </ScrollView>

      {/* Device List Modal */}
      <Modal
        visible={showDeviceList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeviceList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text.primary }]}>
                {t('linkDevice.modal.title')}
              </Text>
              <TouchableOpacity onPress={() => setShowDeviceList(false)}>
                <Ionicons name="close" size={24} color={themeColors.text.primary} />
              </TouchableOpacity>
            </View>

            {connectionStatus === 'scanning' ? (
              <View style={styles.scanningContainer}>
                <ActivityIndicator size="large" color={themeColors.primary} />
                <Text style={[styles.scanningText, { color: themeColors.text.secondary }]}>
                  {t('linkDevice.modal.scanning')}
                </Text>
              </View>
            ) : (
              <FlatList
                data={foundDevices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <DeviceItem
                    device={item}
                    onPress={() => handleDeviceSelect(item)}
                    themeColors={themeColors}
                    isSelected={selectedDevice?.id === item.id}
                  />
                )}
                contentContainerStyle={styles.deviceList}
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: themeColors.text.secondary }]}>
                    {t('linkDevice.modal.noDevices')}
                  </Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: spacing.sm,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: spacing.md,
  },
  logo: {
    width: 50,
    height: 50,
  },
  logoTextContainer: {
    alignItems: 'center',
  },
  appName: {
    ...typography.h2,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  appTagline: {
    ...typography.caption,
    letterSpacing: 0.5,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  methodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  methodCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
    padding: spacing.lg,
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
    width: 60,
    height: 60,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  methodTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  methodDescription: {
    ...typography.caption,
    textAlign: 'center',
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
    padding: spacing.lg,
    borderRadius: borderRadius.large,
    marginBottom: spacing.lg,
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
  selectedDeviceContainer: {
    // gap replaced with margins on children
  },
  selectedDeviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedDeviceLabel: {
    ...typography.bodySmall,
    marginLeft: spacing.sm,
  },
  selectedDeviceInfo: {
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectedDeviceName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  selectedDeviceAddress: {
    ...typography.caption,
  },
  changeDeviceButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  changeDeviceText: {
    ...typography.bodySmall,
    fontWeight: '600',
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
    padding: spacing.lg,
    borderRadius: borderRadius.large,
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  statusText: {
    ...typography.body,
    marginLeft: spacing.md,
  },
  connectButton: {
    paddingVertical: spacing.md,
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  skipButtonText: {
    ...typography.button,
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
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
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    ...typography.body,
    fontWeight: '600',
  },
  deviceAddress: {
    ...typography.caption,
  },
  deviceSignal: {
    alignItems: 'center',
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  signalBar: {
    width: 3,
    borderRadius: 1,
    marginHorizontal: 1,
  },
  rssiText: {
    ...typography.caption,
    fontSize: 10,
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