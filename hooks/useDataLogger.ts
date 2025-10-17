// Hook to handle data logging without circular dependencies
import { useEffect, useRef } from 'react';
import { useElectricalStore } from '../store/useElectricalStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { useEventsStore } from '../store/useEventsStore';
import { checkAllAlerts } from '../services/notificationService';

/**
 * Hook that subscribes to electrical data updates and logs them to history/events stores
 * This avoids circular dependencies between stores
 */
export const useDataLogger = () => {
  const data = useElectricalStore((state) => state.data);
  const isDemoMode = useElectricalStore((state) => state.isDemoMode);
  const lastDataRef = useRef(data);

  useEffect(() => {
    // Only process if data has actually changed
    if (!data || data === lastDataRef.current) {
      return;
    }

    // Update ref
    lastDataRef.current = data;

    // Log to history store (auto-sampled to 1/minute)
    useHistoryStore.getState().logReading(data);

    // Check for events and violations
    useEventsStore.getState().checkAndLogEvents(data);

    // Check for alerts and trigger notifications
    checkAllAlerts(data, true);

    if (__DEV__) {
      console.log('📊 Data logged:', {
        voltage: data.voltage,
        current: data.current,
        power: data.power,
        isDemoMode,
      });
    }
  }, [data, isDemoMode]);
};