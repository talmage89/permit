import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event Details</Text>
      <Text style={styles.section}>Your Children</Text>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListEmptyComponent={
          <Text style={styles.empty}>No children added. Go to Children tab to add them.</Text>
        }
      />
      <Text style={styles.section}>Registrations</Text>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListEmptyComponent={
          <Text style={styles.empty}>No registrations yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  section: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  empty: { color: '#888', textAlign: 'center', marginTop: 12 },
});
