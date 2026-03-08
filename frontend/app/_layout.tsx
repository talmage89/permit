import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { initDevice, syncPushToken } from '../lib/device';
import { getDisplayName } from '../lib/storage';
import { useTheme, useIsDark } from '../lib/theme';
import FirstLaunchModal from '../components/FirstLaunchModal';

export default function RootLayout() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = useIsDark();
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
      syncPushToken().catch(() => {});
    }
    init();

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
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.navBg },
          headerTintColor: theme.accent,
          headerTitleStyle: { color: theme.text, fontWeight: '600' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="group/[groupId]" options={{ title: 'Group', headerBackTitle: 'Groups' }} />
        <Stack.Screen name="event/[eventId]" options={{ title: 'Event', headerBackTitle: 'Back' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {ready && (
        <FirstLaunchModal
          visible={showFirstLaunch}
          onDismiss={() => setShowFirstLaunch(false)}
        />
      )}
    </>
  );
}
