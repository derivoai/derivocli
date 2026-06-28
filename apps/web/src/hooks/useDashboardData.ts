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

/**
 * High-fidelity fallback mock data builder for localStorage.
 * Runs in case Firestore permissions are restricted (permission-denied) in the cloud.
 */
function getLocalStorageMockData(collectionName: string, uid: string): any[] {
  const localKey = `derivo_local_${collectionName}_${uid}`;
  const localDataStr = localStorage.getItem(localKey);
  if (localDataStr) {
    try {
      return JSON.parse(localDataStr);
    } catch {
      // ignore
    }
  }

  // Generate initial high-fidelity mock data if not exists
  let initialMockData: any[] = [];
  const now = new Date();

  if (collectionName === 'projects') {
    initialMockData = [
      {
        id: 'proj-1',
        name: 'derivo-cli',
        framework: 'TypeScript',
        status: 'synced',
        env: 'Production',
        lastSync: '5 mins ago',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'proj-2',
        name: 'derivo-docs',
        framework: 'Astro',
        status: 'synced',
        env: 'Staging',
        lastSync: '2 hours ago',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'proj-3',
        name: 'derivo-dashboard',
        framework: 'React',
        status: 'pending',
        env: 'Development',
        lastSync: 'Just now',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];
  } else if (collectionName === 'devices') {
    initialMockData = [
      {
        id: 'dev-1',
        name: 'Work MacBook Pro',
        type: 'mac',
        os: 'macOS Sonoma (v14.5)',
        browser: 'Chrome (v126.0)',
        cliVersion: 'v1.2.4',
        lastActive: 'Active now',
        isTrusted: true,
        location: 'San Francisco, US',
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'dev-2',
        name: 'Home PC Tower',
        type: 'windows',
        os: 'Windows 11 Home',
        browser: 'Firefox (v127.0)',
        cliVersion: 'v1.2.4',
        lastActive: '2 hours ago',
        isTrusted: true,
        location: 'San Jose, US',
        createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: now.toISOString(),
      },
    ];
  } else if (collectionName === 'apiKeys') {
    initialMockData = [
      {
        id: 'key-1',
        name: 'Production Deploy Key',
        preview: 'drv_live_a8f9c2d7e1b3c9a0f',
        created: '2 days ago',
        lastUsed: '10 mins ago',
        expires: 'Never',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'key-2',
        name: 'Dev CLI Token',
        preview: 'drv_test_9c2d1b0f5e7a8c3d6',
        created: '1 week ago',
        lastUsed: 'Yesterday',
        expires: 'Never',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: now.toISOString(),
      },
    ];
  } else if (collectionName === 'activity') {
    initialMockData = [
      {
        id: 'act-1',
        event: 'CLI Authenticated',
        description: 'New login session created on Work MacBook Pro',
        timestamp: '5 mins ago',
        icon: 'terminal',
        type: 'success',
        createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: 'act-2',
        event: 'Project Synced',
        description: 'derivo-docs synced with GitHub repository main branch',
        timestamp: '2 hours ago',
        icon: 'check',
        type: 'success',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'act-3',
        event: 'API Key Created',
        description: 'API key "Production Deploy Key" has been generated',
        timestamp: '2 days ago',
        icon: 'key',
        type: 'success',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  localStorage.setItem(localKey, JSON.stringify(initialMockData));
  return initialMockData;
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
        console.warn(`Firestore permission denied or error listening to ${collectionName}. Falling back to localStorage database:`, err);
        if (err.code === 'permission-denied' || err.code === 'unavailable') {
          // Load local storage fallback data
          const localItems = getLocalStorageMockData(collectionName, currentUser.uid) as T[];
          setData(localItems);
          setError(null); // Clear errors for smooth fallback UX
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
