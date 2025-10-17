// SmartCB Color Palette
// Based on logo colors (Gray + Blue) with semantic status colors

export const colors = {
  light: {
    primary: '#2196F3',
    primaryLight: '#E3F2FD',
    secondary: '#757575',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#F44336',
    info: '#00BCD4',
    infoLight: '#E0F7FA',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#9E9E9E',
      inverse: '#FFFFFF',
    },
    border: '#E0E0E0',
    divider: '#E0E0E0',
  },
  dark: {
    primary: '#42A5F5',
    primaryLight: 'rgba(66, 165, 245, 0.15)',
    secondary: '#BDBDBD',
    success: '#66BB6A',
    warning: '#FFA726',
    danger: '#EF5350',
    info: '#26C6DA',
    infoLight: 'rgba(38, 198, 218, 0.15)',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceElevated: '#2C2C2C',
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
      disabled: '#757575',
      inverse: '#000000',
    },
    border: '#2C2C2C',
    divider: '#2C2C2C',
  },
};

// Voltage color zones
export const voltageColors = {
  danger: '#EF5350',  // <200V or >240V
  warning: '#FFA726', // 200-210V or 230-240V
  normal: '#66BB6A',  // 210-230V
};

// Current color zones
export const currentColors = {
  normal: '#66BB6A',   // 0-10A
  high: '#FFA726',     // 10-14A
  critical: '#EF5350', // 14-16A
};

// Event type colors
export const eventColors = {
  manual: '#42A5F5',    // Manual actions
  auto: '#66BB6A',      // Auto actions
  outage: '#EF5350',    // Power outages
  threshold: '#FFA726', // Threshold breaches
};

// Helper function to get voltage color based on value
export const getVoltageColor = (voltage: number, isDark: boolean = true): string => {
  const theme = isDark ? 'dark' : 'light';

  if (voltage < 200 || voltage > 240) {
    return colors[theme].danger;
  } else if ((voltage >= 200 && voltage < 210) || (voltage > 230 && voltage <= 240)) {
    return colors[theme].warning;
  } else {
    return colors[theme].success;
  }
};

// Helper function to get current color based on value
export const getCurrentColor = (current: number, isDark: boolean = true): string => {
  const theme = isDark ? 'dark' : 'light';

  if (current >= 14) {
    return colors[theme].danger;
  } else if (current >= 10) {
    return colors[theme].warning;
  } else {
    return colors[theme].success;
  }
};

export type ColorTheme = 'light' | 'dark';