import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initDevice } from '../lib/device';
import { getDisplayName } from '../lib/storage';
import FirstLaunchModal from '../components/FirstLaunchModal';

export default function RootLayout() {
  const [showFirstLaunch, setShowFirstLaunch] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      await initDevice();
      const name = await getDisplayName();
      if (!name) {
        setShowFirstLaunch(true);
      }
      setReady(true);
    }
    init();
  }, []);

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="group/[groupId]" options={{ title: 'Group' }} />
        <Stack.Screen name="event/[eventId]" options={{ title: 'Event' }} />
      </Stack>
      <StatusBar style="auto" />
      {ready && (
        <FirstLaunchModal
          visible={showFirstLaunch}
          onDismiss={() => setShowFirstLaunch(false)}
        />
      )}
    </>
  );
}
