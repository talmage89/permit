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
  onJoined: (group: StoredGroup) => void;
  onCancel: () => void;
}

export default function JoinGroupModal({ visible, onJoined, onCancel }: Props) {
  const [joinCode, setJoinCode] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setJoinCode('');
    setPassword('');
  }

  async function handleJoin() {
    if (!joinCode.trim()) {
      Alert.alert('Join code required', 'Please enter the group join code.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Password required', 'Please enter the group password.');
      return;
    }
    setSaving(true);
    try {
      const group = await api.groups.join({
        join_code: joinCode.trim().toUpperCase(),
        password: password.trim(),
      });
      const stored: StoredGroup = {
        id: group.id,
        name: group.name,
        join_code: group.join_code,
        created_at: group.created_at,
      };
      await saveGroup(stored);
      reset();
      onJoined(stored);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to join group.');
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
          <Text style={styles.headerTitle}>Join Group</Text>
          <TouchableOpacity onPress={handleJoin} disabled={saving}>
            <Text style={[styles.headerBtn, styles.headerBtnPrimary, saving && styles.disabled]}>
              {saving ? 'Joining...' : 'Join'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.body}>
          <View style={styles.field}>
            <Text style={styles.label}>Join Code *</Text>
            <TextInput
              style={styles.input}
              placeholder="8-character code"
              placeholderTextColor="#aaa"
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              autoCapitalize="characters"
              autoFocus
              returnKeyType="next"
              maxLength={8}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Group password"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleJoin}
            />
          </View>
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
});
