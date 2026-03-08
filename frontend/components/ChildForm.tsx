import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { StoredChild } from '../lib/storage';
import { useTheme, type Theme } from '../lib/theme';

interface Props {
  visible: boolean;
  initial?: StoredChild | null;
  onSave: (data: { name: string; birthdate?: string; allergies?: string; notes?: string }) => Promise<void>;
  onCancel: () => void;
}

function parseDateOrNull(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ChildForm({ visible, initial, onSave, onCancel }: Props) {
  const theme = useTheme();
  const s = styles(theme);
  const [name, setName] = useState(initial?.name ?? '');
  const [birthdate, setBirthdate] = useState<Date | null>(parseDateOrNull(initial?.birthdate));
  const [allergies, setAllergies] = useState(initial?.allergies ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setBirthdate(parseDateOrNull(initial?.birthdate));
      setAllergies(initial?.allergies ?? '');
      setNotes(initial?.notes ?? '');
      setShowDatePicker(false);
    }
  }, [visible, initial]);

  function resetToInitial() {
    setName(initial?.name ?? '');
    setBirthdate(parseDateOrNull(initial?.birthdate));
    setAllergies(initial?.allergies ?? '');
    setNotes(initial?.notes ?? '');
    setShowDatePicker(false);
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter a name for your child.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: trimmedName,
        birthdate: birthdate ? birthdate.toISOString().split('T')[0] : undefined,
        allergies: allergies.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    resetToInitial();
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
          <Text style={s.headerTitle}>{initial ? 'Edit Child' : 'Add Child'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={[s.headerBtn, s.headerBtnPrimary, saving && s.disabled]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.field}>
            <Text style={s.label}>Name *</Text>
            <TextInput
              style={s.input}
              placeholder="Child's name"
              placeholderTextColor={theme.textTertiary}
              value={name}
              onChangeText={setName}
              autoFocus={!initial}
            />
          </View>
          <View style={s.field}>
            <Text style={s.label}>Birthdate</Text>
            <TouchableOpacity
              style={s.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={birthdate ? s.inputText : s.placeholderText}>
                {birthdate ? formatDateLabel(birthdate) : 'Select date'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={birthdate ?? new Date()}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(_event, selectedDate) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (selectedDate) setBirthdate(selectedDate);
                }}
              />
            )}
            {showDatePicker && Platform.OS === 'ios' && (
              <View style={s.pickerActions}>
                <TouchableOpacity onPress={() => { setBirthdate(null); setShowDatePicker(false); }}>
                  <Text style={s.pickerActionText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[s.pickerActionText, s.pickerActionDone]}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={s.field}>
            <Text style={s.label}>Allergies</Text>
            <TextInput
              style={[s.input, s.multiline]}
              placeholder="List any allergies or dietary restrictions"
              placeholderTextColor={theme.textTertiary}
              value={allergies}
              onChangeText={setAllergies}
              multiline
              numberOfLines={3}
            />
          </View>
          <View style={s.field}>
            <Text style={s.label}>Notes</Text>
            <TextInput
              style={[s.input, s.multiline]}
              placeholder="Any other relevant info"
              placeholderTextColor={theme.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
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
    scroll: { flex: 1, padding: 16 },
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
    multiline: { minHeight: 80, textAlignVertical: 'top' },
    pickerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 8,
    },
    pickerActionText: { fontSize: 16, color: t.accent },
    pickerActionDone: { fontWeight: '600' },
  });
