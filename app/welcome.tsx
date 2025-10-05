// Welcome Screen

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { useThemeStore } from '../store';

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { t } = useTranslation();

  const featureHighlights = [
    {
      icon: 'flash-outline',
      title: t('welcome.features.liveMonitoring.title'),
      description: t('welcome.features.liveMonitoring.description'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: t('welcome.features.safetyAutomation.title'),
      description: t('welcome.features.safetyAutomation.description'),
    },
    {
      icon: 'analytics-outline',
      title: t('welcome.features.insightfulAnalytics.title'),
      description: t('welcome.features.insightfulAnalytics.description'),
    },
  ];

  const handleGetStarted = () => {
    router.replace('/link-device');
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.backgroundDecor} pointerEvents="none">
        <View
          style={[
            styles.primaryBlob,
            {
              backgroundColor: themeColors.primary,
              opacity: theme === 'dark' ? 0.25 : 0.18,
            },
          ]}
        />
        <View
          style={[
            styles.secondaryBlob,
            {
              backgroundColor: themeColors.surface,
              opacity: theme === 'dark' ? 0.12 : 0.08,
            },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View
            style={[
              styles.logoWrapper,
              {
                backgroundColor: theme === 'dark' ? themeColors.surfaceElevated : themeColors.surface,
              },
            ]}
          >
            <View
              style={[
                styles.glow,
                {
                  backgroundColor: themeColors.primary,
                  opacity: theme === 'dark' ? 0.3 : 0.2,
                },
              ]}
            />
            <Image
              source={require('../assets/images/logo.png')}
              resizeMode="contain"
              style={[
                styles.logo,
                theme === 'dark' && { tintColor: themeColors.text.inverse },
              ]}
            />
          </View>

          <Text style={[styles.title, { color: themeColors.text.primary }]}>{t('welcome.title')}</Text>
          <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
            {t('welcome.subtitle')}
          </Text>
        </View>

        <View style={styles.featureList}>
          {featureHighlights.map((feature) => (
            <View
              key={feature.title}
              style={[
                styles.featureCard,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : themeColors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.featureIconWrapper,
                  {
                    backgroundColor:
                      theme === 'dark' ? 'rgba(66, 165, 245, 0.22)' : 'rgba(33, 150, 243, 0.12)',
                  },
                ]}
              >
                <Ionicons
                  name={feature.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={themeColors.primary}
                />
              </View>

              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: themeColors.text.primary }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: themeColors.text.secondary }]}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.92}
            style={[
              styles.primaryButton,
              {
                backgroundColor: themeColors.primary,
              },
            ]}
            onPress={handleGetStarted}
          >
            <Text style={[styles.primaryButtonLabel, { color: themeColors.text.inverse }]}>{t('welcome.getStarted')}</Text>
          </TouchableOpacity>
          <View style={styles.secondaryAction}>
            <Text style={[styles.secondaryText, { color: themeColors.text.secondary }]}>
              {t('welcome.footerText')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundDecor: {
    ...StyleSheet.absoluteFillObject,
  },
  primaryBlob: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 420,
    top: -180,
    right: -140,
  },
  secondaryBlob: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 320,
    bottom: -160,
    left: -120,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 168,
    height: 168,
    borderRadius: 168,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.large,
  },
  glow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  logo: {
    width: '72%',
    height: '72%',
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 360,
  },
  featureList: {
    marginTop: spacing.xl,
  },
  featureCard: {
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  footer: {
    marginTop: spacing.xl,
  },
  primaryButton: {
    borderRadius: borderRadius.large,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  primaryButtonLabel: {
    ...typography.button,
    letterSpacing: 1,
  },
  secondaryAction: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  secondaryText: {
    ...typography.bodySmall,
  },
});


