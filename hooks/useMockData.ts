// Custom hook for managing mock data updates

import { useEffect, useRef } from 'react';
import { useElectricalStore } from '../store';
import { generateMockElectricalData, DATA_UPDATE_INTERVAL, ENERGY_INCREMENT_INTERVAL } from '../utils';

/**
 * Hook to simulate real-time data updates with mock data
 */
export const useMockData = () => {
  const { data, updateData, incrementEnergy } = useElectricalStore();
  const dataIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const energyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Update electrical data every 2 seconds
    dataIntervalRef.current = setInterval(() => {
      if (data) {
        const newData = generateMockElectricalData(data.relayState);
        updateData({
          ...newData,
          energy: data.energy, // Preserve energy count
        });
      }
    }, DATA_UPDATE_INTERVAL);

    // Increment energy every minute (if relay is on)
    energyIntervalRef.current = setInterval(() => {
      incrementEnergy();
    }, ENERGY_INCREMENT_INTERVAL);

    // Cleanup
    return () => {
      if (dataIntervalRef.current) {
        clearInterval(dataIntervalRef.current);
      }
      if (energyIntervalRef.current) {
        clearInterval(energyIntervalRef.current);
      }
    };
  }, [data?.relayState]);

  return { data };
};