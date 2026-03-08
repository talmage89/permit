import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="group/[groupId]" options={{ title: 'Group' }} />
        <Stack.Screen name="event/[eventId]" options={{ title: 'Event' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
