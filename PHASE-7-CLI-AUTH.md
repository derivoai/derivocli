# Derivo CLI Authentication & Cloud Integration (Phase 7)

**Status:** Approved  
**Author:** Google Security Engineer, Better Auth contributor, OAuth 2.0 expert  
**Scope:** CLI Authentication, Device Trust, Secure Storage, and Cloud Synchronization

This document defines the architecture for securely connecting the Derivo CLI to the cloud. It standardizes the OAuth 2.0 Device Flow, ensures secrets are kept strictly within OS-level secure enclaves, and details the synchronization of licenses and feature flags for offline capability.

---

## 1. Authentication Architecture

The CLI uses the **OAuth 2.0 Device Authorization Grant (RFC 8628)**. This eliminates the need for embedded secrets or handling passwords within the CLI. 

- **Primary Auth Flow:** Device Code + Polling.
- **Tokens:** Access Token (short-lived, JWT-based) and Refresh Token (long-lived, opaque or encrypted).
- **Secure Storage:** Tokens and licenses are stored exclusively in the host OS's native secure credential store. No plaintext `.derivo-token` files.
- **Offline Capability:** CLI validates cached licenses cryptographically for up to 30 days.

---

## 2. OAuth Device Flow

The authentication process strictly follows the Device Grant sequence:

1. **Initiate (`derivo login`):** CLI calls `POST /api/v1/auth/device` requesting a code.
2. **Response:** Backend returns `device_code`, `user_code`, `verification_uri`, and `expires_in`.
3. **User Action:** CLI automatically attempts to open `verification_uri` in the user's default browser and instructs the user to approve the login.
4. **Polling:** CLI calls `POST /api/v1/auth/token` with the `device_code` every 5 seconds (respecting `interval`).
5. **Approval:** User logs into the Web Dashboard and approves the `user_code`.
6. **Token Issuance:** Polling endpoint returns 200 OK with `access_token`, `refresh_token`, and device context.
7. **License Sync:** CLI immediately requests the user's license and feature flags using the new `access_token`.

---

## 3. Package Structure

To enforce separation of concerns, the workspace is expanded with the following packages:

```text
packages/
  ├── auth-client/       # Orchestrates the OAuth 2.0 Device Flow
  ├── device-manager/    # Fingerprints OS/CLI version for device trust
  ├── license-client/    # Fetches and validates offline JWT licenses
  ├── secure-storage/    # OS-level keychain/credential manager wrapper
  ├── cloud-client/      # Wrapper around fetch (ofetch) with retries/timeouts
  └── session-manager/   # Handles refresh token rotation and session lifecycle
```

---

## 4. Folder Structure (auth-client Example)

```text
packages/auth-client/
├── src/
│   ├── index.ts
│   ├── oauth.ts           # Implementation of RFC 8628 (Device Code & Token Polling)
│   ├── pkce.ts            # (Optional) PKCE for future flows
│   ├── errors.ts          # Specific OAuth errors (authorization_pending, slow_down)
│   └── types.ts           # Interfaces for token responses
└── package.json
```

---

## 5. Device Trust Model

When a user logs in, the `device-manager` sends fingerprint data to the backend to register the device.

**Data Collected:**
- `Device ID:` UUID generated on first run.
- `Hostname:` `os.hostname()`
- `Platform:` `os.platform()` / `os.release()`
- `Architecture:` `os.arch()`
- `CLI Version:` Version from package.json.

**Trust Lifecycle:**
- Devices appear in the Dashboard.
- Users can revoke a device remotely.
- Revocation invalidates the Refresh Token server-side, forcing a logout on the next CLI request or License Sync.

---

## 6. Session Management

The `session-manager` package is responsible for maintaining the authentication state.

- **Storage:** Stores the active session context (user email, plan tier) in memory, and sensitive tokens via `secure-storage`.
- **Refresh Rotation:** Automatically intercepts 401 Unauthorized responses in `cloud-client` and attempts to rotate the refresh token before retrying the original request.
- **Logout:** `derivo logout` deletes tokens from secure storage and calls `POST /api/v1/auth/logout` to invalidate the session server-side.

---

## 7. Secure Storage Strategy

The `secure-storage` package uses `keytar` to interact natively with OS credential stores.

- **macOS:** Keychain Access
- **Windows:** Credential Manager
- **Linux:** Secret Service API (via libsecret) / GNOME Keyring

**Service Name:** `derivo-cli`
**Keys Stored:**
- `access_token`
- `refresh_token`
- `license_token`

*The CLI never accesses OS APIs directly. It only calls `SecureStorage.set('refresh_token', value)`.*

---

## 8. License Synchronization

The `license-client` handles feature gating.

- **Format:** The license is a digitally signed JWT (signed by the Derivo backend private key).
- **Embedded Key:** The CLI contains the backend's public key to verify the signature offline.
- **Offline Limits:** The `exp` claim on the License JWT is set to 30 days. If the CLI is offline for longer, the license expires.
- **Community Fallback:** If the license is expired, the CLI falls back to Community features without blocking the developer's core workflow.

**Feature Flag Checks:**
```typescript
if (!LicenseClient.canUseCloudSync()) {
  TerminalUI.warn('Cloud sync requires a Pro plan. Upgrade at https://app.derivo.dev/billing');
}
```

---

## 9. API Contracts

- `POST /api/v1/auth/device`
  - *Response:* `{ device_code, user_code, verification_uri, expires_in, interval }`
- `POST /api/v1/auth/token`
  - *Request:* `{ grant_type: "urn:ietf:params:oauth:grant-type:device_code", device_code, client_id }`
  - *Response:* `{ access_token, refresh_token, expires_in }` (or `400 Bad Request` with `authorization_pending`)
- `GET /api/v1/billing/license`
  - *Response:* `{ license_jwt: "ey..." }`

---

## 10. Error Handling

- **Offline / Network Timeout:** `cloud-client` automatically retries 3 times with exponential backoff before surfacing a clean `NetworkError`.
- **Expired Token:** Handled transparently by `session-manager` refresh logic.
- **Revoked Token / Device Removed:** Returns `SessionExpiredError`. CLI prompts user to run `derivo login` again.
- **License Expired:** Returns `LicenseExpiredError`. CLI prompts for network sync.

---

## 11. Testing Strategy

- **Secure Storage:** Mock `keytar` using an in-memory Map to avoid writing to the developer's actual keychain during CI/CD.
- **OAuth Flow:** Mock the backend endpoints. Ensure the polling mechanism respects the `interval` and handles `authorization_pending` correctly.
- **Refresh Flow:** Use interceptors (e.g., `nock` or `msw`) to simulate a 401 response and verify that `session-manager` transparently requests a new token and retries the call.

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Missing `libsecret` on Linux | Fallback to an encrypted local file (using a machine-specific key) if native secure storage fails to initialize. Warn the user. |
| Time-of-check to Time-of-use (TOCTOU) | Ensure feature flag checks and actual API calls are tightly coupled. Backend API always re-verifies entitlements on every request regardless of the CLI's internal license state. |
| Replay Attacks | Employ CSRF protection and strictly bind `device_code` to the initial IP address and User-Agent if possible. |

---

## 13. Self Review

- **Google Security Engineer:** The Device Authorization Grant is the industry standard for CLI tools (used by GitHub CLI, Vercel CLI). Relying on OS Keychains prevents token harvesting from `.dotfiles`.
- **Better Auth Maintainer:** This perfectly complements the Better Auth backend implemented in Phase 2. The CLI is just another OAuth client requesting scopes.
- **OAuth Security Expert:** Polling intervals must be strictly enforced. If the backend returns a `slow_down` error, the CLI must increase the polling interval to avoid rate-limit bans. The architecture accounts for this.

**Conclusion:** The CLI Authentication architecture provides a highly secure, offline-capable foundation. Ready for implementation.
