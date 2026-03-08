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
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, type Event, type Child, type Registration } from '../../lib/api';
import { getDeviceId, getChildren } from '../../lib/storage';
import { formatDate } from '../../lib/utils';
import { useTheme, type Theme } from '../../lib/theme';

export default function EventDetailScreen() {
  const { eventId, groupId } = useLocalSearchParams<{ eventId: string; groupId?: string }>();
  const theme = useTheme();
  const s = styles(theme);
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

      let evt: Event | null = null;
      if (groupId) {
        try {
          evt = await api.events.get(groupId, eventId);
          setEvent(evt);
          setIsOrganizer(evt.created_by_device_id === did);
        } catch {
          setError('Failed to load event details.');
        }
      }

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

      if (did) {
        try {
          const myRegs = await api.registrations.listForDevice(eventId, did);
          setMyRegistrations(myRegs);
        } catch {
          setMyRegistrations([]);
        }
      }

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
      const reg = await api.registrations.register(eventId, {
        child_id: child.id,
        info_updated: infoUpdated,
      });
      setMyRegistrations((prev) => {
        const filtered = prev.filter((r) => r.child_id !== child.id);
        return [...filtered, reg];
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
      <View style={s.centered}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: event?.title ?? 'Event' }} />
      <ScrollView style={s.container}>
        {error && (
          <View style={s.errorBanner}>
            <Text style={s.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={loadAll}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        {event && (
          <View style={s.eventCard}>
            <Text style={s.title}>{event.title}</Text>
            {event.description ? <Text style={s.desc}>{event.description}</Text> : null}
            <View style={s.metaRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
              <Text style={s.metaText}>{formatDate(event.event_date)}</Text>
            </View>
            {event.location ? (
              <View style={s.metaRow}>
                <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
                <Text style={s.metaText}>{event.location}</Text>
              </View>
            ) : null}
            {event.rsvp_deadline ? (
              <View style={s.metaRow}>
                <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                <Text style={s.metaText}>RSVP by {formatDate(event.rsvp_deadline)}</Text>
              </View>
            ) : null}
          </View>
        )}

        <Text style={s.sectionTitle}>Your Children</Text>
        {children.length === 0 ? (
          <View style={s.emptySection}>
            <Text style={s.emptyText}>
              No children added. Go to the Children tab to add them.
            </Text>
          </View>
        ) : (
          <View style={s.childrenCard}>
            {children.map((child, index) => {
              const registered = isRegistered(child.id);
              const reg = getRegistration(child.id);
              return (
                <View key={child.id} style={[s.childRow, index > 0 && s.childRowBorder]}>
                  <View style={s.childInfo}>
                    <Text style={s.childName}>{child.name}</Text>
                    {registered && (
                      <View style={s.badge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={reg?.info_updated ? theme.purple : theme.success}
                        />
                        <Text
                          style={[
                            s.badgeText,
                            { color: reg?.info_updated ? theme.purple : theme.success },
                          ]}
                        >
                          {reg?.info_updated ? 'Info Updated' : 'Going'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={s.childActions}>
                    {registered ? (
                      <TouchableOpacity
                        style={s.removeBtn}
                        onPress={() => handleUnregister(child)}
                        activeOpacity={0.7}
                      >
                        <Text style={s.removeBtnText}>Remove</Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={s.regBtn}
                          onPress={() => handleRegister(child, false)}
                          activeOpacity={0.7}
                        >
                          <Text style={s.regBtnText}>Yes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={s.infoBtn}
                          onPress={() => handleRegister(child, true)}
                          activeOpacity={0.7}
                        >
                          <Text style={s.regBtnText}>Info Updated</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {isOrganizer && (
          <>
            <Text style={s.sectionTitle}>
              All Registrations ({allRegistrations.length})
            </Text>
            {allRegistrations.length === 0 ? (
              <View style={s.emptySection}>
                <Text style={s.emptyText}>No registrations yet.</Text>
              </View>
            ) : (
              <View style={s.childrenCard}>
                {allRegistrations.map((reg, index) => (
                  <View key={reg.id} style={[s.regRow, index > 0 && s.childRowBorder]}>
                    <Text style={s.regName}>{reg.child?.name ?? reg.child_id}</Text>
                    {reg.child?.allergies ? (
                      <Text style={s.regDetail}>Allergies: {reg.child.allergies}</Text>
                    ) : null}
                    {reg.child?.notes ? (
                      <Text style={s.regDetail}>Notes: {reg.child.notes}</Text>
                    ) : null}
                    {reg.info_updated && (
                      <View style={[s.badge, { marginTop: 4 }]}>
                        <Ionicons name="checkmark-circle" size={14} color={theme.purple} />
                        <Text style={[s.badgeText, { color: theme.purple }]}>Info Updated</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg },
    eventCard: {
      margin: 16,
      backgroundColor: t.card,
      borderRadius: 14,
      padding: 18,
      borderWidth: 1,
      borderColor: t.border,
    },
    title: { fontSize: 22, fontWeight: '700', color: t.text, marginBottom: 6 },
    desc: { fontSize: 15, color: t.textSecondary, marginBottom: 12, lineHeight: 22 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    metaText: { fontSize: 14, color: t.textSecondary },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: t.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 8,
      marginBottom: 8,
      marginLeft: 20,
    },
    childrenCard: {
      marginHorizontal: 16,
      backgroundColor: t.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.border,
      overflow: 'hidden',
    },
    childRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      paddingHorizontal: 16,
    },
    childRowBorder: {
      borderTopWidth: 1,
      borderTopColor: t.borderLight,
    },
    childInfo: { flex: 1 },
    childName: { fontSize: 16, fontWeight: '500', color: t.text },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    badgeText: { fontSize: 13, fontWeight: '500' },
    childActions: { flexDirection: 'row', gap: 8 },
    regBtn: {
      backgroundColor: t.accent,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 8,
    },
    infoBtn: {
      backgroundColor: t.purple,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 8,
    },
    regBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    removeBtn: {
      borderWidth: 1.5,
      borderColor: t.danger,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 8,
    },
    removeBtnText: { color: t.danger, fontSize: 13, fontWeight: '500' },
    regRow: {
      padding: 14,
      paddingHorizontal: 16,
    },
    regName: { fontSize: 16, fontWeight: '500', color: t.text },
    regDetail: { fontSize: 13, color: t.textSecondary, marginTop: 2 },
    emptySection: { paddingHorizontal: 16, paddingVertical: 12 },
    emptyText: { color: t.textTertiary, textAlign: 'center' },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.errorBg,
      margin: 16,
      marginBottom: 0,
      borderRadius: 12,
      padding: 12,
    },
    errorBannerText: { color: t.errorText, fontSize: 13, flex: 1 },
    retryText: { color: t.accent, fontSize: 13, fontWeight: '600', marginLeft: 8 },
  });
