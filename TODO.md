# Auth System - TODO List

**프로젝트:** `/home/tj/projects/auth-system/`

---

## ✅ 완료

- [x] Phase 0: 프로젝트 구조 초기화
- [x] Phase 1: 데이터베이스 설정 (backend-agent)
- [x] Phase 4: 프론트엔드 기초 (frontend-agent)

---

## 🔄 진행 중

- [ ] **Phase 2: Core Services (backend-agent 작업 중)**
  - `src/utils/password.ts` - bcrypt 해싱, 비밀번호 검증
  - `src/services/tokenService.ts` - JWT 생성/검증
  - `src/services/emailService.ts` - 이메일 발송 (mock)
  - `src/utils/validators.ts` - 이메일/비밀번호 검증
  - `src/services/authService.ts` - 회원가입, 로그인, 토큰 리프레시 등
  - 유닛 테스트 (>80% 커버리지)

---

## 📋 해야 할 일

### Backend

- [ ] **Phase 3: API Routes**
  - Fastify 서버 설정
  - 인증 미들웨어 (`middleware/authenticate.ts`)
  - Auth routes:
    - `POST /api/auth/register`
    - `POST /api/auth/login`
    - `POST /api/auth/refresh`
    - `POST /api/auth/logout`
    - `GET /api/auth/verify-email`
    - `POST /api/auth/forgot-password`
    - `POST /api/auth/reset-password`
  - User routes:
    - `GET /api/users/me`
    - `PATCH /api/users/me`
  - Rate limiting
  - CORS 설정
  - Integration 테스트

- [ ] **Phase 7: Backend Testing**
  - 모든 서비스 유닛 테스트
  - API 통합 테스트
  - 테스트 DB 설정
  - 커버리지 리포트

### Frontend

- [ ] **Phase 5: Auth Forms**
  - 페이지:
    - `/login` - 로그인 폼
    - `/register` - 회원가입 (비밀번호 강도 표시)
    - `/verify-email` - 이메일 인증
    - `/forgot-password` - 비밀번호 찾기
    - `/reset-password` - 비밀번호 재설정
  - react-hook-form + Zod 검증
  - 에러/성공 토스트
  - 컴포넌트 테스트

- [ ] **Phase 6: Protected Routes**
  - `useAuth` 훅 완성 (로그인, 로그아웃, 회원가입)
  - Protected route wrapper
  - 페이지:
    - `/dashboard` - 대시보드
    - `/profile` - 프로필 편집
  - Axios 인터셉터 (토큰 자동 갱신)
  - 인증 상태 관리

- [ ] **Phase 8: Frontend Testing**
  - 컴포넌트 테스트 (React Testing Library)
  - E2E 테스트 (Playwright)
  - 테스트 mock, utilities

### Security & Finalization

- [ ] **Phase 9: Security Audit (codex-reviewer)**
  - `codex review --uncommitted` 실행
  - 보안 체크리스트:
    - SQL injection 방지
    - JWT 시크릿 환경변수
    - 토큰 저장 방식
    - 비밀번호 해싱
    - 입력 검증
    - 에러 메시지
    - Rate limiting
    - CORS 설정
  - 보안 리포트 작성 (CRITICAL/HIGH/MEDIUM/LOW)

- [ ] **Phase 10: Documentation**
  - README.md 완성
  - `docs/API.md` - API 문서
  - `docs/ARCHITECTURE.md` - 아키텍처 설명
  - `docs/DEPLOYMENT.md` - 배포 가이드

- [ ] **Phase 11: Final Integration**
  - 전체 테스트 스위트 실행
  - 수동 E2E 검증:
    - 회원가입 → 이메일 인증 → 로그인 → 대시보드
  - DB 마이그레이션 롤백 테스트
  - 배포 체크리스트
  - 최종 프로젝트 리포트

---

## 🚀 빠른 실행 명령어

### 개발 시작
```bash
cd ~/projects/auth-system

# DB 시작
docker-compose up -d

# 의존성 설치
npm install

# 마이그레이션
npm run migrate

# 개발 서버 (둘 다)
npm run dev
```

### 개별 실행
```bash
# Backend만
npm run dev:backend  # http://localhost:4000

# Frontend만
npm run dev:frontend # http://localhost:3000
```

### 테스트
```bash
# 전체
npm test

# Backend만
npm run test --workspace=backend

# Frontend만
npm run test --workspace=frontend
```

---

## 📊 진행률

**전체:** 3/12 phases (25%)

**Backend:** 1/4 phases
- ✅ Database
- 🔄 Core Services
- ⏸️ API Routes
- ⏸️ Testing

**Frontend:** 1/3 phases
- ✅ Foundation
- ⏸️ Auth Forms
- ⏸️ Protected Routes
- ⏸️ Testing

**Final:** 0/3 phases
- ⏸️ Security Audit
- ⏸️ Documentation
- ⏸️ Integration

---

## 💡 다음 우선순위

1. **Phase 2 완료 기다리기** (backend-agent 작업 중)
2. **Phase 5 시작** - 프론트엔드 폼 작업 (frontend-agent)
3. **Phase 3 시작** - Backend API (Phase 2 완료 후)
4. **Phase 6 시작** - Protected routes (Phase 5 완료 후)
5. **Testing phases** (Phase 3, 6 완료 후)
6. **Security audit** (모든 구현 완료 후)
7. **Documentation & Integration** (최종)

---

## 🎯 각 Phase 상세 (필요시 참고)

자세한 내용은 `PROGRESS.md` 참고
