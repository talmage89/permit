import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@permit/deviceId';
const DISPLAY_NAME_KEY = '@permit/displayName';
const GROUPS_KEY = '@permit/groups';
const CHILDREN_KEY = '@permit/children';

export interface StoredGroup {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
}

export interface StoredChild {
  id: string;
  name: string;
  birthdate?: string;
  allergies?: string;
  notes?: string;
}

export async function getDeviceId(): Promise<string | null> {
  return AsyncStorage.getItem(DEVICE_ID_KEY);
}

export async function setDeviceId(id: string): Promise<void> {
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
}

export async function getDisplayName(): Promise<string> {
  return (await AsyncStorage.getItem(DISPLAY_NAME_KEY)) ?? '';
}

export async function setDisplayName(name: string): Promise<void> {
  await AsyncStorage.setItem(DISPLAY_NAME_KEY, name);
}

export async function getGroups(): Promise<StoredGroup[]> {
  const raw = await AsyncStorage.getItem(GROUPS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveGroup(group: StoredGroup): Promise<void> {
  const groups = await getGroups();
  const idx = groups.findIndex((g) => g.id === group.id);
  if (idx >= 0) {
    groups[idx] = group;
  } else {
    groups.push(group);
  }
  await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

export async function getChildren(): Promise<StoredChild[]> {
  const raw = await AsyncStorage.getItem(CHILDREN_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveChildren(children: StoredChild[]): Promise<void> {
  await AsyncStorage.setItem(CHILDREN_KEY, JSON.stringify(children));
}

export async function removeGroup(groupId: string): Promise<void> {
  const groups = await getGroups();
  await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(groups.filter((g) => g.id !== groupId)));
}
