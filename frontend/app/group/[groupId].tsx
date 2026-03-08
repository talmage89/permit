import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Upcoming Events</Text>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListEmptyComponent={
          <Text style={styles.empty}>No events yet. Create the first one!</Text>
        }
      />
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Create Event</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  subtitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
