/**
 * Email action subsystem: provider-agnostic delivery abstraction plus a service
 * that generates Firebase auth action links via the Admin SDK. Sending is not
 * implemented yet — only the abstraction is prepared.
 */
export * from './providers.js';
export * from './email-action-service.js';
