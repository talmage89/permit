import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api } from '../../lib/api';
import { getGroups, saveGroup, removeGroup, getDeviceId, type StoredGroup } from '../../lib/storage';
import { useTheme, type Theme } from '../../lib/theme';
import CreateGroupModal from '../../components/CreateGroupModal';
import JoinGroupModal from '../../components/JoinGroupModal';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const s = styles(theme);
  const [groups, setGroups] = useState<StoredGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, []),
  );

  async function loadGroups(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else if (groups.length === 0) setLoading(true);
    setError(null);
    try {
      const deviceId = await getDeviceId();
      if (deviceId) {
        const remote = await api.groups.listForDevice(deviceId);
        for (const g of remote) {
          await saveGroup({ id: g.id, name: g.name, join_code: g.join_code, created_at: g.created_at });
        }
        setGroups(
          remote.map((g) => ({
            id: g.id,
            name: g.name,
            join_code: g.join_code,
            created_at: g.created_at,
          })),
        );
      } else {
        setGroups(await getGroups());
      }
    } catch {
      const local = await getGroups();
      setGroups(local);
      setError('Could not refresh from server. Showing cached data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleGroupCreated(group: StoredGroup) {
    setCreateVisible(false);
    setGroups((prev) => {
      if (prev.some((g) => g.id === group.id)) return prev;
      return [group, ...prev];
    });
  }

  function handleGroupJoined(group: StoredGroup) {
    setJoinVisible(false);
    setGroups((prev) => {
      if (prev.some((g) => g.id === group.id)) return prev;
      return [group, ...prev];
    });
  }

  function handleLeave(group: StoredGroup) {
    Alert.alert('Leave group', `Leave "${group.name}"? You can rejoin later with the join code.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.groups.leave(group.id);
          } catch {
            // Non-fatal
          }
          await removeGroup(group.id);
          setGroups((prev) => prev.filter((g) => g.id !== group.id));
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
    <View style={s.container}>
      {error && (
        <View style={s.errorBanner}>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadGroups()}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => router.push(`/group/${item.id}`)}
            onLongPress={() => handleLeave(item)}
            activeOpacity={0.7}
          >
            <View style={s.cardIcon}>
              <Ionicons name="people-circle" size={36} color={theme.accent} />
            </View>
            <View style={s.cardContent}>
              <Text style={s.cardTitle}>{item.name}</Text>
              <Text style={s.cardSub}>Code: {item.join_code}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
          </TouchableOpacity>
        )}
        contentContainerStyle={groups.length === 0 ? s.emptyContainer : s.listContent}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Ionicons name="people-outline" size={48} color={theme.textTertiary} />
            <Text style={s.emptyTitle}>No groups yet</Text>
            <Text style={s.emptySub}>Create or join a group to get started.</Text>
          </View>
        }
        style={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadGroups(true)} tintColor={theme.accent} />
        }
      />
      <View style={s.actions}>
        <TouchableOpacity style={s.button} onPress={() => setCreateVisible(true)} activeOpacity={0.8}>
          <Text style={s.buttonText}>Create Group</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.buttonOutline}
          onPress={() => setJoinVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={s.buttonOutlineText}>Join Group</Text>
        </TouchableOpacity>
      </View>

      <CreateGroupModal
        visible={createVisible}
        onCreated={handleGroupCreated}
        onCancel={() => setCreateVisible(false)}
      />
      <JoinGroupModal
        visible={joinVisible}
        onJoined={handleGroupJoined}
        onCancel={() => setJoinVisible(false)}
      />
    </View>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg },
    list: { flex: 1 },
    listContent: { padding: 16, gap: 10 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyWrap: { alignItems: 'center', padding: 40, gap: 8 },
    emptyTitle: { fontSize: 17, fontWeight: '600', color: t.textSecondary },
    emptySub: { fontSize: 14, color: t.textTertiary, textAlign: 'center' },
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
    cardSub: { fontSize: 13, color: t.textTertiary, marginTop: 2 },
    actions: { padding: 16, gap: 10 },
    button: {
      backgroundColor: t.accent,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    buttonOutline: {
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: t.accent,
    },
    buttonOutlineText: { color: t.accent, fontWeight: '600', fontSize: 16 },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.errorBg,
      borderRadius: 12,
      padding: 12,
      marginHorizontal: 16,
      marginTop: 16,
    },
    errorText: { color: t.errorText, fontSize: 13, flex: 1 },
    retryText: { color: t.accent, fontSize: 13, fontWeight: '600', marginLeft: 8 },
  });
