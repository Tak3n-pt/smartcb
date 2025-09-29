// Electrical Data Types

export interface ElectricalData {
  voltage: number;         // Volts (V)
  current: number;         // Amperes (A)
  power: number;           // Watts (W)
  energy: number;          // Kilowatt-hours (kWh)
  frequency: number;       // Hertz (Hz)
  powerFactor: number;     // 0-1
  apparentPower: number;   // Volt-Amperes (VA)
  reactivePower: number;   // Volt-Amperes Reactive (VAR)
  relayState: boolean;     // ON/OFF
  timestamp: number;       // Unix timestamp
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastUpdate: number;
  signalStrength: number; // 0-100
}