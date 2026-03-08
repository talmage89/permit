import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Groups</Text>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListEmptyComponent={
          <Text style={styles.empty}>No groups yet. Create or join a group to get started.</Text>
        }
      />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Create Group</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
          <Text style={styles.buttonText}>Join Group</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
  actions: { gap: 8, paddingBottom: 16 },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  secondaryButton: { backgroundColor: '#34C759' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
