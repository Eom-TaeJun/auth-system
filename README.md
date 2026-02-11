# Auth System - Production JWT Authentication

A production-ready authentication system built with Node.js, Next.js, and PostgreSQL, featuring JWT tokens and email verification.

## Features

- 🔐 JWT-based authentication (access + refresh tokens)
- ✉️ Email verification with secure tokens
- 🔑 Password reset functionality
- 🛡️ Security-first design (httpOnly cookies, bcrypt hashing)
- 🧪 Comprehensive testing (unit, integration, E2E)
- 📝 TypeScript throughout
- 🎨 Modern UI with Tailwind CSS + Shadcn/ui

## Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Fastify (TypeScript)
- **Database:** PostgreSQL 16
- **Auth:** JWT (jsonwebtoken)
- **Email:** SendGrid
- **Testing:** Jest

### Frontend
- **Framework:** Next.js 14 App Router
- **UI Library:** React 18
- **Styling:** Tailwind CSS + Shadcn/ui
- **Forms:** react-hook-form + Zod
- **HTTP Client:** Axios
- **Testing:** React Testing Library, Playwright

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm 9+

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd auth-system
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env
# Edit .env and add your secrets

cp frontend/.env.example frontend/.env.local
```

4. Start PostgreSQL
```bash
docker-compose up -d
```

5. Run database migrations
```bash
npm run migrate
```

6. Start development servers
```bash
npm run dev
```

The backend will run on http://localhost:4000
The frontend will run on http://localhost:3000

## Project Structure

```
auth-system/
├── backend/              # Fastify API server
│   ├── src/
│   │   ├── config/      # Database, environment config
│   │   ├── middleware/  # Auth, validation, error handling
│   │   ├── models/      # TypeScript models
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── index.ts     # Server entry point
│   ├── migrations/      # Database migrations
│   └── tests/           # Backend tests
├── frontend/            # Next.js application
│   ├── app/             # App Router pages
│   ├── components/      # React components
│   ├── hooks/           # Custom hooks (useAuth)
│   ├── lib/             # Utilities, API client
│   └── tests/           # Frontend tests
├── docs/                # API, architecture, deployment docs
└── docker-compose.yml   # PostgreSQL containers
```

## API Endpoints

See [docs/API.md](docs/API.md) for complete API documentation.

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and revoke token
- `GET /api/auth/verify-email` - Verify email with token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### User Management
- `GET /api/users/me` - Get current user (protected)
- `PATCH /api/users/me` - Update user profile (protected)

## Testing

```bash
# Run all tests
npm test

# Backend tests only
npm run test --workspace=backend

# Frontend tests only
npm run test --workspace=frontend

# E2E tests
npm run test:e2e --workspace=frontend
```

`frontend`의 `test:e2e`는 Playwright 실행 전 Linux 런타임 라이브러리(`libnspr4`, `libnss3`)를 확인하고, 누락 시 사용자 캐시에 로컬 fallback을 준비한 뒤 실행합니다.

## Security Features

- Passwords hashed with bcrypt (12 rounds)
- JWT access tokens (15 min expiry, memory storage)
- JWT refresh tokens (7 day expiry, httpOnly cookies)
- Email verification tokens (24 hour expiry)
- Rate limiting on auth endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (input validation, output encoding)
- CORS configured for frontend origin only

## API Key / Secret Management

- Keep secrets only in local runtime env files (`.env`, `backend/.env`, `frontend/.env.local`) and never commit them.
- Production requires a real `SENDGRID_API_KEY`; startup fails if key is missing or malformed.
- Add only safe placeholders to `*.env.example` files.
- Run secret scanning before push:

```bash
npm run security:secrets
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment instructions.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system architecture details.

## Development Team

Built with Claude Code Agent Teams:
- Lead Agent (Opus 4.6) - Architecture & coordination
- Backend Agent (Sonnet) - API & database
- Frontend Agent (Sonnet) - UI & forms
- QA Agent (Sonnet) - Testing
- Codex Reviewer (Sonnet) - Security audit

## License

MIT
