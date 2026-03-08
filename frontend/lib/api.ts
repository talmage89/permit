import Constants from 'expo-constants';

const BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:8080';

let _deviceId: string = '';

export function setApiDeviceId(id: string): void {
  _deviceId = id;
}

// ---- Types ----

export interface Device {
  id: string;
  display_name: string;
  push_token?: string;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  device_id: string;
  name: string;
  birthdate?: string;
  allergies?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  join_code: string;
  created_by_device_id?: string;
  created_at: string;
}

export interface Event {
  id: string;
  group_id: string;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  rsvp_deadline?: string;
  created_by_device_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  child_id: string;
  device_id: string;
  info_updated: boolean;
  registered_at: string;
  child?: Child;
}

// ---- HTTP helper ----

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (_deviceId) {
    headers['X-Device-ID'] = _deviceId;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return data as T;
}

// ---- API surface ----

export const api = {
  devices: {
    create: (): Promise<Device> => request('POST', '/api/v1/devices'),
    update: (
      deviceId: string,
      payload: { display_name?: string; push_token?: string },
    ): Promise<Device> => request('PUT', `/api/v1/devices/${deviceId}`, payload),
  },

  children: {
    list: (deviceId: string): Promise<Child[]> =>
      request('GET', `/api/v1/devices/${deviceId}/children`),
    create: (
      deviceId: string,
      payload: { name: string; birthdate?: string; allergies?: string; notes?: string },
    ): Promise<Child> => request('POST', `/api/v1/devices/${deviceId}/children`, payload),
    update: (
      deviceId: string,
      childId: string,
      payload: { name: string; birthdate?: string; allergies?: string; notes?: string },
    ): Promise<Child> => request('PUT', `/api/v1/devices/${deviceId}/children/${childId}`, payload),
    delete: (deviceId: string, childId: string): Promise<void> =>
      request('DELETE', `/api/v1/devices/${deviceId}/children/${childId}`),
  },

  groups: {
    create: (payload: { name: string; password: string }): Promise<Group> =>
      request('POST', '/api/v1/groups', payload),
    join: (payload: { join_code: string; password: string }): Promise<Group> =>
      request('POST', '/api/v1/groups/join', payload),
    listForDevice: (deviceId: string): Promise<Group[]> =>
      request('GET', `/api/v1/devices/${deviceId}/groups`),
    get: (groupId: string): Promise<Group> => request('GET', `/api/v1/groups/${groupId}`),
    leave: (groupId: string): Promise<void> =>
      request('DELETE', `/api/v1/groups/${groupId}/leave`),
  },

  events: {
    list: (groupId: string): Promise<Event[]> =>
      request('GET', `/api/v1/groups/${groupId}/events`),
    create: (
      groupId: string,
      payload: {
        title: string;
        description?: string;
        event_date: string;
        location?: string;
        rsvp_deadline?: string;
      },
    ): Promise<Event> => request('POST', `/api/v1/groups/${groupId}/events`, payload),
    get: (groupId: string, eventId: string): Promise<Event> =>
      request('GET', `/api/v1/groups/${groupId}/events/${eventId}`),
    update: (
      groupId: string,
      eventId: string,
      payload: {
        title: string;
        description?: string;
        event_date: string;
        location?: string;
        rsvp_deadline?: string;
      },
    ): Promise<Event> => request('PUT', `/api/v1/groups/${groupId}/events/${eventId}`, payload),
    delete: (groupId: string, eventId: string): Promise<void> =>
      request('DELETE', `/api/v1/groups/${groupId}/events/${eventId}`),
  },

  registrations: {
    register: (
      eventId: string,
      payload: { child_id: string; info_updated?: boolean },
    ): Promise<Registration> => request('POST', `/api/v1/events/${eventId}/register`, payload),
    unregister: (eventId: string, childId: string): Promise<void> =>
      request('DELETE', `/api/v1/events/${eventId}/register/${childId}`),
    listAll: (eventId: string): Promise<Registration[]> =>
      request('GET', `/api/v1/events/${eventId}/registrations`),
    listForDevice: (eventId: string, deviceId: string): Promise<Registration[]> =>
      request('GET', `/api/v1/events/${eventId}/registrations/${deviceId}`),
  },
};
