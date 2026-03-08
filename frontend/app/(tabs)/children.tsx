import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../lib/api';
import { getChildren, saveChildren, getDeviceId, type StoredChild } from '../../lib/storage';
import ChildForm from '../../components/ChildForm';

export default function ChildrenScreen() {
  const [children, setChildren] = useState<StoredChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<StoredChild | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadChildren();
    }, []),
  );

  async function loadChildren() {
    setLoading(true);
    setError(null);
    try {
      const deviceId = await getDeviceId();
      if (deviceId) {
        const remote = await api.children.list(deviceId);
        const stored: StoredChild[] = remote.map((c) => ({
          id: c.id,
          name: c.name,
          birthdate: c.birthdate,
          allergies: c.allergies,
          notes: c.notes,
        }));
        await saveChildren(stored);
        setChildren(stored);
      } else {
        setChildren(await getChildren());
      }
    } catch {
      // Fall back to local data and show error
      const local = await getChildren();
      setChildren(local);
      setError('Could not refresh from server. Showing cached data.');
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditTarget(null);
    setFormVisible(true);
  }

  function openEdit(child: StoredChild) {
    setEditTarget(child);
    setFormVisible(true);
  }

  async function handleSave(data: {
    name: string;
    birthdate?: string;
    allergies?: string;
    notes?: string;
  }) {
    const deviceId = await getDeviceId();
    if (!deviceId) return;

    if (editTarget) {
      const updated = await api.children.update(deviceId, editTarget.id, data);
      const newList = children.map((c) =>
        c.id === updated.id
          ? { id: updated.id, name: updated.name, birthdate: updated.birthdate, allergies: updated.allergies, notes: updated.notes }
          : c,
      );
      await saveChildren(newList);
      setChildren(newList);
    } else {
      const created = await api.children.create(deviceId, data);
      const newChild: StoredChild = {
        id: created.id,
        name: created.name,
        birthdate: created.birthdate,
        allergies: created.allergies,
        notes: created.notes,
      };
      const newList = [...children, newChild];
      await saveChildren(newList);
      setChildren(newList);
    }
    setFormVisible(false);
    setEditTarget(null);
  }

  async function handleDelete(child: StoredChild) {
    Alert.alert('Remove child', `Remove "${child.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const deviceId = await getDeviceId();
            if (deviceId) {
              await api.children.delete(deviceId, child.id);
            }
            const newList = children.filter((c) => c.id !== child.id);
            await saveChildren(newList);
            setChildren(newList);
          } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete.');
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
    <View style={styles.container}>
      <Text style={styles.title}>Children</Text>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadChildren}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={children}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TouchableOpacity style={styles.rowContent} onPress={() => openEdit(item)}>
              <Text style={styles.childName}>{item.name}</Text>
              {item.birthdate ? <Text style={styles.childMeta}>{item.birthdate}</Text> : null}
              {item.allergies ? (
                <Text style={styles.childMeta} numberOfLines={1}>
                  Allergies: {item.allergies}
                </Text>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
              <Text style={styles.deleteBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.empty}>No children added yet.</Text>}
        style={styles.list}
      />
      <TouchableOpacity style={styles.button} onPress={openAdd}>
        <Text style={styles.buttonText}>Add Child</Text>
      </TouchableOpacity>

      <ChildForm
        visible={formVisible}
        initial={editTarget}
        onSave={handleSave}
        onCancel={() => {
          setFormVisible(false);
          setEditTarget(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
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
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowContent: { flex: 1 },
  childName: { fontSize: 16, fontWeight: '600' },
  childMeta: { fontSize: 13, color: '#666', marginTop: 2 },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  deleteBtnText: { color: '#FF3B30', fontSize: 14 },
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
});
