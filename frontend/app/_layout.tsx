import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { initDevice, syncPushToken } from '../lib/device';
import { getDisplayName } from '../lib/storage';
import FirstLaunchModal from '../components/FirstLaunchModal';

export default function RootLayout() {
  const router = useRouter();
  const [showFirstLaunch, setShowFirstLaunch] = useState(false);
  const [ready, setReady] = useState(false);
  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    async function init() {
      await initDevice();
      const name = await getDisplayName();
      if (!name) {
        setShowFirstLaunch(true);
      }
      setReady(true);
      // Request push permission and upload token in background (non-blocking)
      syncPushToken().catch(() => {});
    }
    init();

    // Handle notification taps to navigate to the relevant event
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, string> | undefined;
        if (data?.eventId && data?.groupId) {
          router.push(`/event/${data.eventId}?groupId=${data.groupId}`);
        } else if (data?.eventId) {
          router.push(`/event/${data.eventId}`);
        }
      });

    return () => {
      notificationResponseListener.current?.remove();
    };
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
