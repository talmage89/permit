import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '../../lib/api';
import { getGroups, saveGroup, removeGroup, getDeviceId, type StoredGroup } from '../../lib/storage';
import CreateGroupModal from '../../components/CreateGroupModal';
import JoinGroupModal from '../../components/JoinGroupModal';

export default function HomeScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<StoredGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, []),
  );

  async function loadGroups() {
    setLoading(true);
    setError(null);
    try {
      const deviceId = await getDeviceId();
      if (deviceId) {
        const remote = await api.groups.listForDevice(deviceId);
        // Sync remote groups to local storage
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
            // Non-fatal: remove locally even if backend call fails
          }
          await removeGroup(group.id);
          setGroups((prev) => prev.filter((g) => g.id !== group.id));
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
    <View style={styles.container}>
      <Text style={styles.title}>My Groups</Text>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadGroups}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.groupRow}
            onPress={() => router.push(`/group/${item.id}`)}
            onLongPress={() => handleLeave(item)}
          >
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.groupCode}>Code: {item.join_code}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No groups yet. Create or join a group to get started.</Text>
        }
        style={styles.list}
      />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={() => setCreateVisible(true)}>
          <Text style={styles.buttonText}>Create Group</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => setJoinVisible(true)}
        >
          <Text style={styles.buttonText}>Join Group</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  list: { flex: 1 },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 17, fontWeight: '600' },
  groupCode: { fontSize: 13, color: '#888', marginTop: 2 },
  chevron: { fontSize: 22, color: '#ccc' },
  separator: { height: 1, backgroundColor: '#eee' },
  empty: { color: '#888', textAlign: 'center', marginTop: 40, lineHeight: 22 },
  actions: { gap: 8, paddingBottom: 16 },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  secondaryButton: { backgroundColor: '#34C759' },
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
