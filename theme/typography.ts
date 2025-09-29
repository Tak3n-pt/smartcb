// SmartCB Typography System

import { TextStyle } from 'react-native';

export const typography = {
  // Headers
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },

  // Body text
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },

  // Caption
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },

  // Metrics (for electrical values)
  metricLarge: {
    fontSize: 48,
    fontWeight: 'bold' as const,
    lineHeight: 56,
    fontFamily: 'monospace' as const,
  },
  metric: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 36,
    fontFamily: 'monospace' as const,
  },
  metricSmall: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    fontFamily: 'monospace' as const,
  },

  // Button text
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    textTransform: 'uppercase' as const,
  },

  // Labels
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
};

export type TypographyStyle = keyof typeof typography;