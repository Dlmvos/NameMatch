import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AnalyticsService, type StoredAnalyticsEvent } from '../services/AnalyticsService';
import { colors, FONTS, RADIUS, SPACING } from '../theme';

export default function DevAnalyticsScreen() {
  const navigation = useNavigation();
  const [events, setEvents] = useState<StoredAnalyticsEvent[]>([]);

  const loadEvents = useCallback(() => {
    if (!__DEV__) return;
    AnalyticsService.getEvents().then(setEvents).catch(() => setEvents([]));
  }, []);

  useFocusEffect(loadEvents);

  if (!__DEV__) return null;

  const counts = events.reduce<Record<string, number>>((acc, item) => {
    acc[item.event] = (acc[item.event] ?? 0) + 1;
    return acc;
  }, {});
  const countRows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const recentEvents = [...events].reverse().slice(0, 30);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={colors.onboarding.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Dev Analytics</Text>
        <TouchableOpacity onPress={loadEvents} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="refresh" size={22} color={colors.onboarding.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Counts</Text>
        {countRows.length === 0 ? (
          <Text style={styles.emptyText}>No events tracked yet.</Text>
        ) : (
          countRows.map(([event, count]) => (
            <View key={event} style={styles.countRow}>
              <Text style={styles.eventName}>{event}</Text>
              <Text style={styles.countText}>{count}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Recent Events</Text>
        {recentEvents.map((item, index) => (
          <View key={`${item.timestamp}-${index}`} style={styles.eventCard}>
            <Text style={styles.eventName}>{item.event}</Text>
            <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
            <Text style={styles.metadata}>{JSON.stringify(item.metadata)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.bgSoft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: colors.onboarding.text,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    color: colors.neutral.darkGray,
    marginTop: SPACING.md,
    textTransform: 'uppercase',
  },
  emptyText: {
    color: colors.neutral.darkGray,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  countText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: colors.onboarding.primary,
  },
  eventCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    gap: 3,
  },
  eventName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: colors.onboarding.text,
  },
  timestamp: {
    fontSize: FONTS.sizes.xs,
    color: colors.neutral.gray,
  },
  metadata: {
    fontSize: FONTS.sizes.xs,
    color: colors.neutral.darkGray,
  },
});
