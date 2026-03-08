import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { api } from '../lib/api';
import { saveGroup, type StoredGroup } from '../lib/storage';

interface Props {
  visible: boolean;
  onCreated: (group: StoredGroup) => void;
  onCancel: () => void;
}

export default function CreateGroupModal({ visible, onCreated, onCancel }: Props) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setName('');
    setPassword('');
  }

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a group name.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Password required', 'Please set a group password.');
      return;
    }
    setSaving(true);
    try {
      const group = await api.groups.create({ name: name.trim(), password: password.trim() });
      const stored: StoredGroup = {
        id: group.id,
        name: group.name,
        join_code: group.join_code,
        created_at: group.created_at,
      };
      await saveGroup(stored);
      reset();
      onCreated(stored);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create group.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    reset();
    onCancel();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.headerBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Group</Text>
          <TouchableOpacity onPress={handleCreate} disabled={saving}>
            <Text style={[styles.headerBtn, styles.headerBtnPrimary, saving && styles.disabled]}>
              {saving ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.body}>
          <View style={styles.field}>
            <Text style={styles.label}>Group Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Soccer Team Parents"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="next"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Share this with members"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
          </View>
          <Text style={styles.hint}>
            Members will use the join code + this password to join your group.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
  },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  headerBtn: { fontSize: 17, color: '#007AFF' },
  headerBtnPrimary: { fontWeight: '600' },
  disabled: { opacity: 0.4 },
  body: { padding: 16 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, color: '#555', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  hint: { fontSize: 13, color: '#888', lineHeight: 18 },
});
