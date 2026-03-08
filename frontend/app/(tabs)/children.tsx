import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api } from '../../lib/api';
import { getChildren, saveChildren, getDeviceId, type StoredChild } from '../../lib/storage';
import { useTheme, type Theme } from '../../lib/theme';
import ChildForm from '../../components/ChildForm';

export default function ChildrenScreen() {
  const theme = useTheme();
  const s = styles(theme);
  const [children, setChildren] = useState<StoredChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<StoredChild | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadChildren();
    }, []),
  );

  async function loadChildren(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else if (children.length === 0) setLoading(true);
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
      const local = await getChildren();
      setChildren(local);
      setError('Could not refresh from server. Showing cached data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function formatBirthdate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
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
          <TouchableOpacity onPress={() => loadChildren()}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={children}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => openEdit(item)} activeOpacity={0.7}>
            <View style={s.cardIcon}>
              <Ionicons name="person-circle" size={36} color={theme.accentLight} />
            </View>
            <View style={s.cardContent}>
              <Text style={s.cardTitle}>{item.name}</Text>
              {item.birthdate ? <Text style={s.cardSub}>{formatBirthdate(item.birthdate)}</Text> : null}
              {item.allergies ? (
                <Text style={s.cardSub} numberOfLines={1}>
                  Allergies: {item.allergies}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={theme.danger} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={children.length === 0 ? s.emptyContainer : s.listContent}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Ionicons name="happy-outline" size={48} color={theme.textTertiary} />
            <Text style={s.emptyTitle}>No children added yet</Text>
            <Text style={s.emptySub}>Add your children to register them for events.</Text>
          </View>
        }
        style={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadChildren(true)} tintColor={theme.accent} />
        }
      />
      <View style={s.actions}>
        <TouchableOpacity style={s.button} onPress={openAdd} activeOpacity={0.8}>
          <Text style={s.buttonText}>Add Child</Text>
        </TouchableOpacity>
      </View>

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
    deleteBtn: { padding: 8 },
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
      marginHorizontal: 16,
      marginTop: 16,
    },
    errorText: { color: t.errorText, fontSize: 13, flex: 1 },
    retryText: { color: t.accent, fontSize: 13, fontWeight: '600', marginLeft: 8 },
  });
