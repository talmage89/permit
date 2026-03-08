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
import DateTimePicker from '@react-native-community/datetimepicker';
import { api, type Event } from '../lib/api';
import { useTheme, type Theme } from '../lib/theme';

interface Props {
  groupId: string;
  visible: boolean;
  onCreated: (event: Event) => void;
  onCancel: () => void;
}

function formatDateTimeLabel(date: Date): string {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CreateEventModal({ groupId, visible, onCreated, onCancel }: Props) {
  const theme = useTheme();
  const s = styles(theme);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [location, setLocation] = useState('');
  const [rsvpDeadline, setRsvpDeadline] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  const [showEventDatePicker, setShowEventDatePicker] = useState(false);
  const [showRsvpPicker, setShowRsvpPicker] = useState(false);

  function reset() {
    setTitle('');
    setDescription('');
    setEventDate(null);
    setLocation('');
    setRsvpDeadline(null);
    setShowEventDatePicker(false);
    setShowRsvpPicker(false);
  }

  async function handleCreate() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter an event title.');
      return;
    }
    if (!eventDate) {
      Alert.alert('Date required', 'Please select a date and time for the event.');
      return;
    }
    setSaving(true);
    try {
      const event = await api.events.create(groupId, {
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: eventDate.toISOString(),
        location: location.trim() || undefined,
        rsvp_deadline: rsvpDeadline ? rsvpDeadline.toISOString() : undefined,
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
        style={s.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={s.headerBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Create Event</Text>
          <TouchableOpacity onPress={handleCreate} disabled={saving}>
            <Text style={[s.headerBtn, s.headerBtnPrimary, saving && s.disabled]}>
              {saving ? 'Saving...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={s.body} keyboardShouldPersistTaps="handled">
          <View style={s.field}>
            <Text style={s.label}>Title *</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Soccer Practice"
              placeholderTextColor={theme.textTertiary}
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="next"
            />
          </View>
          <View style={s.field}>
            <Text style={s.label}>Description</Text>
            <TextInput
              style={[s.input, s.multiline]}
              placeholder="Optional details"
              placeholderTextColor={theme.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
          <View style={s.field}>
            <Text style={s.label}>Date & Time *</Text>
            <TouchableOpacity
              style={s.input}
              onPress={() => { setShowEventDatePicker(true); setShowRsvpPicker(false); }}
            >
              <Text style={eventDate ? s.inputText : s.placeholderText}>
                {eventDate ? formatDateTimeLabel(eventDate) : 'Select date and time'}
              </Text>
            </TouchableOpacity>
            {showEventDatePicker && (
              <DateTimePicker
                value={eventDate ?? new Date()}
                mode="datetime"
                display="spinner"
                minimumDate={new Date()}
                onChange={(_event, selectedDate) => {
                  if (Platform.OS === 'android') setShowEventDatePicker(false);
                  if (selectedDate) setEventDate(selectedDate);
                }}
              />
            )}
            {showEventDatePicker && Platform.OS === 'ios' && (
              <TouchableOpacity style={s.pickerDone} onPress={() => setShowEventDatePicker(false)}>
                <Text style={s.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={s.field}>
            <Text style={s.label}>Location</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. City Park Field 3"
              placeholderTextColor={theme.textTertiary}
              value={location}
              onChangeText={setLocation}
              returnKeyType="next"
            />
          </View>
          <View style={s.field}>
            <Text style={s.label}>RSVP Deadline</Text>
            <TouchableOpacity
              style={s.input}
              onPress={() => { setShowRsvpPicker(true); setShowEventDatePicker(false); }}
            >
              <Text style={rsvpDeadline ? s.inputText : s.placeholderText}>
                {rsvpDeadline ? formatDateTimeLabel(rsvpDeadline) : 'Optional'}
              </Text>
            </TouchableOpacity>
            {showRsvpPicker && (
              <DateTimePicker
                value={rsvpDeadline ?? eventDate ?? new Date()}
                mode="datetime"
                display="spinner"
                onChange={(_event, selectedDate) => {
                  if (Platform.OS === 'android') setShowRsvpPicker(false);
                  if (selectedDate) setRsvpDeadline(selectedDate);
                }}
              />
            )}
            {showRsvpPicker && Platform.OS === 'ios' && (
              <View style={s.pickerActions}>
                <TouchableOpacity onPress={() => { setRsvpDeadline(null); setShowRsvpPicker(false); }}>
                  <Text style={s.pickerActionText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowRsvpPicker(false)}>
                  <Text style={[s.pickerActionText, s.pickerActionDone]}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
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
    inputText: { fontSize: 16, color: t.text },
    placeholderText: { fontSize: 16, color: t.textTertiary },
    multiline: { height: 80, textAlignVertical: 'top' },
    pickerDone: { alignItems: 'flex-end', paddingTop: 8 },
    pickerDoneText: { fontSize: 16, color: t.accent, fontWeight: '600' },
    pickerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 8,
    },
    pickerActionText: { fontSize: 16, color: t.accent },
    pickerActionDone: { fontWeight: '600' },
  });
