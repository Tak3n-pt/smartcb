// Electrical Data Store

import { create } from 'zustand';
import { ElectricalData, ConnectionStatus } from '../types';
import { generateMockElectricalData } from '../utils';

interface ElectricalStore {
  data: ElectricalData | null;
  connection: ConnectionStatus;

  // Actions
  updateData: (data: ElectricalData) => void;
  toggleRelay: () => void;
  setConnected: (isConnected: boolean) => void;
  incrementEnergy: () => void;
}

export const useElectricalStore = create<ElectricalStore>((set) => ({
  data: generateMockElectricalData(true),
  connection: {
    isConnected: true,
    lastUpdate: Date.now(),
    signalStrength: 85,
  },

  updateData: (data) =>
    set((state) => ({
      data,
      connection: {
        ...state.connection,
        lastUpdate: Date.now(),
      },
    })),

  toggleRelay: () =>
    set((state) => {
      if (!state.data) return state;

      const newRelayState = !state.data.relayState;
      const newData = generateMockElectricalData(newRelayState);

      return {
        data: {
          ...newData,
          energy: state.data.energy, // Preserve energy count
          relayState: newRelayState,
        },
      };
    }),

  setConnected: (isConnected) =>
    set((state) => ({
      connection: {
        ...state.connection,
        isConnected,
        lastUpdate: Date.now(),
      },
    })),

  incrementEnergy: () =>
    set((state) => {
      if (!state.data || !state.data.relayState) return state;

      // Increment energy based on power consumption
      // Formula: kWh = (W * hours) / 1000
      // Assuming this is called every minute: hours = 1/60
      const incrementKWh = (state.data.power * (1 / 60)) / 1000;

      return {
        data: {
          ...state.data,
          energy: state.data.energy + incrementKWh,
        },
      };
    }),
}));