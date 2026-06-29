/**
 * Firebase Admin bootstrap — the trusted server-side gateway to Firestore/Auth.
 *
 * The Admin SDK bypasses Firestore Security Rules, so ALL access here must be
 * preceded by authentication + authorization middleware.
 */
import admin from 'firebase-admin';

let initialized = false;

export interface FirebaseInitResult {
  initialized: boolean;
  missing: string[];
}

export function initFirebase(): FirebaseInitResult {
  const status = {
    FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
  };
  const missing = Object.entries(status)
    .filter(([, present]) => !present)
    .map(([name]) => name);

  if (missing.length > 0) return { initialized: false, missing };

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    });
  }
  initialized = true;
  return { initialized: true, missing: [] };
}

export function isAdminInitialized(): boolean {
  return initialized;
}

/** Allow tests to toggle mock vs strict mode deterministically. */
export function setInitializedForTesting(value: boolean): void {
  initialized = value;
}

export function getAdmin(): typeof admin {
  return admin;
}

export function getDb(): admin.firestore.Firestore {
  return admin.firestore();
}
