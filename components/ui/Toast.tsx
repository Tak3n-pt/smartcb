// Modern Toast Notification Component

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onDismiss: () => void;
  title?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 4000,
  onDismiss,
  title,
  action,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      dismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          icon: 'checkmark-circle' as const,
          iconColor: '#ffffff',
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          icon: 'alert-circle' as const,
          iconColor: '#ffffff',
        };
      case 'warning':
        return {
          backgroundColor: '#F59E0B',
          icon: 'warning' as const,
          iconColor: '#ffffff',
        };
      case 'info':
        return {
          backgroundColor: '#3B82F6',
          icon: 'information-circle' as const,
          iconColor: '#ffffff',
        };
    }
  };

  const config = getConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={config.icon} size={24} color={config.iconColor} />
        </View>

        <View style={styles.textContainer}>
          {title && <Text style={styles.title}>{title}</Text>}
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>

        <TouchableOpacity onPress={dismiss} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {action && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            action.onPress();
            dismiss();
          }}
        >
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,
    left: spacing.md,
    right: spacing.md,
    borderRadius: borderRadius.large,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.h4,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    ...typography.body,
    color: '#ffffff',
    opacity: 0.95,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  actionButton: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  actionText: {
    ...typography.body,
    color: '#ffffff',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
