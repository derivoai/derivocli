import './load-env';
import { createApp } from './app.js';
import { initFirebase, isAdminInitialized } from './firebase.js';

const port = Number(process.env.PORT || 3001);

// ─── Firebase Admin bootstrap ────────────────────────────────────────────────
const { initialized, missing } = initFirebase();
if (initialized) {
  console.log('✅ Firebase Admin initialized successfully');
} else {
  console.log('ℹ️  Firebase Admin not configured — running in MOCK MODE.');
  console.log(`   Missing env var(s): ${missing.join(', ')}`);
  console.log('   In mock mode the API accepts ANY token and treats users as subscribed.');
}

// Safety guard: a production/hosted backend must NEVER run open.
if (
  !isAdminInitialized() &&
  (process.env.DERIVO_REQUIRE_FIREBASE === '1' || process.env.NODE_ENV === 'production')
) {
  console.error('🛑 Refusing to start in mock mode: Firebase Admin credentials are required.');
  console.error(`   Set: ${missing.join(', ')}`);
  process.exit(1);
}

const app = createApp();
app.listen(port, () => {
  console.log(`🚀 API server running at http://localhost:${port}`);
});
