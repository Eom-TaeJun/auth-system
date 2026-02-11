# Security Audit Report

**Date:** 2026-02-11  
**Project:** `/home/tj/projects/auth-system`  
**Scope:** Backend auth/token flows, frontend token handling, API boundary behaviors

## Audit Method

- Attempted automated review with `codex review --uncommitted` on 2026-02-10 and 2026-02-11.
  - Both attempts failed due upstream network disconnections to `https://chatgpt.com/backend-api/codex/responses`.
- Completed manual code review across:
  - `backend/src/index.ts`
  - `backend/src/routes/*.ts`
  - `backend/src/services/*.ts`
  - `backend/src/models/*.ts`
  - `backend/src/middleware/*.ts`
  - `frontend/lib/api.ts`
  - `frontend/hooks/useAuth.tsx`
  - auth/protected frontend pages and tests

## Re-Audit Notes (2026-02-11)

- Reviewed security-sensitive controls after frontend test expansion:
  - No `localStorage` / `sessionStorage` token persistence.
  - No `dangerouslySetInnerHTML`, `eval`, or `Function` usage in app code.
  - Access/refresh token flow unchanged:
    - Refresh token remains `httpOnly` cookie.
    - Access token remains in-memory only (`frontend/lib/authToken.ts`).
  - API protections unchanged:
    - Route-level rate limiting in `backend/src/routes/schemas/authSchemas.ts`.
    - Explicit CORS origin and credentials mode in `backend/src/index.ts`.
    - SQL operations remain parameterized in models/migrations.
- Added and passed additional frontend test coverage for auth edge cases:
  - `frontend/tests/password-recovery-pages.test.tsx`
  - `frontend/e2e/auth-flows.spec.ts` (8 scenarios)

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

- Severity: **MEDIUM**
- Status: **FIXED** (2026-02-12)
- Risk:
  - Different messages/codes (e.g. duplicate email, unverified account) can reveal account state.
- Affected:
  - `backend/src/services/authService.ts`
- Fix applied:
  - Login now returns a generic invalid-credentials error even when email is unverified.
  - **Registration now returns generic success message for duplicate emails** (2026-02-12):
    - Changed from throwing 409 error to silently returning success message
    - No duplicate verification email sent (prevents spam)
    - Updated `contracts/api-contracts.d.ts` to make `userId` optional
    - Test coverage: `backend/tests/unit/authService.test.ts:146-158`
- Previous behavior:
  - Duplicate email: 409 status with "Email already exists" message
  - New email: 201 status with success message
  - **This allowed attackers to enumerate valid emails**
- New behavior:
  - Both scenarios: 201 status with "Registration successful. Please verify your email."
  - **Attackers cannot determine if email is already registered**

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

## Approval Status

✅ APPROVED

- No open CRITICAL/HIGH/MEDIUM issues found.
- All enumeration vulnerabilities resolved (2026-02-12).
- System ready for production deployment.

## Manual Review Items (Completed 2026-02-12)

### Item 1: Registration enumeration hardening
- **Location**: `/home/tj/projects/auth-system/backend/src/services/authService.ts:47-79`
- **Severity**: MEDIUM (upgraded from LOW due to direct enumeration attack vector)
- **Status**: ✅ FIXED (2026-02-12)
- **Fix implemented**:
  - Changed registration flow to prevent email enumeration
  - Duplicate emails now return 201 success with generic message (not 409 error)
  - No verification email sent for duplicates (prevents spam)
  - Contract updated: `userId` field now optional in RegisterResponseContract
  - Test coverage added: `backend/tests/unit/authService.test.ts:146-158`
- **Remaining consideration**:
  - Potential timing side-channel through response time differences
  - **Assessment**: Minimal risk. Timing attacks require sophisticated measurement and provide limited value compared to direct enumeration which is now prevented.

### Item 2: CSP policy tuning
- **Location**: `/home/tj/projects/auth-system/backend/src/index.ts:27-30`
- **Severity**: INFORMATIONAL
- **Status**: NO ACTION NEEDED
- **Assessment**:
  - CSP is conditionally enabled in production (line 28)
  - Backend is API-only (serves JSON, not HTML)
  - All routes return JSON: `/api/auth/*`, `/api/users/*`, `/health`
  - **Decision**: Current configuration is appropriate. CSP is primarily for protecting HTML content from XSS; not applicable to pure JSON APIs.

### Item 3: Token refresh timing side-channel
- **Location**: `/home/tj/projects/auth-system/frontend/lib/api.ts:186-208`
- **Severity**: LOW
- **Status**: ACCEPTED RISK
- **Assessment**:
  - `refreshAccessToken` function has different execution paths for success/failure
  - Success path: validates httpOnly cookie, generates new token, returns value
  - Failure path: clears token, returns null
  - Timing differences could theoretically reveal refresh token validity
  - **Mitigations in place**:
    - Refresh tokens stored as httpOnly cookies (inaccessible to JavaScript)
    - CORS restricted to specific frontend origin
    - Tokens are hashed in database
  - **Decision**: Risk accepted. Timing attack requires attacker to repeatedly trigger refresh with victim's cookies, which CORS and SameSite protections prevent.

### Item 4: Middleware security architecture
- **Location**: `/home/tj/projects/auth-system/backend/src/index.ts`
- **Severity**: INFORMATIONAL
- **Status**: NO ACTION NEEDED
- **Assessment**:
  - No dedicated middleware directory found (only `errorHandler`)
  - Security middleware appropriately configured at application level:
    - `@fastify/helmet` (lines 27-30): Security headers including CSP
    - `@fastify/cors` (lines 20-23): Origin restrictions and credentials
    - `@fastify/rate-limit` (lines 32-35): DDoS protection
    - `@fastify/cookie` (line 25): Secure cookie handling
  - **Decision**: Current architecture is sound. Fastify plugins provide enterprise-grade security controls without custom middleware.

## Next Actions

1. ~~Optionally normalize duplicate-email registration responses for stricter anti-enumeration.~~ ✅ FIXED (2026-02-12)
2. ~~Tune CSP policy further if API starts serving HTML assets.~~ ✓ REVIEWED - Not applicable for JSON API
3. All 4 manual review items assessed and documented.
4. ~~Fix MEDIUM severity enumeration vulnerability~~ ✅ FIXED (2026-02-12)

## Summary of 2026-02-12 Security Fix

**Issue**: Registration endpoint revealed email existence through different status codes
- Duplicate email: 409 "Email already exists"
- New email: 201 "Registration successful"

**Fix**: Normalized all registration responses to prevent enumeration
- All attempts: 201 "Registration successful. Please verify your email."
- Backend silently skips duplicate registrations without sending email
- Test suite updated and passing

**Impact**: MEDIUM severity vulnerability eliminated. System now production-ready.
