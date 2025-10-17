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
                  size={20}
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
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    justifyContent: 'space-between',
  },

  // Hero Section
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  logoContainer: {
    marginBottom: spacing.sm,
  },
  logoGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  logo: {
    width: 42,
    height: 42,
    tintColor: '#FFFFFF',
  },
  title: {
    ...typography.h1,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...typography.body,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: screenWidth - 80,
  },

  // Features
  features: {
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  featureCard: {
    borderRadius: borderRadius.medium,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...typography.h4,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 1,
    letterSpacing: 0.2,
  },
  featureDescription: {
    ...typography.body,
    fontSize: 11,
    lineHeight: 15,
  },

  // CTA Section
  ctaSection: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.large,
    gap: spacing.sm,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    minWidth: screenWidth - (spacing.lg * 2),
  },
  ctaButtonText: {
    ...typography.button,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  footerText: {
    ...typography.bodySmall,
    fontSize: 11,
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: 15,
  },
});
