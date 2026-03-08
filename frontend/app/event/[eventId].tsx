import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { api, type Event, type Child, type Registration } from '../../lib/api';
import { getDeviceId, getChildren } from '../../lib/storage';
import { formatDate } from '../../lib/utils';

export default function EventDetailScreen() {
  const { eventId, groupId } = useLocalSearchParams<{ eventId: string; groupId?: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [eventId, groupId]),
  );

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const did = await getDeviceId();

      // Load event details if we have a groupId
      let evt: Event | null = null;
      if (groupId) {
        try {
          evt = await api.events.get(groupId, eventId);
          setEvent(evt);
          setIsOrganizer(evt.created_by_device_id === did);
        } catch {
          // ignore
        }
      }

      // Load children from backend, fall back to local
      let childrenList: Child[] = [];
      if (did) {
        try {
          childrenList = await api.children.list(did);
        } catch {
          const local = await getChildren();
          childrenList = local.map((c) => ({
            id: c.id,
            device_id: did,
            name: c.name,
            birthdate: c.birthdate,
            allergies: c.allergies,
            notes: c.notes,
            created_at: '',
            updated_at: '',
          }));
        }
      } else {
        const local = await getChildren();
        childrenList = local.map((c) => ({
          id: c.id,
          device_id: '',
          name: c.name,
          birthdate: c.birthdate,
          allergies: c.allergies,
          notes: c.notes,
          created_at: '',
          updated_at: '',
        }));
      }
      setChildren(childrenList);

      // Load my registrations
      if (did) {
        try {
          const myRegs = await api.registrations.listForDevice(eventId, did);
          setMyRegistrations(myRegs);
        } catch {
          setMyRegistrations([]);
        }
      }

      // Load all registrations for organizer
      const organizer = evt?.created_by_device_id === did;
      if (organizer && did) {
        try {
          const allRegs = await api.registrations.listAll(eventId);
          setAllRegistrations(allRegs);
        } catch {
          setAllRegistrations([]);
        }
      }
    } catch {
      setError('Failed to load event details. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function isRegistered(childId: string): boolean {
    return myRegistrations.some((r) => r.child_id === childId);
  }

  function getRegistration(childId: string): Registration | undefined {
    return myRegistrations.find((r) => r.child_id === childId);
  }

  async function handleRegister(child: Child, infoUpdated: boolean) {
    try {
      const regs = await api.registrations.register(eventId, {
        children: [{ child_id: child.id, info_updated: infoUpdated }],
      });
      setMyRegistrations((prev) => {
        const filtered = prev.filter((r) => r.child_id !== child.id);
        return [...filtered, ...regs];
      });
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to register.');
    }
  }

  async function handleUnregister(child: Child) {
    Alert.alert('Remove registration', `Remove ${child.name} from this event?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.registrations.unregister(eventId, child.id);
            setMyRegistrations((prev) => prev.filter((r) => r.child_id !== child.id));
          } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to unregister.');
          }
        },
      },
    ]);
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
      <Stack.Screen options={{ title: event?.title ?? 'Event' }} />
      <ScrollView style={styles.container}>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={loadAll}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        {event && (
          <View style={styles.eventHeader}>
            <Text style={styles.title}>{event.title}</Text>
            {event.description ? <Text style={styles.desc}>{event.description}</Text> : null}
            <Text style={styles.meta}>
              <Text style={styles.metaLabel}>When: </Text>
              {formatDate(event.event_date)}
            </Text>
            {event.location ? (
              <Text style={styles.meta}>
                <Text style={styles.metaLabel}>Where: </Text>
                {event.location}
              </Text>
            ) : null}
            {event.rsvp_deadline ? (
              <Text style={styles.meta}>
                <Text style={styles.metaLabel}>RSVP by: </Text>
                {formatDate(event.rsvp_deadline)}
              </Text>
            ) : null}
          </View>
        )}

        <Text style={styles.section}>Your Children</Text>
        {children.length === 0 ? (
          <Text style={styles.empty}>
            No children added. Go to the Children tab to add them.
          </Text>
        ) : (
          children.map((child) => {
            const registered = isRegistered(child.id);
            const reg = getRegistration(child.id);
            return (
              <View key={child.id} style={styles.childRow}>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  {registered && (
                    <Text style={styles.registeredBadge}>
                      {reg?.info_updated ? '✓ Info Updated' : '✓ Going'}
                    </Text>
                  )}
                </View>
                <View style={styles.childActions}>
                  {registered ? (
                    <TouchableOpacity
                      style={styles.unregBtn}
                      onPress={() => handleUnregister(child)}
                    >
                      <Text style={styles.unregBtnText}>Remove</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.regBtn}
                        onPress={() => handleRegister(child, false)}
                      >
                        <Text style={styles.regBtnText}>Yes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.regBtn, styles.infoBtn]}
                        onPress={() => handleRegister(child, true)}
                      >
                        <Text style={styles.regBtnText}>Info Updated</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}

        {isOrganizer && (
          <>
            <Text style={styles.section}>
              All Registrations ({allRegistrations.length})
            </Text>
            {allRegistrations.length === 0 ? (
              <Text style={styles.empty}>No registrations yet.</Text>
            ) : (
              allRegistrations.map((reg) => (
                <View key={reg.id} style={styles.regRow}>
                  <Text style={styles.regName}>{reg.child?.name ?? reg.child_id}</Text>
                  {reg.child?.allergies ? (
                    <Text style={styles.regDetail}>Allergies: {reg.child.allergies}</Text>
                  ) : null}
                  {reg.child?.notes ? (
                    <Text style={styles.regDetail}>Notes: {reg.child.notes}</Text>
                  ) : null}
                  {reg.info_updated && (
                    <Text style={styles.infoBadge}>Info Updated</Text>
                  )}
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  eventHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  desc: { fontSize: 15, color: '#444', marginBottom: 8 },
  meta: { fontSize: 14, color: '#555', marginBottom: 4 },
  metaLabel: { fontWeight: '600' },
  section: { fontSize: 17, fontWeight: '600', padding: 16, paddingBottom: 8, color: '#333' },
  empty: { color: '#888', textAlign: 'center', padding: 16 },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  childInfo: { flex: 1 },
  childName: { fontSize: 16, fontWeight: '500' },
  registeredBadge: { fontSize: 13, color: '#34C759', marginTop: 2 },
  childActions: { flexDirection: 'row', gap: 8 },
  regBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  infoBtn: { backgroundColor: '#5856D6' },
  regBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  unregBtn: {
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unregBtnText: { color: '#FF3B30', fontSize: 13 },
  regRow: {
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  regName: { fontSize: 16, fontWeight: '500' },
  regDetail: { fontSize: 13, color: '#666', marginTop: 2 },
  infoBadge: { fontSize: 12, color: '#5856D6', marginTop: 2 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF3CD',
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    padding: 10,
  },
  errorBannerText: { color: '#856404', fontSize: 13, flex: 1 },
  retryText: { color: '#007AFF', fontSize: 13, fontWeight: '600', marginLeft: 8 },
});
