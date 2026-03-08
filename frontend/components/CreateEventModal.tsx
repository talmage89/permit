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
  ScrollView,
} from 'react-native';
import { api, type Event } from '../lib/api';

interface Props {
  groupId: string;
  visible: boolean;
  onCreated: (event: Event) => void;
  onCancel: () => void;
}

export default function CreateEventModal({ groupId, visible, onCreated, onCancel }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [rsvpDeadline, setRsvpDeadline] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle('');
    setDescription('');
    setEventDate('');
    setLocation('');
    setRsvpDeadline('');
  }

  async function handleCreate() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter an event title.');
      return;
    }
    if (!eventDate.trim()) {
      Alert.alert('Date required', 'Please enter a date (e.g. 2025-06-15T10:00:00Z).');
      return;
    }
    setSaving(true);
    try {
      const event = await api.events.create(groupId, {
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: eventDate.trim(),
        location: location.trim() || undefined,
        rsvp_deadline: rsvpDeadline.trim() || undefined,
      });
      reset();
      onCreated(event);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create event.');
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
          <Text style={styles.headerTitle}>Create Event</Text>
          <TouchableOpacity onPress={handleCreate} disabled={saving}>
            <Text style={[styles.headerBtn, styles.headerBtnPrimary, saving && styles.disabled]}>
              {saving ? 'Saving...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Soccer Practice"
              placeholderTextColor="#aaa"
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="next"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Optional details"
              placeholderTextColor="#aaa"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Date & Time * (ISO 8601)</Text>
            <TextInput
              style={styles.input}
              placeholder="2025-06-15T10:00:00Z"
              placeholderTextColor="#aaa"
              value={eventDate}
              onChangeText={setEventDate}
              returnKeyType="next"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. City Park Field 3"
              placeholderTextColor="#aaa"
              value={location}
              onChangeText={setLocation}
              returnKeyType="next"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>RSVP Deadline (ISO 8601)</Text>
            <TextInput
              style={styles.input}
              placeholder="2025-06-14T20:00:00Z"
              placeholderTextColor="#aaa"
              value={rsvpDeadline}
              onChangeText={setRsvpDeadline}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
          </View>
        </ScrollView>
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
  multiline: { height: 80, textAlignVertical: 'top' },
});
