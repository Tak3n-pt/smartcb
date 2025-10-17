// Event Translation Utility
// Translates event descriptions dynamically based on the current language

import { TFunction } from 'i18next';
import { Event } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Translates an event description based on its type and readings
 * @param event - The event object to translate
 * @param t - The i18next translation function
 * @returns Translated event description
 */
export function translateEventDescription(event: Event, t: TFunction): string {
  // Get settings for threshold values
  const settings = useSettingsStore.getState().settings;

  switch (event.type) {
    case 'manual_on':
    case 'manual_off':
      return t(`events.eventsList.descriptions.${event.type}`);

    case 'overvoltage':
      return t('events.eventsList.descriptions.overvoltage', {
        voltage: event.readings?.voltage.toFixed(1) || '0',
        max: settings.thresholds.voltage.max,
      });

    case 'undervoltage':
      return t('events.eventsList.descriptions.undervoltage', {
        voltage: event.readings?.voltage.toFixed(1) || '0',
        min: settings.thresholds.voltage.min,
      });

    case 'overload':
      return t('events.eventsList.descriptions.overload', {
        current: event.readings?.current.toFixed(2) || '0',
        max: settings.thresholds.current.max,
      });

    case 'underload':
      return t('events.eventsList.descriptions.underload', {
        current: event.readings?.current.toFixed(3) || '0',
      });

    case 'outage':
      return t('events.eventsList.descriptions.outage');

    case 'restore':
      return t('events.eventsList.descriptions.restore');

    case 'frequency_max':
      return t('events.eventsList.descriptions.frequency_max', {
        frequency: event.readings?.frequency.toFixed(1) || '0',
        max: settings.thresholds.frequency.max,
      });

    case 'frequency_min':
      return t('events.eventsList.descriptions.frequency_min', {
        frequency: event.readings?.frequency.toFixed(1) || '0',
        min: settings.thresholds.frequency.min,
      });

    case 'power_factor_min':
      return t('events.eventsList.descriptions.power_factor_min', {
        pf: event.readings?.powerFactor.toFixed(2) || '0',
        min: settings.thresholds.powerFactor.min,
      });

    default:
      // Fallback to the original description if no translation is available
      return event.description;
  }
}
