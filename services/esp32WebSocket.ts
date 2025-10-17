// ESP32 WebSocket Service for Real-time Communication

import { ElectricalData } from '../types';

interface WebSocketMessage {
  type: 'status' | 'settings' | 'event';
  [key: string]: any;
}

export class ESP32WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private wsUrl: string;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  // Callbacks
  private onStatusUpdate?: (data: ElectricalData) => void;
  private onConnectionChange?: (connected: boolean) => void;
  private onEvent?: (event: string, message: string) => void;
  private onSettingsUpdate?: (settings: any) => void;

  constructor(ipAddress: string = '192.168.4.1', port: string = '81') {
    this.wsUrl = `ws://${ipAddress}:${port}`;
  }

  // Connect to WebSocket server
  connect(
    onStatusUpdate?: (data: ElectricalData) => void,
    onConnectionChange?: (connected: boolean) => void,
    onEvent?: (event: string, message: string) => void
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }

      if (this.isConnecting) {
        resolve(false);
        return;
      }

      this.onStatusUpdate = onStatusUpdate;
      this.onConnectionChange = onConnectionChange;
      this.onEvent = onEvent;

      this.isConnecting = true;
      console.log(`Connecting to WebSocket: ${this.wsUrl}`);

      try {
        this.ws = new WebSocket(this.wsUrl);

        // Connection opened
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          if (this.onConnectionChange) {
            this.onConnectionChange(true);
          }

          // Request initial status
          this.sendCommand('getStatus');

          // Start ping to keep connection alive
          this.startPing();

          resolve(true);
        };

        // Message received
        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        // Connection closed
        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;

          if (this.onConnectionChange) {
            this.onConnectionChange(false);
          }

          this.stopPing();

          // Auto-reconnect if not manually closed
          if (event.code !== 1000) {
            this.scheduleReconnect();
          }

          resolve(false);
        };

        // Connection error
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          resolve(false);
        };

      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        this.isConnecting = false;
        resolve(false);
      }
    });
  }

  // Handle incoming messages
  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'status':
        if (this.onStatusUpdate) {
          const data: ElectricalData = {
            voltage: message.voltage || 0,
            current: message.current || 0,
            power: message.power || 0,
            energy: message.energy || 0,
            frequency: message.frequency || 0,
            powerFactor: message.powerFactor || 0,
            apparentPower: message.apparentPower || 0,
            reactivePower: message.reactivePower || 0,
            relayState: message.relayState || false,
            protectionStatus: message.protectionEnabled ? 'armed' : 'disarmed',
          };
          this.onStatusUpdate(data);
        }
        break;

      case 'event':
        if (this.onEvent) {
          this.onEvent(message.event, message.message);
        }
        break;

      case 'settings':
        if (this.onSettingsUpdate) {
          this.onSettingsUpdate({
            maxCurrent: message.maxCurrent,
            maxVoltage: message.maxVoltage,
            minVoltage: message.minVoltage,
            protectionEnabled: message.protectionEnabled,
          });
        }
        break;
    }
  }

  // Send command to ESP32
  sendCommand(command: string, params?: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return false;
    }

    try {
      const message = {
        command,
        ...params,
      };

      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket command:', error);
      return false;
    }
  }

  // Control relay
  setRelayState(state: boolean): boolean {
    return this.sendCommand('setRelay', { state });
  }

  // Get current status
  requestStatus(): boolean {
    return this.sendCommand('getStatus');
  }

  // Get settings
  requestSettings(): boolean {
    return this.sendCommand('getSettings');
  }

  // Start ping to keep connection alive
  private startPing() {
    this.stopPing();

    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendCommand('ping');
      }
    }, 30000); // Ping every 30 seconds
  }

  // Stop ping
  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Schedule reconnection
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;

    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectInterval = setTimeout(() => {
      this.connect(this.onStatusUpdate, this.onConnectionChange, this.onEvent);
    }, delay);
  }

  // Disconnect WebSocket
  disconnect() {
    console.log('Disconnecting WebSocket');

    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    this.stopPing();

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client disconnect');
      }
      this.ws = null;
    }

    if (this.onConnectionChange) {
      this.onConnectionChange(false);
    }
  }

  // Update WebSocket URL
  updateUrl(ipAddress: string, port: string = '81') {
    const newUrl = `ws://${ipAddress}:${port}`;

    if (newUrl !== this.wsUrl) {
      this.wsUrl = newUrl;

      // Reconnect with new URL
      this.disconnect();
      this.connect(this.onStatusUpdate, this.onConnectionChange, this.onEvent);
    }
  }

  // Check connection status
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Get connection state
  getState(): string {
    if (!this.ws) return 'DISCONNECTED';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }

  // Reset reconnection attempts
  resetReconnectAttempts() {
    this.reconnectAttempts = 0;
  }
}

// Singleton instance
let webSocketInstance: ESP32WebSocketService | null = null;

export const getESP32WebSocket = (ipAddress?: string, port?: string): ESP32WebSocketService => {
  if (!webSocketInstance) {
    webSocketInstance = new ESP32WebSocketService(ipAddress, port);
  } else if (ipAddress && port) {
    webSocketInstance.updateUrl(ipAddress, port);
  }
  return webSocketInstance;
};

export default ESP32WebSocketService;