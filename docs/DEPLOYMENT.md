# Deployment Guide

## Runtime Requirements

- Node.js `>=18`
- npm `>=9`
- PostgreSQL `>=16`
- Linux/macOS shell environment for scripts

## Environment Variables

Create a root `.env` from `.env.example` and set production values:

- `DATABASE_URL`
- `DATABASE_URL_TEST` (optional for production runtime, required for CI tests)
- `JWT_ACCESS_SECRET` (minimum 32 chars)
- `JWT_REFRESH_SECRET` (minimum 32 chars)
- `SENDGRID_API_KEY` (required when `NODE_ENV=production`)
- `FROM_EMAIL`
- `FRONTEND_URL`
- `PORT`
- `NODE_ENV=production`

Frontend runtime (`frontend/.env.local`):

- `NEXT_PUBLIC_API_URL` (public backend base URL)

## Production Build

From repository root:

```bash
npm install
npm run build
```

## Database Migration

Run before first start and on every schema change:

```bash
npm run migrate
```

Rollback last migration:

```bash
npm run migrate:down
```

## Start Services

Backend:

```bash
npm run start --workspace=backend
```

Frontend:

```bash
npm run start --workspace=frontend
```

Recommended deployment topology:

- Frontend and backend behind a reverse proxy (Nginx/Caddy)
- TLS termination at proxy
- Backend exposed only to trusted network when possible

## Post-Deploy Verification

1. `GET /health` returns `status=ok`
2. Register flow sends verification email
3. Login sets `refreshToken` cookie and returns access token
4. Protected endpoint (`GET /api/users/me`) works with bearer token
5. Refresh endpoint issues new access token via cookie
6. Logout clears refresh cookie

## Security Checklist

1. Run secret scan before release:
   - `npm run security:secrets`
2. Verify CORS origin is set to real frontend URL
3. Confirm strong JWT secrets and rotation policy
4. Use HTTPS in production (`secure` cookie flag depends on prod mode)
5. Restrict database network access
6. Enable centralized logs/monitoring and alerting

## Operational Notes

- If SendGrid is intentionally disabled in non-production, keep `NODE_ENV` out of `production`.
- If schema rollback is needed, execute one `migrate:down` step at a time and verify service behavior after each step.
- Keep backups/snapshots of production DB before migration windows.
