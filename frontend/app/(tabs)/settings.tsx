import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { api } from '../../lib/api';
import { getDisplayName, setDisplayName, getDeviceId } from '../../lib/storage';

export default function SettingsScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDisplayName().then((stored) => {
      setName(stored);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Display name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await setDisplayName(trimmed);
      const deviceId = await getDeviceId();
      if (deviceId) {
        await api.devices.update(deviceId, { display_name: trimmed });
      }
      Alert.alert('Saved', 'Display name updated.');
    } catch {
      // Local save already done; backend sync failure is non-fatal
      Alert.alert('Saved locally', 'Could not sync to server. Changes saved on device.');
    } finally {
      setSaving(false);
    }
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
      <Text style={styles.title}>Settings</Text>
      <View style={styles.field}>
        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
          returnKeyType="done"
        />
      </View>
      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, color: '#555', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
