import i18n from '../i18n';

// Utility formatters for SmartCB

const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const padTwo = (value: number): string => value.toString().padStart(2, '0');

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
  return `${formatNumber(voltage, 1)}${i18n.t('home.units.voltage')}`;
};

/**
 * Format current with unit
 */
export const formatCurrent = (current: number): string => {
  return `${formatNumber(current, 2)}${i18n.t('home.units.current')}`;
};

/**
 * Format power with unit (auto-scale to kW if needed)
 */
export const formatPower = (power: number): string => {
  if (power >= 1000) {
    return `${formatNumber(power / 1000, 2)}${i18n.t('home.units.powerKilowatt')}`;
  }
  return `${formatNumber(power, 1)}${i18n.t('home.units.power')}`;
};

/**
 * Format energy with unit
 */
export const formatEnergy = (energy: number): string => {
  const absEnergy = Math.abs(energy);
  let decimals = 2;

  if (absEnergy >= 10) {
    decimals = 1;
  } else if (absEnergy >= 1) {
    decimals = 2;
  } else if (absEnergy >= 0.1) {
    decimals = 3;
  } else {
    decimals = 4;
  }

  return `${formatNumber(energy, decimals)}${i18n.t('home.units.energy')}`;
};

/**
 * Format frequency with unit
 */
export const formatFrequency = (frequency: number): string => {
  return `${formatNumber(frequency, 1)}${i18n.t('home.units.frequency')}`;
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
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`.trim();
};

/**
 * Format timestamp to date only
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const day = date.getDate();
  const year = date.getFullYear();
  const monthKey = monthKeys[date.getMonth()];
  const monthLabel = i18n.t(`common.months.short.${monthKey}`);
  return i18n.t('common.dateFormats.short', { day, month: monthLabel, year });
};

/**
 * Format timestamp to time only
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const hour12 = hours24 % 12 || 12;
  const periodKey = hours24 >= 12 ? 'pm' : 'am';

  return i18n.t('common.timeFormats.short', {
    hour: padTwo(hour12),
    minute: padTwo(minutes),
    period: i18n.t(`common.timePeriods.${periodKey}`),
  });
};

/**
 * Format duration (milliseconds) to human readable
 */
export const formatDuration = (duration: number): string => {
  const totalSeconds = Math.floor(duration / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(i18n.t(`common.duration.${hours === 1 ? 'hour' : 'hours'}`, { count: hours }));
  }

  if (minutes > 0) {
    parts.push(i18n.t(`common.duration.${minutes === 1 ? 'minute' : 'minutes'}`, { count: minutes }));
  }

  if (parts.length === 0) {
    parts.push(i18n.t(`common.duration.${seconds === 1 ? 'second' : 'seconds'}`, { count: seconds }));
  } else if (seconds > 0 && hours === 0) {
    // Only surface seconds when total duration is under an hour to avoid overly long strings
    parts.push(i18n.t(`common.duration.${seconds === 1 ? 'second' : 'seconds'}`, { count: seconds }));
  }

  return parts.join(' ');
};

/**
 * Format duration to short form
 */
export const formatDurationShort = (duration: number): string => {
  const totalSeconds = Math.floor(duration / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(i18n.t('common.duration.shortHour', { count: hours }));
  }

  if (minutes > 0) {
    parts.push(i18n.t('common.duration.shortMinute', { count: minutes }));
  }

  if (parts.length === 0) {
    parts.push(i18n.t('common.duration.shortSecond', { count: seconds }));
  }

  return parts.join(' ');
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
    return i18n.t(`common.relativeTime.${days === 1 ? 'day' : 'days'}`, { count: days });
  }

  if (hours > 0) {
    return i18n.t(`common.relativeTime.${hours === 1 ? 'hour' : 'hours'}`, { count: hours });
  }

  if (minutes > 0) {
    return i18n.t(`common.relativeTime.${minutes === 1 ? 'minute' : 'minutes'}`, { count: minutes });
  }

  return i18n.t('common.relativeTime.justNow');
};
