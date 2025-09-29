// Utility formatters for SmartCB

/**
 * Format number with fixed decimals
 */
export const formatNumber = (value: number, decimals: number = 1): string => {
  return value.toFixed(decimals);
};

/**
 * Format voltage with unit
 */
export const formatVoltage = (voltage: number): string => {
  return `${formatNumber(voltage, 1)}V`;
};

/**
 * Format current with unit
 */
export const formatCurrent = (current: number): string => {
  return `${formatNumber(current, 2)}A`;
};

/**
 * Format power with unit (auto-scale to kW if needed)
 */
export const formatPower = (power: number): string => {
  if (power >= 1000) {
    return `${formatNumber(power / 1000, 2)}kW`;
  }
  return `${formatNumber(power, 1)}W`;
};

/**
 * Format energy with unit
 */
export const formatEnergy = (energy: number): string => {
  return `${formatNumber(energy, 2)}kWh`;
};

/**
 * Format frequency with unit
 */
export const formatFrequency = (frequency: number): string => {
  return `${formatNumber(frequency, 1)}Hz`;
};

/**
 * Format power factor
 */
export const formatPowerFactor = (pf: number): string => {
  return formatNumber(pf, 2);
};

/**
 * Format timestamp to readable date/time
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format timestamp to date only
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format timestamp to time only
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format duration (milliseconds) to human readable
 */
export const formatDuration = (duration: number): string => {
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Format duration to short form
 */
export const formatDurationShort = (duration: number): string => {
  const minutes = Math.floor(duration / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};