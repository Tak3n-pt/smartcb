// Events/Log Screen

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEventsStore, useThemeStore } from '../../store';
import { Card } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';
import {
  formatTimestamp,
  formatDurationShort,
  getEventIcon,
  getEventColor,
} from '../../utils';
import { EventType } from '../../types';

export default function EventsScreen() {
  const { filter, setFilter, getFilteredEvents, getStatistics } =
    useEventsStore();
  const { theme } = useThemeStore();
  const themeColors = colors[theme];

  const events = getFilteredEvents();
  const stats = getStatistics();

  // Date range options
  const dateRanges: Array<{ label: string; value: typeof filter.dateRange }> = [
    { label: 'Today', value: 'today' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'All', value: 'all' },
  ];

  // Event type options
  const eventTypes: Array<{ label: string; value: EventType | 'all' }> = [
    { label: 'All', value: 'all' },
    { label: 'Manual', value: 'manual_on' },
    { label: 'Auto', value: 'auto_on' },
    { label: 'Outage', value: 'outage' },
    { label: 'Threshold', value: 'threshold_breach' },
  ];

  // Render statistics card
  const renderStatistics = () => (
    <Card style={styles.statsCard}>
      <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
        This Month
      </Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.primary }]}>
            {stats.totalEvents}
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
            Total Events
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.danger }]}>
            {stats.totalOutages}
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
            Outages
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.warning }]}>
            {formatDurationShort(stats.averageOutageDuration)}
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.text.secondary }]}>
            Avg Duration
          </Text>
        </View>
      </View>
    </Card>
  );

  // Render filter buttons
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {/* Date Range Filter */}
      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: themeColors.text.secondary }]}>
          Date Range
        </Text>
        <View style={styles.filterButtons}>
          {dateRanges.map((range) => (
            <TouchableOpacity
              key={range.value}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    filter.dateRange === range.value
                      ? themeColors.primary
                      : themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => setFilter({ dateRange: range.value })}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color:
                      filter.dateRange === range.value
                        ? 'white'
                        : themeColors.text.secondary,
                  },
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Event Type Filter */}
      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: themeColors.text.secondary }]}>
          Event Type
        </Text>
        <View style={styles.filterButtons}>
          {eventTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    filter.eventType === type.value
                      ? themeColors.primary
                      : themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => setFilter({ eventType: type.value })}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color:
                      filter.eventType === type.value
                        ? 'white'
                        : themeColors.text.secondary,
                  },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // Render event item
  const renderEventItem = ({ item }: { item: typeof events[0] }) => {
    const eventColor = getEventColor(item.type);
    const icon = getEventIcon(item.type);

    return (
      <View
        style={[
          styles.eventCard,
          {
            backgroundColor: themeColors.surface,
            borderLeftColor: eventColor,
          },
        ]}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventIconContainer}>
            <View
              style={[
                styles.eventIconCircle,
                { backgroundColor: eventColor + '20' },
              ]}
            >
              <Ionicons name={icon} size={20} color={eventColor} />
            </View>
          </View>
          <View style={styles.eventContent}>
            <Text style={[styles.eventDescription, { color: themeColors.text.primary }]}>
              {item.description}
            </Text>
            <Text style={[styles.eventTime, { color: themeColors.text.secondary }]}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
        </View>

        {item.readings && (
          <View style={styles.eventDetails}>
            <View style={styles.eventDetailItem}>
              <Ionicons
                name="flash-outline"
                size={14}
                color={themeColors.text.secondary}
              />
              <Text style={[styles.eventDetailText, { color: themeColors.text.secondary }]}>
                {item.readings.voltage.toFixed(1)}V
              </Text>
            </View>
            <View style={styles.eventDetailItem}>
              <Ionicons
                name="analytics-outline"
                size={14}
                color={themeColors.text.secondary}
              />
              <Text style={[styles.eventDetailText, { color: themeColors.text.secondary }]}>
                {item.readings.current.toFixed(2)}A
              </Text>
            </View>
            <View style={styles.eventDetailItem}>
              <Ionicons
                name="speedometer-outline"
                size={14}
                color={themeColors.text.secondary}
              />
              <Text style={[styles.eventDetailText, { color: themeColors.text.secondary }]}>
                {item.readings.power.toFixed(1)}W
              </Text>
            </View>
          </View>
        )}

        {item.duration && (
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={14} color={themeColors.danger} />
            <Text style={[styles.durationText, { color: themeColors.danger }]}>
              {formatDurationShort(item.duration)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text.primary }]}>
          Event Log
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Statistics */}
        {renderStatistics()}

        {/* Filters */}
        {renderFilters()}

        {/* Events List */}
        <View style={styles.eventsSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
            Events ({events.length})
          </Text>
          {events.length > 0 ? (
            events.map((event) => (
              <View key={event.id}>{renderEventItem({ item: event })}</View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-outline"
                size={48}
                color={themeColors.text.secondary}
              />
              <Text style={[styles.emptyText, { color: themeColors.text.secondary }]}>
                No events found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...typography.h2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl + spacing.md, // Extra padding for tab bar
  },
  statsCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  filtersContainer: {
    marginBottom: spacing.md,
  },
  filterSection: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.large,
    borderWidth: 1,
  },
  filterButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  eventsSection: {
    marginTop: spacing.md,
  },
  eventCard: {
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventIconContainer: {
    marginRight: spacing.md,
  },
  eventIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    flex: 1,
  },
  eventDescription: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  eventTime: {
    ...typography.caption,
  },
  eventDetails: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  eventDetailText: {
    ...typography.caption,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  durationText: {
    ...typography.caption,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    marginTop: spacing.md,
  },
});