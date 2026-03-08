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
import { api, type Event, type Group } from '../../lib/api';
import CreateEventModal from '../../components/CreateEventModal';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
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
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: group?.name ?? 'Group' }} />
      <View style={styles.container}>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => loadData()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.subtitle}>Upcoming Events</Text>
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.eventRow}
              onPress={() => router.push(`/event/${item.id}?groupId=${groupId}`)}
            >
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventDate}>{formatDate(item.event_date)}</Text>
                {item.location ? (
                  <Text style={styles.eventLocation}>{item.location}</Text>
                ) : null}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No events yet. Create the first one!</Text>
          }
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
          }
        />
        <TouchableOpacity style={styles.button} onPress={() => setCreateVisible(true)}>
          <Text style={styles.buttonText}>Create Event</Text>
        </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subtitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  list: { flex: 1 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 17, fontWeight: '600' },
  eventDate: { fontSize: 13, color: '#555', marginTop: 2 },
  eventLocation: { fontSize: 13, color: '#888', marginTop: 1 },
  chevron: { fontSize: 22, color: '#ccc' },
  separator: { height: 1, backgroundColor: '#eee' },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { color: '#856404', fontSize: 13, flex: 1 },
  retryText: { color: '#007AFF', fontSize: 13, fontWeight: '600', marginLeft: 8 },
});
