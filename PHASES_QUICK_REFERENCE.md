# Auth System - 빠른 Phase 참조

**모든 Phase 요약본 - 빠르게 구현할 때 참고**

---

## Phase 2: Core Services (백엔드) - 2-3시간

### 생성할 파일 (6개)
1. `backend/src/utils/password.ts` - bcrypt 해싱 + 검증
2. `backend/src/services/tokenService.ts` - JWT + Refresh Token 생성/검증
3. `backend/src/services/emailService.ts` - 이메일 발송 (콘솔 로그)
4. `backend/src/utils/validators.ts` - 이메일/비밀번호 검증
5. `backend/src/utils/errors.ts` - AuthError 클래스
6. `backend/src/services/authService.ts` - 회원가입, 로그인, 리프레시 등

### 테스트 (4개)
- `tests/unit/password.test.ts`
- `tests/unit/tokenService.test.ts`
- `tests/unit/validators.test.ts`
- `tests/unit/authService.test.ts`

---

## Phase 3: API Routes (백엔드) - 2시간

### 생성할 파일 (5개)
1. `backend/src/index.ts` - Fastify 서버
2. `backend/src/middleware/authenticate.ts` - JWT 미들웨어
3. `backend/src/middleware/errorHandler.ts` - 에러 핸들러
4. `backend/src/routes/auth.ts` - 인증 API 엔드포인트
5. `backend/src/routes/users.ts` - 사용자 API 엔드포인트

### API 엔드포인트
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- GET /api/auth/verify-email
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/users/me
- PATCH /api/users/me

---

## Phase 5: Auth Forms (프론트엔드) - 3시간

### 생성할 파일 (11개)

**페이지 (5개):**
1. `frontend/app/(auth)/layout.tsx` - Auth 레이아웃
2. `frontend/app/(auth)/login/page.tsx` - 로그인
3. `frontend/app/(auth)/register/page.tsx` - 회원가입
4. `frontend/app/(auth)/verify-email/page.tsx` - 이메일 인증
5. `frontend/app/(auth)/forgot-password/page.tsx` - 비밀번호 찾기
6. `frontend/app/(auth)/reset-password/page.tsx` - 비밀번호 재설정

**컴포넌트 (3개):**
7. `frontend/components/auth/LoginForm.tsx`
8. `frontend/components/auth/RegisterForm.tsx`
9. `frontend/components/auth/PasswordStrengthIndicator.tsx`

**기타 (2개):**
10. `frontend/lib/schemas.ts` - Zod 스키마
11. `frontend/lib/api.ts` 업데이트 - authApi 추가

---

## Phase 6: Protected Routes (프론트엔드) - 2시간

### 생성할 파일 (5개)

**인증 시스템:**
1. `frontend/hooks/useAuth.tsx` 완성 - login(), logout(), register() 구현
2. `frontend/lib/api.ts` 업데이트 - Axios 인터셉터 추가 (토큰 리프레시)

**페이지 (3개):**
3. `frontend/app/(protected)/layout.tsx` - Protected 레이아웃
4. `frontend/app/(protected)/dashboard/page.tsx` - 대시보드
5. `frontend/app/(protected)/profile/page.tsx` - 프로필 편집

**기능:**
- Protected route wrapper (인증 없으면 /login으로 리다이렉트)
- Axios interceptor (401 에러 시 자동 토큰 갱신)
- 전역 인증 상태 관리

---

## Phase 7: Backend Testing - 2-3시간

### 작업 내용
- 모든 서비스 유닛 테스트
- API 통합 테스트 (`tests/integration/auth.test.ts`)
- 테스트 DB 설정
- 커버리지 >80% 달성

---

## Phase 8: Frontend Testing - 2-3시간

### 작업 내용
- 컴포넌트 테스트 (React Testing Library)
- E2E 테스트 (Playwright) - 회원가입 → 로그인 → 대시보드
- Mock API responses
- 커버리지 확인

---

## Phase 9: Security Audit - 1-2시간

### 체크리스트
```bash
# 1. Codex CLI 실행
cd ~/projects/auth-system
codex review --uncommitted

# 2. 수동 보안 체크
- [ ] SQL injection 방지 (parameterized queries)
- [ ] JWT secrets in .env (not hardcoded)
- [ ] Refresh tokens in httpOnly cookies
- [ ] Passwords hashed with bcrypt (12 rounds)
- [ ] Token expiration (access: 15min, refresh: 7days, verify: 24hrs)
- [ ] No sensitive data in logs
- [ ] Input validation everywhere
- [ ] Error messages don't leak info
- [ ] Rate limiting on /api/auth/*
- [ ] CORS configured for FRONTEND_URL only

# 3. 보안 리포트 작성
```

---

## Phase 10: Documentation - 1시간

### 생성할 문서 (4개)
1. `README.md` 완성 - Quick Start, Features, Tech Stack
2. `docs/API.md` - 전체 API 엔드포인트 문서화
3. `docs/ARCHITECTURE.md` - 시스템 아키텍처 설명
4. `docs/DEPLOYMENT.md` - 프로덕션 배포 가이드

---

## Phase 11: Final Integration - 1-2시간

### 검증 체크리스트
```bash
# 1. DB 시작
docker-compose up -d

# 2. 마이그레이션
npm run migrate

# 3. 서버 시작
npm run dev

# 4. 전체 테스트
npm test

# 5. 수동 E2E 테스트
- 회원가입 (test@example.com)
- 이메일 인증 (콘솔에서 링크 복사)
- 로그인
- 대시보드 접속
- 프로필 수정
- 로그아웃

# 6. 마이그레이션 롤백 테스트
npm run migrate:down

# 7. 최종 리포트 작성
```

---

## 🚀 빠른 시작 명령어

### 초기 설정
```bash
cd ~/projects/auth-system

# 의존성 설치
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 환경변수
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# JWT secrets 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 두 번 실행해서 ACCESS_SECRET, REFRESH_SECRET에 각각 넣기
```

### 개발
```bash
# DB 시작
docker-compose up -d

# 마이그레이션
npm run migrate

# 개발 서버 (둘 다)
npm run dev
```

### 테스트
```bash
# 전체
npm test

# 커버리지
npm run test:coverage --workspace=backend
```

---

## 📁 최종 파일 트리

```
auth-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts ✅
│   │   │   ├── env.ts ✅
│   │   │   └── migrate.ts ✅
│   │   ├── middleware/
│   │   │   ├── authenticate.ts (Phase 3)
│   │   │   └── errorHandler.ts (Phase 3)
│   │   ├── models/
│   │   │   ├── User.ts ✅
│   │   │   ├── VerificationToken.ts ✅
│   │   │   └── RefreshToken.ts ✅
│   │   ├── routes/
│   │   │   ├── auth.ts (Phase 3)
│   │   │   └── users.ts (Phase 3)
│   │   ├── services/
│   │   │   ├── authService.ts (Phase 2)
│   │   │   ├── tokenService.ts (Phase 2)
│   │   │   └── emailService.ts (Phase 2)
│   │   ├── utils/
│   │   │   ├── password.ts (Phase 2)
│   │   │   ├── validators.ts (Phase 2)
│   │   │   └── errors.ts (Phase 2)
│   │   └── index.ts (Phase 3)
│   ├── migrations/
│   │   └── 001_initial_schema.ts ✅
│   └── tests/
│       ├── unit/ (Phase 2, 7)
│       └── integration/ (Phase 7)
├── frontend/
│   ├── app/
│   │   ├── (auth)/ (Phase 5)
│   │   ├── (protected)/ (Phase 6)
│   │   ├── globals.css ✅
│   │   ├── layout.tsx ✅
│   │   └── page.tsx ✅
│   ├── components/
│   │   ├── ui/ ✅
│   │   └── auth/ (Phase 5)
│   ├── hooks/
│   │   └── useAuth.tsx (✅ stub, Phase 6 완성)
│   ├── lib/
│   │   ├── api.ts (✅ stub, Phase 5, 6 업데이트)
│   │   ├── types.ts ✅
│   │   ├── utils.ts ✅
│   │   └── schemas.ts (Phase 5)
│   └── tests/ (Phase 8)
└── docs/ (Phase 10)
    ├── API.md
    ├── ARCHITECTURE.md
    └── DEPLOYMENT.md
```

✅ = 완료됨

---

## 💡 구현 팁

### Phase 2 시작할 때
```bash
cd ~/projects/auth-system/backend

# bcrypt 설치 확인
npm list bcrypt

# tokenService 먼저 구현 (다른 곳에서 많이 쓰임)
# → authService 구현
# → 테스트 작성
```

### Phase 5 시작할 때
```bash
cd ~/projects/auth-system/frontend

# 필요한 패키지 확인
npm list react-hook-form zod @hookform/resolvers sonner

# schemas.ts 먼저 작성 (검증 로직)
# → 폼 컴포넌트
# → 페이지
```

### 테스트 작성 시
```typescript
// Mock 예제
jest.mock('../../src/models/User');
(User.findByEmail as jest.Mock).mockResolvedValue({ id: '123' });

// Async 테스트
await expect(someFunction()).rejects.toThrow('error message');
```

---

## 🎯 우선순위

1. **Phase 2** (Core Services) - 다른 모든 것의 기반
2. **Phase 3** (API Routes) - 백엔드 완성
3. **Phase 5** (Auth Forms) - 프론트 핵심
4. **Phase 6** (Protected Routes) - 프론트 완성
5. **Phase 7-8** (Testing) - 안정성
6. **Phase 9-11** (Audit, Docs, Integration) - 마무리

**예상 총 시간:** 15-20시간 (AI 에이전트 사용 시 10-12시간)
