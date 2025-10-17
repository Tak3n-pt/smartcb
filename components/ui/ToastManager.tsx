// Toast Manager - Global Toast Notification System

import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Toast, ToastProps, ToastType } from './Toast';

interface ToastData extends Omit<ToastProps, 'onDismiss'> {
  id: string;
}

let toastManagerRef: ToastManagerHandle | null = null;

export interface ToastManagerHandle {
  show: (config: Omit<ToastData, 'id' | 'onDismiss'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

export const ToastManager = React.forwardRef<ToastManagerHandle>((props, ref) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const show = useCallback((config: Omit<ToastData, 'id' | 'onDismiss'>) => {
    const id = Date.now().toString();
    const newToast: ToastData = {
      ...config,
      id,
    };

    setToasts((prev) => {
      // Only keep last 3 toasts
      const updated = [...prev, newToast];
      return updated.slice(-3);
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, title?: string) => {
    show({ message, title, type: 'success' });
  }, [show]);

  const error = useCallback((message: string, title?: string) => {
    show({ message, title, type: 'error' });
  }, [show]);

  const warning = useCallback((message: string, title?: string) => {
    show({ message, title, type: 'warning' });
  }, [show]);

  const info = useCallback((message: string, title?: string) => {
    show({ message, title, type: 'info' });
  }, [show]);

  React.useImperativeHandle(ref, () => ({
    show,
    success,
    error,
    warning,
    info,
  }));

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast, index) => (
        <View
          key={toast.id}
          style={[
            styles.toastWrapper,
            { top: 10 + index * 90 }, // Stack toasts vertically
          ]}
          pointerEvents="box-none"
        >
          <Toast
            {...toast}
            onDismiss={() => dismiss(toast.id)}
          />
        </View>
      ))}
    </View>
  );
});

ToastManager.displayName = 'ToastManager';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  toastWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});

// Global functions to show toasts
export const showToast = {
  show: (config: Omit<ToastData, 'id' | 'onDismiss'>) => {
    toastManagerRef?.show(config);
  },
  success: (message: string, title?: string) => {
    toastManagerRef?.success(message, title);
  },
  error: (message: string, title?: string) => {
    toastManagerRef?.error(message, title);
  },
  warning: (message: string, title?: string) => {
    toastManagerRef?.warning(message, title);
  },
  info: (message: string, title?: string) => {
    toastManagerRef?.info(message, title);
  },
};

// Hook to get toast manager ref
export const useToastManagerRef = () => {
  return useCallback((ref: ToastManagerHandle | null) => {
    toastManagerRef = ref;
  }, []);
};
