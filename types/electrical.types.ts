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
  // ESP32 status fields (optional - sent by hardware)
  protectionTriggered?: boolean;  // Is protection currently active?
  protectionReason?: string;      // Why protection was triggered
  manualMode?: boolean;           // Was physical button pressed?
  powerOutage?: boolean;          // Is power supply interrupted?
  reconnectionPending?: boolean;  // Is auto-reconnect waiting?
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastUpdate: number;
  signalStrength: number; // 0-100
}