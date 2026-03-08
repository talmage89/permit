import * as Crypto from 'expo-crypto';
import { api, setApiDeviceId } from './api';
import { getDeviceId, setDeviceId } from './storage';
import { registerForPushNotifications } from './notifications';

/**
 * Ensures a device ID exists locally. On first launch, registers with the
 * backend and stores the returned UUID locally. On subsequent launches,
 * loads the stored UUID and configures the API client.
 *
 * Returns the device ID.
 */
export async function initDevice(): Promise<string> {
  const stored = await getDeviceId();
  if (stored) {
    setApiDeviceId(stored);
    return stored;
  }

  // First launch: register with backend
  try {
    const device = await api.devices.create();
    await setDeviceId(device.id);
    setApiDeviceId(device.id);
    return device.id;
  } catch (err) {
    // Fallback: generate a local UUID if the backend is unreachable
    const id = Crypto.randomUUID();
    await setDeviceId(id);
    setApiDeviceId(id);
    return id;
  }
}

/**
 * Registers for push notifications and uploads the token to the backend.
 * Returns the token string, or null if unavailable/denied.
 */
export async function syncPushToken(): Promise<string | null> {
  const deviceId = await getDeviceId();
  if (!deviceId) return null;

  const token = await registerForPushNotifications();
  if (token) {
    try {
      await api.devices.update(deviceId, { push_token: token });
    } catch {
      // Non-fatal: token sync failure doesn't break the app
    }
  }
  return token;
}
