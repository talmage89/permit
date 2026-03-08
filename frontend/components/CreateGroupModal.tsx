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
import { useTheme, type Theme } from '../lib/theme';

interface Props {
  visible: boolean;
  onCreated: (group: StoredGroup) => void;
  onCancel: () => void;
}

export default function CreateGroupModal({ visible, onCreated, onCancel }: Props) {
  const theme = useTheme();
  const s = styles(theme);
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
        style={s.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={s.headerBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Create Group</Text>
          <TouchableOpacity onPress={handleCreate} disabled={saving}>
            <Text style={[s.headerBtn, s.headerBtnPrimary, saving && s.disabled]}>
              {saving ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={s.body}>
          <View style={s.field}>
            <Text style={s.label}>Group Name *</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Soccer Team Parents"
              placeholderTextColor={theme.textTertiary}
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="next"
            />
          </View>
          <View style={s.field}>
            <Text style={s.label}>Password *</Text>
            <TextInput
              style={s.input}
              placeholder="Share this with members"
              placeholderTextColor={theme.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
          </View>
          <Text style={s.hint}>
            Members will use the join code + this password to join your group.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: t.bg },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: t.border,
      paddingTop: Platform.OS === 'ios' ? 56 : 16,
      backgroundColor: t.navBg,
    },
    headerTitle: { fontSize: 17, fontWeight: '600', color: t.text },
    headerBtn: { fontSize: 17, color: t.accent },
    headerBtnPrimary: { fontWeight: '600' },
    disabled: { opacity: 0.4 },
    body: { padding: 16 },
    field: { marginBottom: 20 },
    label: { fontSize: 14, color: t.textSecondary, marginBottom: 6 },
    input: {
      backgroundColor: t.inputBg,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: t.text,
      borderWidth: 1,
      borderColor: t.border,
    },
    hint: { fontSize: 13, color: t.textTertiary, lineHeight: 18 },
  });
