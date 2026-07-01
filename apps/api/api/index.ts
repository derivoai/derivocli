/**
 * Vercel serverless entry point.
 *
 * Vercel injects environment variables directly — no .env file needed.
 * The app is exported as a handler; Vercel calls it without listen().
 */
import { createApp } from '../src/app.js';
import { initFirebase } from '../src/firebase.js';

// Bootstrap Firebase once on cold start
initFirebase();

// Export Express app — Vercel wraps it automatically
export default createApp();
