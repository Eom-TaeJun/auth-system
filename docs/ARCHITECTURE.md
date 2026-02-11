# Architecture

## Overview

`auth-system` is a monorepo with:

- Backend: Fastify + PostgreSQL (`backend`)
- Frontend: Next.js App Router (`frontend`)
- Shared contracts: TypeScript types (`contracts`)

The backend is the source of truth for identity and session state.  
The frontend keeps short-lived access tokens in memory and uses a refresh-cookie flow to rehydrate sessions.

## Backend Structure

- `src/index.ts`: app bootstrap, CORS/cookie/helmet/rate-limit middleware, route registration
- `src/routes/*.ts`: HTTP layer (validation + transport)
- `src/services/*.ts`: auth business logic
- `src/models/*.ts`: SQL persistence layer
- `src/middleware/*.ts`: access-token auth and centralized error handling
- `migrations/*.ts`: schema migration and rollback

## Frontend Structure

- `app/(auth)/*`: login/register/verify/forgot/reset pages
- `app/(protected)/*`: authenticated pages (`/dashboard`, `/profile`)
- `hooks/useAuth.tsx`: auth context and bootstrap logic
- `lib/api.ts`: axios client, auth header injection, 401 refresh retry
- `lib/authToken.ts`: in-memory access-token store

## Data Model

### `users`

- `id` UUID PK
- `email` unique
- `password_hash`
- `email_verified`
- `created_at`, `updated_at`

### `verification_tokens`

- `id` UUID PK
- `user_id` FK -> users
- `token` (SHA-256 hash of raw token)
- `token_type` (`email_verify` | `password_reset`)
- `expires_at`, `used_at`, `created_at`

### `refresh_tokens`

- `id` UUID PK
- `user_id` FK -> users
- `token_hash` (SHA-256)
- `expires_at`, `revoked_at`, `device_info`, `created_at`

## Auth Flow

### 1. Register

1. `POST /api/auth/register`
2. Backend validates email/password and stores hashed password
3. Backend creates email verification token (hashed in DB)
4. Verification email is sent

### 2. Login

1. `POST /api/auth/login`
2. Backend verifies credentials and email verification status
3. Backend returns:
   - access token in response body
   - refresh token in `httpOnly` cookie
4. Frontend stores access token in memory only

### 3. Protected API Access

1. Frontend sends `Authorization: Bearer <accessToken>`
2. Backend middleware validates JWT and injects `request.userId`

### 4. Access Token Refresh

1. On app bootstrap or 401 response, frontend calls `POST /api/auth/refresh`
2. Backend validates refresh cookie token hash
3. Backend issues new access token
4. Frontend retries original request with new token

## Security Controls

- Password hashing: bcrypt (`>=12` rounds in implementation)
- Refresh cookies: `httpOnly`, `sameSite=strict`, `secure` in production
- Access token storage: in-memory only (not localStorage)
- SQL access: parameterized queries
- Input validation: Zod schemas
- Abuse control: route-level rate limiting for auth endpoints
- Response hardening: Fastify helmet middleware
- Error boundaries: centralized error handler with structured payloads

## Testing Strategy

- Backend unit/integration tests (`backend/tests`)
- Frontend component/unit tests (`frontend/tests`)
- Frontend E2E auth flows (`frontend/e2e`)
- Migration up/down commands for schema lifecycle validation
