// Events Store

import { create } from 'zustand';
import { Event, EventStatistics, EventType } from '../types';
import { generateMockEvents } from '../utils';

interface EventsStore {
  events: Event[];
  filter: {
    dateRange: 'today' | 'week' | 'month' | 'all';
    eventType: EventType | 'all';
  };

  // Actions
  addEvent: (event: Event) => void;
  setFilter: (filter: Partial<EventsStore['filter']>) => void;
  getFilteredEvents: () => Event[];
  getStatistics: () => EventStatistics;
}

export const useEventsStore = create<EventsStore>((set, get) => ({
  events: generateMockEvents(50), // Generate 50 mock events
  filter: {
    dateRange: 'all',
    eventType: 'all',
  },

  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events],
    })),

  setFilter: (filter) =>
    set((state) => ({
      filter: {
        ...state.filter,
        ...filter,
      },
    })),

  getFilteredEvents: () => {
    const { events, filter } = get();
    const now = Date.now();

    let filtered = events;

    // Filter by date range
    switch (filter.dateRange) {
      case 'today':
        const todayStart = new Date().setHours(0, 0, 0, 0);
        filtered = filtered.filter((event) => event.timestamp >= todayStart);
        break;
      case 'week':
        const weekStart = now - 7 * 24 * 60 * 60 * 1000;
        filtered = filtered.filter((event) => event.timestamp >= weekStart);
        break;
      case 'month':
        const monthStart = now - 30 * 24 * 60 * 60 * 1000;
        filtered = filtered.filter((event) => event.timestamp >= monthStart);
        break;
    }

    // Filter by event type
    if (filter.eventType !== 'all') {
      filtered = filtered.filter((event) => event.type === filter.eventType);
    }

    return filtered;
  },

  getStatistics: () => {
    const events = get().events;

    // Calculate statistics for the current month
    const monthStart = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const monthEvents = events.filter((event) => event.timestamp >= monthStart);

    const outages = monthEvents.filter((event) => event.type === 'outage');
    const totalOutages = outages.length;

    const totalDowntime = outages.reduce((sum, event) => sum + (event.duration || 0), 0);

    const averageOutageDuration =
      totalOutages > 0 ? totalDowntime / totalOutages : 0;

    return {
      totalEvents: monthEvents.length,
      totalOutages,
      averageOutageDuration,
      totalDowntime,
    };
  },
}));