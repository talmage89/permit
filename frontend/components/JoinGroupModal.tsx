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
  onJoined: (group: StoredGroup) => void;
  onCancel: () => void;
}

export default function JoinGroupModal({ visible, onJoined, onCancel }: Props) {
  const theme = useTheme();
  const s = styles(theme);
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
        style={s.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={s.headerBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Join Group</Text>
          <TouchableOpacity onPress={handleJoin} disabled={saving}>
            <Text style={[s.headerBtn, s.headerBtnPrimary, saving && s.disabled]}>
              {saving ? 'Joining...' : 'Join'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={s.body}>
          <View style={s.field}>
            <Text style={s.label}>Join Code *</Text>
            <TextInput
              style={s.input}
              placeholder="8-character code"
              placeholderTextColor={theme.textTertiary}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              autoCapitalize="characters"
              autoFocus
              returnKeyType="next"
              maxLength={8}
            />
          </View>
          <View style={s.field}>
            <Text style={s.label}>Password *</Text>
            <TextInput
              style={s.input}
              placeholder="Group password"
              placeholderTextColor={theme.textTertiary}
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
  });
