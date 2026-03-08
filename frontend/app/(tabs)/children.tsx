import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

export default function ChildrenScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Children</Text>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListEmptyComponent={
          <Text style={styles.empty}>No children added yet.</Text>
        }
      />
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Add Child</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
