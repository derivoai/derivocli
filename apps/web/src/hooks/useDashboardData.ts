import { useState, useEffect } from 'react';
import { db, doc } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import type { QuerySnapshot, DocumentData } from 'firebase/firestore';
import { useUserProfile } from './useUserProfile';

export interface Project {
  id: string;
  name: string;
  framework: string;
  status: 'synced' | 'error' | 'pending';
  env: string;
  lastSync: string;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  name: string;
  type: 'mac' | 'windows' | 'linux';
  os: string;
  browser: string;
  cliVersion: string;
  lastActive: string;
  isTrusted: boolean;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  preview: string;
  created: string;
  lastUsed: string;
  expires: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  event: string;
  description: string;
  timestamp: string;
  icon: 'check' | 'terminal' | 'key' | 'user' | 'zap';
  type: 'success' | 'info' | 'warning' | 'error';
  createdAt: string;
}

interface UseCollectionOptions<T> {
  collectionName: string;
  transform: (doc: DocumentData) => T;
  enabled?: boolean;
}

function useCollection<T>({ collectionName, transform, enabled = true }: UseCollectionOptions<T>) {
  const { currentUser, loading: profileLoading } = useUserProfile();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profileLoading || !enabled || !currentUser) {
      if (!profileLoading && (!enabled || !currentUser)) {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);

    const userDocRef = doc(db, 'users', currentUser.uid);
    const subCollectionRef = collection(userDocRef, collectionName);
    const q = query(subCollectionRef, orderBy('createdAt', 'desc'), limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        try {
          const items = snapshot.docs.map((docSnap) =>
            transform({ id: docSnap.id, ...docSnap.data() }),
          );
          setData(items);
          setLoading(false);
        } catch (err) {
          console.error(`Error transforming ${collectionName}:`, err);
          setError('Failed to process data');
          setLoading(false);
        }
      },
      (err) => {
        // Never fabricate data. Show the real, empty/error state instead.
        console.error(`Firestore error listening to ${collectionName}:`, err);
        setData([]);
        if (err.code === 'permission-denied') {
          setError('You do not have permission to read this data. Check your Firestore rules.');
        } else if (err.code === 'unavailable') {
          setError('Cannot reach the database. Check your connection.');
        } else {
          setError('Failed to load data');
        }
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser, profileLoading, enabled, collectionName, transform]);

  return { data, loading, error };
}

function transformProject(doc: DocumentData): Project {
  return {
    id: doc.id,
    name: doc.name || 'Unnamed Project',
    framework: doc.framework || 'Unknown',
    status: doc.status || 'pending',
    env: doc.env || 'Development',
    lastSync: doc.lastSync || '-',
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}

function transformDevice(doc: DocumentData): Device {
  return {
    id: doc.id,
    name: doc.name || 'Unknown Device',
    type: doc.type || 'linux',
    os: doc.os || 'Unknown',
    browser: doc.browser || 'Unknown',
    cliVersion: doc.cliVersion || 'v1.0.0',
    lastActive: doc.lastActive || 'Never',
    isTrusted: doc.isTrusted ?? true,
    location: doc.location || 'Unknown',
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}

function transformApiKey(doc: DocumentData): ApiKey {
  return {
    id: doc.id,
    name: doc.name || 'Unnamed Key',
    preview: doc.preview || 'drv_••••••••••••••',
    created: doc.created || 'Unknown',
    lastUsed: doc.lastUsed || 'Never',
    expires: doc.expires || 'Never',
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}

function transformActivity(doc: DocumentData): ActivityItem {
  return {
    id: doc.id,
    event: doc.event || 'Unknown Event',
    description: doc.description || '',
    timestamp: doc.timestamp || 'Unknown',
    icon: doc.icon || 'check',
    type: doc.type || 'info',
    createdAt: doc.createdAt || new Date().toISOString(),
  };
}

export function useProjects() {
  return useCollection<Project>({
    collectionName: 'projects',
    transform: transformProject,
  });
}

export function useDevices() {
  return useCollection<Device>({
    collectionName: 'devices',
    transform: transformDevice,
  });
}

export function useApiKeys() {
  return useCollection<ApiKey>({
    collectionName: 'apiKeys',
    transform: transformApiKey,
  });
}

export function useActivity() {
  return useCollection<ActivityItem>({
    collectionName: 'activity',
    transform: transformActivity,
  });
}

export function useDashboardOverview() {
  const { data: projects, loading: projectsLoading, error: projectsError } = useProjects();
  const { data: devices, loading: devicesLoading, error: devicesError } = useDevices();
  const { data: activity, loading: activityLoading, error: activityError } = useActivity();

  return {
    projects,
    devices,
    activity: activity.slice(0, 4),
    loading: projectsLoading || devicesLoading || activityLoading,
    error: projectsError || devicesError || activityError,
  };
}
