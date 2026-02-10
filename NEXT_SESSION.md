# 다음 세션에서 계속하기

**프로젝트 위치:** `/home/tj/projects/auth-system/`

---

## 현재 상태

### ✅ 완료됨
- Phase 0: 프로젝트 구조 초기화
- Git 저장소 생성
- Docker Compose 설정
- TypeScript, Jest, Tailwind 설정 완료

### 🔄 진행 중 (일시정지)
- Phase 1: 데이터베이스 설정 (backend-agent 작업 중)
- Phase 4: 프론트엔드 기초 (frontend-agent 작업 중)

---

## 다음에 할 일

### 방법 1: AI 에이전트로 계속하기

```bash
cd ~/projects/auth-system

# Claude Code 실행 후:
# "Continue the auth-system implementation with the auth-team"
```

팀과 태스크는 다음에 보존되어 있습니다:
- `~/.claude/teams/auth-team/`
- `~/.claude/tasks/auth-team/`

### 방법 2: 직접 구현하기

**Phase 1 완료하기: 데이터베이스**
```bash
cd ~/projects/auth-system/backend

# 1. .env 파일 생성
cp .env.example .env
# JWT_ACCESS_SECRET, JWT_REFRESH_SECRET 수정

# 2. 데이터베이스 시작
cd ..
docker-compose up -d

# 3. 필요한 파일 생성:
# - src/config/database.ts
# - src/config/env.ts
# - src/config/migrate.ts
# - migrations/001_initial_schema.ts
# - src/models/User.ts
# - src/models/VerificationToken.ts
# - src/models/RefreshToken.ts

# 4. 마이그레이션 실행
npm run migrate
```

**Phase 4 완료하기: 프론트엔드 기초**
```bash
cd ~/projects/auth-system/frontend

# 1. .env.local 생성
cp .env.example .env.local

# 2. 필요한 파일 생성:
# - app/globals.css
# - app/layout.tsx
# - app/page.tsx
# - components/ui/button.tsx
# - components/ui/input.tsx
# - lib/api.ts
# - hooks/useAuth.tsx

# 3. 개발 서버 실행
npm run dev
```

---

## 구조 참고

### 백엔드 구조
```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts    # PostgreSQL 연결
│   │   ├── env.ts         # 환경변수 로드
│   │   └── migrate.ts     # 마이그레이션 러너
│   ├── middleware/
│   │   └── authenticate.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── VerificationToken.ts
│   │   └── RefreshToken.ts
│   ├── routes/
│   ├── services/
│   │   ├── authService.ts
│   │   ├── tokenService.ts
│   │   └── emailService.ts
│   └── index.ts
└── migrations/
    └── 001_initial_schema.ts
```

### 프론트엔드 구조
```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── verify-email/
│   ├── (protected)/
│   │   ├── dashboard/
│   │   └── profile/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/
├── hooks/
│   └── useAuth.tsx
└── lib/
    ├── api.ts
    └── types.ts
```

---

## 데이터베이스 스키마

### users 테이블
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- email_verified (BOOLEAN)
- created_at, updated_at (TIMESTAMP)

### verification_tokens 테이블
- id (UUID, PK)
- user_id (UUID, FK)
- token (VARCHAR, UNIQUE)
- token_type (VARCHAR) - 'email_verify', 'password_reset'
- expires_at (TIMESTAMP)
- used_at (TIMESTAMP)
- created_at (TIMESTAMP)

### refresh_tokens 테이블
- id (UUID, PK)
- user_id (UUID, FK)
- token_hash (VARCHAR, UNIQUE)
- expires_at (TIMESTAMP)
- revoked_at (TIMESTAMP)
- device_info (TEXT)
- created_at (TIMESTAMP)

---

## 유용한 명령어

```bash
# 데이터베이스 시작
docker-compose up -d

# 데이터베이스 중지
docker-compose down

# 데이터베이스 로그 확인
docker-compose logs postgres

# PostgreSQL 접속
docker exec -it auth-system-db psql -U authuser -d auth_db

# 의존성 설치
npm install

# 개발 서버 (둘 다)
npm run dev

# 테스트
npm test
```

---

## 참고 문서

- 전체 계획: `PROGRESS.md`
- 프로젝트 개요: `README.md`
- 원본 계획: `~/.claude/projects/-home-tj/becb0d01-546e-494e-8681-b14f626ec1bf.jsonl`

---

## 예상 소요 시간

- Phase 1 (Database): 1시간
- Phase 2 (Services): 2-3시간
- Phase 3 (API): 2시간
- Phase 4 (Frontend Foundation): 2시간
- Phase 5 (Forms): 3시간
- Phase 6 (Protected): 2시간
- Phase 7-8 (Testing): 4-6시간
- Phase 9 (Security): 1-2시간
- Phase 10-11 (Docs/Integration): 2-3시간

**총: 19-24시간 (순차) 또는 15시간 (병렬)**
