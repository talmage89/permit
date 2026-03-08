import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, type Event, type Group } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { useTheme, type Theme } from '../../lib/theme';
import CreateEventModal from '../../components/CreateEventModal';

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const s = styles(theme);
  const [group, setGroup] = useState<Group | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createVisible, setCreateVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [groupId]),
  );

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [g, evts] = await Promise.all([api.groups.get(groupId), api.events.list(groupId)]);
      setGroup(g);
      setEvents(evts);
    } catch {
      setError('Failed to load group data. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleEventCreated(event: Event) {
    setCreateVisible(false);
    setEvents((prev) => {
      if (prev.some((e) => e.id === event.id)) return prev;
      return [...prev, event].sort(
        (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
      );
    });
  }

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: group?.name ?? 'Group' }} />
      <View style={s.container}>
        {error && (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => loadData()}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={s.sectionTitle}>Upcoming Events</Text>
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.card}
              onPress={() => router.push(`/event/${item.id}?groupId=${groupId}`)}
              activeOpacity={0.7}
            >
              <View style={s.cardIcon}>
                <Ionicons name="calendar" size={28} color={theme.accent} />
              </View>
              <View style={s.cardContent}>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardDate}>{formatDate(item.event_date)}</Text>
                {item.location ? (
                  <Text style={s.cardLocation}>{item.location}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
          contentContainerStyle={events.length === 0 ? s.emptyContainer : s.listContent}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Ionicons name="calendar-outline" size={48} color={theme.textTertiary} />
              <Text style={s.emptyTitle}>No events yet</Text>
              <Text style={s.emptySub}>Create the first one!</Text>
            </View>
          }
          style={s.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={theme.accent} />
          }
        />
        <View style={s.actions}>
          <TouchableOpacity style={s.button} onPress={() => setCreateVisible(true)} activeOpacity={0.8}>
            <Text style={s.buttonText}>Create Event</Text>
          </TouchableOpacity>
        </View>
        <CreateEventModal
          groupId={groupId}
          visible={createVisible}
          onCreated={handleEventCreated}
          onCancel={() => setCreateVisible(false)}
        />
      </View>
    </>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: t.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 16,
      marginBottom: 8,
      marginLeft: 20,
    },
    list: { flex: 1 },
    listContent: { paddingHorizontal: 16, gap: 10, paddingBottom: 8 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyWrap: { alignItems: 'center', padding: 40, gap: 8 },
    emptyTitle: { fontSize: 17, fontWeight: '600', color: t.textSecondary },
    emptySub: { fontSize: 14, color: t.textTertiary },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: t.border,
    },
    cardIcon: { marginRight: 12 },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: t.text },
    cardDate: { fontSize: 13, color: t.textSecondary, marginTop: 2 },
    cardLocation: { fontSize: 13, color: t.textTertiary, marginTop: 1 },
    actions: { padding: 16 },
    button: {
      backgroundColor: t.accent,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.errorBg,
      borderRadius: 12,
      padding: 12,
      margin: 16,
      marginBottom: 0,
    },
    errorText: { color: t.errorText, fontSize: 13, flex: 1 },
    retryText: { color: t.accent, fontSize: 13, fontWeight: '600', marginLeft: 8 },
  });
