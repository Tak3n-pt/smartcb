// Welcome Screen - Modern Design

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useThemeStore } from '../store';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { t } = useTranslation();

  const features = [
    {
      icon: 'shield-checkmark',
      gradient: ['#10B981', '#059669'],
      title: t('welcome.features.smartProtection.title'),
      description: t('welcome.features.smartProtection.description'),
    },
    {
      icon: 'phone-portrait',
      gradient: ['#3B82F6', '#2563EB'],
      title: t('welcome.features.remoteControl.title'),
      description: t('welcome.features.remoteControl.description'),
    },
    {
      icon: 'trending-up',
      gradient: ['#F59E0B', '#D97706'],
      title: t('welcome.features.realTimeInsights.title'),
      description: t('welcome.features.realTimeInsights.description'),
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
      <View style={styles.container}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Image
                source={require('../assets/images/logo.png')}
                resizeMode="contain"
                style={styles.logo}
              />
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: themeColors.text.primary }]}>
            {t('welcome.title')}
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
            {t('welcome.subtitle')}
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {features.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureCard,
                { backgroundColor: themeColors.surface }
              ]}
            >
              <LinearGradient
                colors={feature.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureIconContainer}
              >
                <Ionicons
                  name={feature.icon as any}
                  size={24}
                  color="#FFFFFF"
                />
              </LinearGradient>

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

        {/* CTA Button */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleGetStarted}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>
                {t('welcome.getStarted')}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.footerText, { color: themeColors.text.secondary }]}>
            {t('welcome.footerText')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    justifyContent: 'space-between',
  },

  // Hero Section
  hero: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing.md,
  },
  logoGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 55,
    height: 55,
    tintColor: '#FFFFFF',
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: screenWidth - 80,
  },

  // Features
  features: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  featureCard: {
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  featureContent: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    ...typography.h4,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  featureDescription: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
  },

  // CTA Section
  ctaSection: {
    alignItems: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl + spacing.md,
    borderRadius: borderRadius.large,
    gap: spacing.sm,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    minWidth: screenWidth - (spacing.lg * 2),
  },
  ctaButtonText: {
    ...typography.button,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  footerText: {
    ...typography.bodySmall,
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
