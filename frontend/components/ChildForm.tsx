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
import type { StoredChild } from '../lib/storage';

interface Props {
  visible: boolean;
  initial?: StoredChild | null;
  onSave: (data: { name: string; birthdate?: string; allergies?: string; notes?: string }) => Promise<void>;
  onCancel: () => void;
}

export default function ChildForm({ visible, initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [birthdate, setBirthdate] = useState(initial?.birthdate ?? '');
  const [allergies, setAllergies] = useState(initial?.allergies ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  // Reset fields whenever the modal opens or the child being edited changes.
  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setBirthdate(initial?.birthdate ?? '');
      setAllergies(initial?.allergies ?? '');
      setNotes(initial?.notes ?? '');
    }
  }, [visible, initial]);

  function resetToInitial() {
    setName(initial?.name ?? '');
    setBirthdate(initial?.birthdate ?? '');
    setAllergies(initial?.allergies ?? '');
    setNotes(initial?.notes ?? '');
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
        birthdate: birthdate.trim() || undefined,
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
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.headerBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{initial ? 'Edit Child' : 'Add Child'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={[styles.headerBtn, styles.headerBtnPrimary, saving && styles.disabled]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Child's name"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
              autoFocus={!initial}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Birthdate</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#aaa"
              value={birthdate}
              onChangeText={setBirthdate}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Allergies</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="List any allergies or dietary restrictions"
              placeholderTextColor="#aaa"
              value={allergies}
              onChangeText={setAllergies}
              multiline
              numberOfLines={3}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Any other relevant info"
              placeholderTextColor="#aaa"
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
  scroll: { flex: 1, padding: 16 },
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
  multiline: { minHeight: 80, textAlignVertical: 'top' },
});
