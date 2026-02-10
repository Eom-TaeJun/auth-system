# Security Audit Report

**Date:** 2026-02-10  
**Project:** `/home/tj/projects/auth-system`  
**Scope:** Backend auth/token flows, frontend token handling, API boundary behaviors

## Audit Method

- Attempted automated review with `codex review --uncommitted` (failed due upstream network disconnections).
- Completed manual code review across:
  - `backend/src/index.ts`
  - `backend/src/routes/*.ts`
  - `backend/src/services/*.ts`
  - `backend/src/models/*.ts`
  - `backend/src/middleware/*.ts`
  - `frontend/lib/api.ts`
  - `frontend/hooks/useAuth.tsx`
  - auth/protected frontend pages and tests

## Findings

### 1) Verification tokens were stored in DB as plaintext

- Severity: **HIGH**
- Status: **FIXED**
- Risk:
  - If DB contents leak, an attacker can directly use unexpired email verification / password reset tokens.
- Fix applied:
  - `backend/src/models/VerificationToken.ts`
  - Verification tokens are now SHA-256 hashed before insert and lookup.
  - Existing lookup APIs continue to accept raw token input and hash internally.
- Regression coverage:
  - `backend/tests/unit/verificationTokenModel.test.ts` assertions added for hashed token parameters.

### 2) Access token is persisted in browser localStorage

- Severity: **MEDIUM**
- Status: **FIXED**
- Risk:
  - Any XSS can exfiltrate bearer tokens from localStorage.
- Affected:
  - `frontend/lib/authToken.ts`
  - `frontend/lib/api.ts`
  - `frontend/hooks/useAuth.tsx`
- Fix applied:
  - Access token storage is now in-memory only.
  - Session bootstrap now uses refresh-cookie flow on app load to obtain a new access token.

### 3) Authentication responses can aid account enumeration

- Severity: **LOW**
- Status: **PARTIALLY FIXED**
- Risk:
  - Different messages/codes (e.g. duplicate email, unverified account) can reveal account state.
- Affected:
  - `backend/src/services/authService.ts`
- Fix applied:
  - Login now returns a generic invalid-credentials error even when email is unverified.
- Remaining recommendation:
  - Consider normalizing duplicate-email behavior in registration for stricter anti-enumeration.

### 4) Missing hardened security headers middleware

- Severity: **LOW**
- Status: **FIXED**
- Risk:
  - Response headers (CSP, X-Frame-Options, etc.) are not centrally hardened.
- Affected:
  - `backend/src/index.ts`
- Fix applied:
  - Added `@fastify/helmet` in server bootstrap and validated headers in integration tests.

## Validation After Fixes

- `npm run type-check --workspace=backend` passed
- `npm run test --workspace=backend -- --runInBand` passed
- `npm run type-check --workspace=frontend` passed
- `npm run test --workspace=frontend -- --runInBand` passed
- `npm run test:e2e --workspace=frontend` passed

## Next Actions

1. Optionally normalize duplicate-email registration responses for stricter anti-enumeration.
2. Tune CSP policy further if API starts serving HTML assets.
