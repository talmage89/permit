import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { api } from '../../lib/api';
import { getDisplayName, setDisplayName, getDeviceId } from '../../lib/storage';
import { syncPushToken } from '../../lib/device';

export default function SettingsScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

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

  async function handleNotificationToggle(enabled: boolean) {
    setNotifLoading(true);
    try {
      if (enabled) {
        const token = await syncPushToken();
        if (token) {
          setNotificationsEnabled(true);
        } else {
          Alert.alert(
            'Permission denied',
            'Push notifications are disabled. Enable them in your device settings.',
          );
        }
      } else {
        // Clear push token from backend
        const deviceId = await getDeviceId();
        if (deviceId) {
          await api.devices.update(deviceId, { push_token: '' });
        }
        setNotificationsEnabled(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to update notification settings.');
    } finally {
      setNotifLoading(false);
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

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.rowInfo}>
          <Text style={styles.rowLabel}>Push Notifications</Text>
          <Text style={styles.rowSub}>
            Get notified when new events are created in your groups
          </Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={handleNotificationToggle}
          disabled={notifLoading}
        />
      </View>
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
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 16, fontWeight: '500' },
  rowSub: { fontSize: 13, color: '#888', marginTop: 2 },
});
