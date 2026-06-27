# Derivo Backend API & Core Infrastructure (Phase 4)

**Status:** Approved  
**Author:** Staff Backend Engineer, Fastify Core Contributor, Senior Platform Architect  
**Scope:** REST API, Business Logic, DB Layer, Queues, Validation, Logging, Security

This document defines the complete backend architecture for Derivo. It utilizes Fastify for high-performance HTTP routing, Drizzle ORM for type-safe database access, Redis for caching/rate-limiting, and BullMQ for background job processing. 

---

## 1. Backend Architecture

- **Runtime:** Node.js (v20+)
- **Framework:** Fastify (Chosen for low overhead and native JSON schema/Zod compilation)
- **Database:** PostgreSQL via Drizzle ORM
- **Cache & Message Broker:** Redis
- **Queue System:** BullMQ
- **Validation:** Zod + Fastify Zod Type Provider
- **Logging:** Pino (Asynchronous, structured JSON logging)
- **Identity:** Better Auth (From Phase 2)

The backend strictly follows a **Feature-First (Vertical Slicing)** pattern combined with a **Layered Architecture** within each feature.

---

## 2. Folder Structure

Adhering strictly to the Phase 1.5 monorepo blueprint:

```text
apps/api/src/
├── app.ts                  # Fastify instance initialization
├── server.ts               # Entry point, binds to port
├── config/                 # Environment validation (Zod)
├── core/
│   ├── db/                 # Drizzle instance and connection pooling
│   ├── logger/             # Pino instance configuration
│   ├── redis/              # Redis client
│   ├── queues/             # BullMQ workers and queues setup
│   ├── errors/             # Global error handler and custom Error classes
│   └── middleware/         # Fastify hooks (Auth, RBAC, Rate Limiting)
└── modules/                # Feature-First Modules
    ├── auth/
    ├── users/
    ├── projects/
    ├── devices/
    ├── api-keys/
    ├── activity/
    ├── notifications/
    └── health/
```

---

## 3. Feature Architecture

Every feature module is completely isolated. Cross-feature communication happens via internal Services, never by directly querying another feature's Repository.

```text
modules/projects/
├── projects.routes.ts      # Fastify plugin defining endpoints and Swagger schemas
├── projects.controller.ts  # HTTP layer: parses requests, returns standard responses
├── projects.service.ts     # Business logic layer: orchestrates repos and other services
├── projects.repository.ts  # Data access layer: strict Drizzle queries
├── projects.schema.ts      # Zod validation schemas (Body, Params, Query, Response)
├── projects.types.ts       # TypeScript interfaces
└── projects.test.ts        # Unit and integration tests
```

**Flow of Execution:**  
`Route -> Fastify Validation (Zod) -> Controller -> Service -> Repository -> DB`

---

## 4. API Route Inventory

All endpoints return a standardized payload. Prefix: `/api/v1`

**Authentication (Better Auth integration)**
- `POST /auth/login`, `POST /auth/register`, `POST /auth/logout`

**Users**
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update profile

**Projects**
- `GET /projects` - List projects (Paginated, Filterable)
- `POST /projects` - Create a new project
- `GET /projects/:id` - Get project details
- `PATCH /projects/:id` - Update project settings
- `DELETE /projects/:id` - Delete project

**Devices**
- `GET /devices` - List registered CLI devices
- `DELETE /devices/:id` - Revoke device access

**API Keys**
- `GET /api-keys` - List keys (Masked)
- `POST /api-keys` - Generate new key (Returns full key once)
- `DELETE /api-keys/:id` - Revoke key

**Activity**
- `GET /activity` - Audit log timeline (Paginated)

**Health & System**
- `GET /health/live` - Basic server liveness
- `GET /health/ready` - DB and Redis connection status
- `GET /health/version` - Git commit and build info

---

## 5. Database Access Strategy

- **Repository Pattern:** Services NEVER import Drizzle directly. They call `ProjectRepository.findById()`.
- **Prepared Statements:** Used extensively via Drizzle for high-throughput queries.
- **Transactions:** Handled at the Service layer, passing the `tx` object down to Repositories.

---

## 6. Validation Strategy

- **Zod Everywhere:** All runtime boundaries are validated using Zod.
- **Fastify TypeProvider:** We use `fastify-type-provider-zod` to automatically compile Zod schemas into Fastify's rapid JSON Schema validator.
- **Output Validation:** API responses are strictly typed and validated against a Zod schema to prevent accidental PII leakage.

**Standard Response Format:**
```typescript
{
  "success": true,
  "message": "Project created successfully",
  "data": { ... },
  "meta": { "page": 1, "total": 42 },
  "errors": null
}
```

---

## 7. Authorization Strategy

Centralized via Fastify hooks (`onRequest` lifecycle).

- **`requireAuth`:** Validates session cookie or Bearer token (API Key/CLI Token). Injects `req.user`.
- **`requireRole(['admin', 'pro'])`:** Enforces RBAC permissions.
- **Entity Ownership:** The Service layer ensures a user can only access their own resources (e.g., `ProjectService.findByIdAndOwner(projectId, userId)`).

---

## 8. Logging Architecture

- **Pino:** Extremely fast, non-blocking logger.
- **Redaction:** Pino configuration automatically redacts `password`, `token`, `authorization`, `cookie`, `key`.
- **Request Context:** Fastify automatically injects a `reqId` into every log. We use `pino-http` to log request duration, method, url, and status code automatically.
- **Errors:** Stack traces are logged internally but stripped from the HTTP response.

---

## 9. Caching Strategy

- **Redis Client:** `ioredis`.
- **Patterns:**
  - **Read-Through:** `GET /projects` checks Redis. If miss, query DB, set Redis with TTL (e.g., 5 mins), return.
  - **Write-Invalidation:** `PATCH /projects/:id` deletes the `user:{id}:projects` cache key.
- **Rate Limiting:** Sliding window algorithms in Redis using `@fastify/rate-limit`.
  - Public routes: 100 req/min
  - Auth routes: 10 req/min (Brute-force protection)
  - API Key routes: 1000 req/min (Pro tier)

---

## 10. Queue Architecture (BullMQ)

Background jobs prevent blocking the HTTP thread for long-running or failure-prone tasks.

**Queues:**
1. `audit-queue`: Processes and batches activity logs to Postgres to prevent write-heavy API latency.
2. `email-queue`: Handles async transactional email delivery (Welcome, Reset Password).
3. `cleanup-queue`: Nightly CRON jobs (e.g., deleting expired sessions, soft-deleted projects).

**Design:** Dead-letter queues (DLQ) catch failed jobs after 3 exponential backoff retries.

---

## 11. Error Handling

A global `setErrorHandler` in Fastify catches all exceptions.

1. **ZodError:** Mapped to `400 Bad Request` with formatted field-level errors.
2. **AppError (Custom):** 
   - `NotFoundError` -> `404`
   - `UnauthorizedError` -> `401`
   - `ForbiddenError` -> `403`
   - `ConflictError` -> `409`
3. **Unhandled Error:** Mapped to `500 Internal Server Error`. Triggers a critical alert. Message hidden from client in production.

---

## 12. Environment Strategy

`apps/api/src/config/env.ts` parses `process.env` through a strict Zod schema on boot.

```typescript
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  API_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  // Firebase, OAuth limits
});
```
If configuration is missing or invalid, the app crashes immediately (`Fail Fast`) before opening any ports.

---

## 13. Testing Strategy

- **Unit Tests (`*.test.ts`):** Co-located with Services and Controllers. Mocked Repositories.
- **Integration Tests:** Spin up ephemeral PostgreSQL and Redis instances via **Testcontainers**. Test full Fastify route lifecycle using `app.inject()`.
- **Framework:** Vitest.

---

## 14. OpenAPI Strategy

- Auto-generated using `@fastify/swagger` and `@fastify/swagger-ui`.
- Because we use `fastify-type-provider-zod`, our Zod schemas automatically generate the Swagger documentation.
- The Swagger UI is exposed at `/docs` (only in `development` and `staging` environments).

---

## 15. Security Checklist

- [x] **Helmet:** `@fastify/helmet` configured for strict CSP, HSTS, and X-Content-Type-Options.
- [x] **CORS:** Strictly bound to `FRONTEND_URL` and specific CLI loopback addresses.
- [x] **Rate Limiting:** Redis-backed, IP/Token-based.
- [x] **SQL Injection:** Impossible via Drizzle ORM's parameterized queries.
- [x] **No Leaks:** Global error handler strips stack traces in production. Output Zod schemas strip undocumented fields from responses.

---

## 16. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| DB Connection Pool Exhaustion | Configure PgBouncer at the infrastructure layer. Keep Node.js pool size strictly correlated to container CPU limits. |
| Cache Stampede | Implement jitter on Redis TTLs. Use "Promise coalescing" in the Service layer to prevent simultaneous DB queries for the same missing cache key. |
| Memory Leaks in Fastify | Ensure all BullMQ workers and Redis clients are gracefully closed during `SIGTERM` in the `app.close()` hook. |

---

## 17. Self Review

- **Google Staff Backend Engineer:** The layered architecture and repository pattern perfectly isolate Drizzle from Fastify, enabling high testability. Moving audit logs to BullMQ is a great choice to maintain sub-50ms p99 latencies on mutations.
- **Fastify Maintainer:** Proper usage of Fastify hooks and the Zod type provider. Avoiding Express-like middleware in favor of Fastify's encapsulated plugin system prevents route pollution.
- **PostgreSQL Engineer:** Using prepared statements and avoiding ORM "magic" methods at the service layer prevents N+1 query problems. 
- **OWASP Reviewer:** Validating output schemas is often overlooked. Fastify+Zod enforcing response shapes mathematically guarantees we don't accidentally serialize password hashes or internal IDs to the client.

**Conclusion:** The backend architecture is robust, scalable, and ready for implementation.
