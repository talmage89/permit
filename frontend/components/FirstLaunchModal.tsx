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
import { setDisplayName, getDeviceId } from '../lib/storage';
import { useTheme, type Theme } from '../lib/theme';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function FirstLaunchModal({ visible, onDismiss }: Props) {
  const theme = useTheme();
  const s = styles(theme);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter your display name.');
      return;
    }
    setSaving(true);
    try {
      await setDisplayName(trimmed);
      const deviceId = await getDeviceId();
      if (deviceId) {
        await api.devices.update(deviceId, { display_name: trimmed });
      }
      onDismiss();
    } catch {
      onDismiss();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        style={s.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.card}>
          <Text style={s.title}>Welcome to Permit</Text>
          <Text style={s.subtitle}>
            Enter your display name so other group members can identify you.
          </Text>
          <TextInput
            style={s.input}
            placeholder="Your name"
            placeholderTextColor={theme.textTertiary}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <TouchableOpacity
            style={[s.button, saving && s.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={s.buttonText}>{saving ? 'Saving...' : 'Get Started'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: t.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      backgroundColor: t.card,
      borderRadius: 20,
      padding: 28,
      width: '100%',
      borderWidth: 1,
      borderColor: t.border,
    },
    title: { fontSize: 24, fontWeight: '700', color: t.text, marginBottom: 8 },
    subtitle: { fontSize: 15, color: t.textSecondary, marginBottom: 24, lineHeight: 22 },
    input: {
      backgroundColor: t.inputBg,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: t.text,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: t.border,
    },
    button: {
      backgroundColor: t.accent,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  });
