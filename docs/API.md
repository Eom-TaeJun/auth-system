# API Reference

Base URL (local): `http://localhost:4000`

## Conventions

- `Content-Type: application/json`
- Protected routes require `Authorization: Bearer <accessToken>`.
- Refresh token is managed via `refreshToken` cookie (`httpOnly`, `sameSite=strict`, `secure` in production).

## Health

### `GET /health`

Response `200`:

```json
{
  "status": "ok",
  "timestamp": "2026-02-11T00:00:00.000Z"
}
```

## Authentication

### `POST /api/auth/register`

Request:

```json
{
  "email": "user@example.com",
  "password": "Strong123!"
}
```

Response `201`:

```json
{
  "userId": "uuid",
  "message": "Registration successful. Please verify your email."
}
```

### `POST /api/auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "Strong123!"
}
```

Response `200`:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_verified": true
  }
}
```

Notes:

- Sets `refreshToken` cookie.
- Returns generic invalid-credentials response for authentication failures.

### `POST /api/auth/refresh`

Request:

- Uses `refreshToken` cookie, no JSON body required.

Response `200`:

```json
{
  "accessToken": "<jwt>"
}
```

### `POST /api/auth/logout`

Request:

- Uses `refreshToken` cookie when present.

Response `200`:

```json
{
  "message": "Logged out successfully"
}
```

### `GET /api/auth/verify-email?token=<token>`

Response `200`:

```json
{
  "message": "Email verified successfully"
}
```

### `POST /api/auth/forgot-password`

Request:

```json
{
  "email": "user@example.com"
}
```

Response `200`:

```json
{
  "message": "If the email exists, a reset link has been sent."
}
```

### `POST /api/auth/reset-password`

Request:

```json
{
  "token": "<password-reset-token>",
  "password": "NewStrong123!"
}
```

Response `200`:

```json
{
  "message": "Password reset successfully"
}
```

## User

### `GET /api/users/me` (protected)

Response `200`:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "email_verified": true,
  "created_at": "2026-02-11T00:00:00.000Z",
  "updated_at": "2026-02-11T00:00:00.000Z"
}
```

### `PATCH /api/users/me` (protected)

Request:

```json
{
  "email": "updated@example.com"
}
```

Response `200`: same payload shape as `GET /api/users/me`.

## Error Format

Common error response:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message"
}
```

Validation errors:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input",
  "details": [
    { "path": "email", "message": "Invalid email" }
  ]
}
```

Common codes:

- `INVALID_CREDENTIALS`
- `INVALID_TOKEN`
- `EMAIL_EXISTS`
- `WEAK_PASSWORD`
- `USER_NOT_FOUND`
- `VALIDATION_ERROR`
