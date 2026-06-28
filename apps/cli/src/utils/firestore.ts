import https from 'https';
import http from 'http';

const FIRESTORE_PROJECT_ID = 'derivo';

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  booleanValue?: boolean;
  mapValue?: { fields: Record<string, FirestoreValue> };
  arrayValue?: { values: FirestoreValue[] };
  timestampValue?: string;
  nullValue?: null;
}

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (value instanceof Date) return { stringValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    const fields: Record<string, FirestoreValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function fromFirestoreValue(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('mapValue' in value && value.mapValue) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value.mapValue.fields)) {
      result[k] = fromFirestoreValue(v);
    }
    return result;
  }
  if ('arrayValue' in value && value.arrayValue) {
    return (value.arrayValue.values || []).map(fromFirestoreValue);
  }
  return null;
}

function request(
  url: string,
  method: string,
  token: string,
  body?: unknown,
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const transport = isHttps ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', (chunk: string) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 500, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode || 500, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Create a document in a Firestore subcollection under the user's document.
 * Path: users/{uid}/{collectionName}/{documentId}
 */
export async function createDocument(
  token: string,
  uid: string,
  collectionName: string,
  documentId: string,
  data: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [key, value] of Object.entries(data)) {
    fields[key] = toFirestoreValue(value);
  }

  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/users/${uid}/${collectionName}?documentId=${documentId}`;

  try {
    const response = await request(url, 'POST', token, { fields });

    if (response.status === 200 || response.status === 201) {
      return { success: true };
    }

    if (response.status === 409) {
      return { success: false, error: 'Document already exists' };
    }

    const errorMessage = response.data?.error?.message || `HTTP ${response.status}`;
    return { success: false, error: errorMessage };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Check if a document exists in Firestore.
 */
export async function getDocument(
  token: string,
  uid: string,
  collectionName: string,
  documentId: string,
): Promise<{ exists: boolean; data?: Record<string, unknown>; error?: string }> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/users/${uid}/${collectionName}/${documentId}`;

  try {
    const response = await request(url, 'GET', token);

    if (response.status === 200) {
      const fields = response.data?.fields || {};
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(fields)) {
        result[k] = fromFirestoreValue(v as FirestoreValue);
      }
      return { exists: true, data: result };
    }

    if (response.status === 404) {
      return { exists: false };
    }

    return { exists: false, error: response.data?.error?.message || `HTTP ${response.status}` };
  } catch (err) {
    return { exists: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * List documents in a subcollection to check for duplicates by field value.
 */
export async function listDocuments(
  token: string,
  uid: string,
  collectionName: string,
): Promise<{ documents: Array<{ id: string; data: Record<string, unknown> }>; error?: string }> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/users/${uid}/${collectionName}?pageSize=100`;

  try {
    const response = await request(url, 'GET', token);

    if (response.status === 200) {
      const docs = response.data?.documents || [];
      return {
        documents: docs.map((doc: any) => {
          const nameParts = doc.name.split('/');
          const id = nameParts[nameParts.length - 1];
          const fields = doc.fields || {};
          const data: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(fields)) {
            data[k] = fromFirestoreValue(v as FirestoreValue);
          }
          return { id, data };
        }),
      };
    }

    if (response.status === 404) {
      return { documents: [] };
    }

    return { documents: [], error: response.data?.error?.message || `HTTP ${response.status}` };
  } catch (err) {
    return { documents: [], error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Delete a document in a Firestore subcollection under the user's document.
 * Path: users/{uid}/{collectionName}/{documentId}
 */
export async function deleteDocument(
  token: string,
  uid: string,
  collectionName: string,
  documentId: string,
): Promise<{ success: boolean; error?: string }> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/users/${uid}/${collectionName}/${documentId}`;

  try {
    const response = await request(url, 'DELETE', token);

    if (response.status === 200 || response.status === 204) {
      return { success: true };
    }

    return { success: false, error: response.data?.error?.message || `HTTP ${response.status}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Fetch a top-level collection document (like subscriptions/{uid})
 */
export async function getTopLevelDocument(
  token: string,
  collectionName: string,
  documentId: string,
): Promise<{ exists: boolean; data?: Record<string, unknown>; error?: string }> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/${collectionName}/${documentId}`;

  try {
    const response = await request(url, 'GET', token);

    if (response.status === 200) {
      const fields = response.data?.fields || {};
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(fields)) {
        result[k] = fromFirestoreValue(v as FirestoreValue);
      }
      return { exists: true, data: result };
    }

    if (response.status === 404) {
      return { exists: false };
    }

    return { exists: false, error: response.data?.error?.message || `HTTP ${response.status}` };
  } catch (err) {
    return { exists: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Update a document in a Firestore subcollection under the user's document.
 * Path: users/{uid}/{collectionName}/{documentId}
 */
export async function updateDocument(
  token: string,
  uid: string,
  collectionName: string,
  documentId: string,
  data: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  const fields: Record<string, FirestoreValue> = {};
  const updateMask: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    fields[key] = toFirestoreValue(value);
    updateMask.push(`updateMask.fieldPaths=${encodeURIComponent(key)}`);
  }

  const queryParams = updateMask.join('&');
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/users/${uid}/${collectionName}/${documentId}?${queryParams}`;

  try {
    const response = await request(url, 'PATCH', token, {
      name: `projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/users/${uid}/${collectionName}/${documentId}`,
      fields,
    });

    if (response.status === 200) {
      return { success: true };
    }

    const errorMessage = response.data?.error?.message || `HTTP ${response.status}`;
    return { success: false, error: errorMessage };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
