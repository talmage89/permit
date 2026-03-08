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
import * as Notifications from 'expo-notifications';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api } from '../../lib/api';
import { getDisplayName, setDisplayName, getDeviceId } from '../../lib/storage';
import { syncPushToken } from '../../lib/device';
import { useTheme, type Theme } from '../../lib/theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const s = styles(theme);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const stored = await getDisplayName();
      setName(stored);
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
      setLoading(false);
    }
    init();
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
      <View style={s.centered}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Profile</Text>
        <View style={s.card}>
          <Text style={s.label}>Display Name</Text>
          <TextInput
            style={s.input}
            placeholder="Enter your name"
            placeholderTextColor={theme.textTertiary}
            value={name}
            onChangeText={setName}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[s.button, saving && s.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={s.buttonText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Notifications</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowIcon}>
              <Ionicons name="notifications-outline" size={20} color={theme.accent} />
            </View>
            <View style={s.rowInfo}>
              <Text style={s.rowLabel}>Push Notifications</Text>
              <Text style={s.rowSub}>
                Get notified when new events are created
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              disabled={notifLoading}
              trackColor={{ false: theme.surface, true: theme.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg, padding: 16 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg },
    section: { marginBottom: 24 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: t.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: t.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: t.border,
    },
    label: { fontSize: 14, color: t.textSecondary, marginBottom: 6 },
    input: {
      backgroundColor: t.inputBg,
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      color: t.text,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: t.border,
    },
    button: {
      backgroundColor: t.accent,
      padding: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    row: { flexDirection: 'row', alignItems: 'center' },
    rowIcon: { marginRight: 12 },
    rowInfo: { flex: 1 },
    rowLabel: { fontSize: 16, fontWeight: '500', color: t.text },
    rowSub: { fontSize: 13, color: t.textTertiary, marginTop: 2 },
  });
