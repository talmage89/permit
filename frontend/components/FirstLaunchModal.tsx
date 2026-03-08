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

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function FirstLaunchModal({ visible, onDismiss }: Props) {
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
      // Save locally even if backend sync fails
      onDismiss();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Welcome to Permit!</Text>
          <Text style={styles.subtitle}>
            Enter your display name so other group members can identify you.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Get Started'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
