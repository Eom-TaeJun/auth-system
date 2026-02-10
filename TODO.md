# Auth System - TODO List

**프로젝트:** `/home/tj/projects/auth-system/`

---

## 🔔 최신 업데이트 (2026-02-10)

- Phase 7(Backend Testing) 완료
  - 신규 테스트 추가: `authenticate`, `errorHandler`, `errors`, `env`, `database.unit`
  - 기존 테스트 보강: `authService`, `tokenService`, `password`, `auth/users integration`, 모델 테스트 3종
  - `backend/jest.config.js`에서 CLI 전용 `src/config/migrate.ts` 커버리지 제외
- Frontend 테스트 안정화
  - `auth-forms` 테스트의 `act` 경고 제거
  - `next/link` mock 적용
  - 신규 컴포넌트 테스트 추가: `protected-layout`, `profile-page`
  - Playwright E2E 추가: `frontend/playwright.config.ts`, `frontend/e2e/auth-flows.spec.ts`
  - `test:e2e` 래퍼 스크립트 추가: `frontend/scripts/run-playwright-e2e.sh`
  - Jest에서 `e2e` 경로 제외(`frontend/jest.config.js`)
  - `NEXT_IGNORE_INCORRECT_LOCKFILE` 설정으로 Next lockfile 경고 제거
- 검증 완료
  - `npm run type-check --workspace=backend` 통과
  - `npm run test --workspace=backend -- --runInBand` 통과 (16 suites, 135 tests)
  - `npm run test:coverage --workspace=backend -- --runInBand` 통과
    - Statements 100%, Branches 97.52%, Functions 100%, Lines 100%
  - `npm run type-check --workspace=frontend` 통과
  - `npm run test --workspace=frontend -- --runInBand` 통과 (5 suites, 15 tests)
  - `npm run test:e2e --workspace=frontend` 통과 (4 scenarios)

---

## ✅ 완료

- [x] Phase 0: 프로젝트 구조 초기화
- [x] Phase 1: 데이터베이스 설정 (backend-agent)
- [x] Phase 2: Core Services (backend-agent)
- [x] Phase 3: API Routes (backend-agent)
- [x] Phase 4: 프론트엔드 기초 (frontend-agent)
- [x] Phase 5: Auth Forms (frontend-agent)
- [x] Phase 6: Protected Routes (frontend-agent)
- [x] Phase 7: Backend Testing (qa-agent)

---

## 🔄 진행 중

- [ ] **Phase 8: Frontend Testing (qa-agent 진행 중)**
  - 컴포넌트 테스트 확장
  - E2E 테스트(Playwright) 시나리오 확장

---

## 📋 해야 할 일

### Frontend

- [ ] **Phase 8: Frontend Testing**
  - 컴포넌트 테스트 (React Testing Library) 추가 확장
  - E2E 테스트 (Playwright) 엣지케이스 추가
  - 테스트 mock, utilities

### Backend (Optional Hardening)

- [ ] 테스트 DB 강제 검증 루틴 점검
  - `REQUIRE_DB_TESTS=true npm run test --workspace=backend -- --runInBand`

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

# Frontend E2E
npm run test:e2e --workspace=frontend
```

---

## 📊 진행률

**전체:** 8/12 phases (67%)

**Backend:** 4/4 phases
- ✅ Database
- ✅ Core Services
- ✅ API Routes
- ✅ Testing

**Frontend:** 3/4 phases
- ✅ Foundation
- ✅ Auth Forms
- ✅ Protected Routes
- 🔄 Testing

**Final:** 0/3 phases
- ⏸️ Security Audit
- ⏸️ Documentation
- ⏸️ Integration

---

## 💡 다음 우선순위

1. **Phase 8 진행** - Frontend testing (RTL + Playwright)
2. **테스트 DB 강제 검증** - `REQUIRE_DB_TESTS=true` 경로 확인
3. **Security audit** (구현/테스트 완료 후)
4. **Documentation & Integration** (최종)

---

## 🎯 각 Phase 상세 (필요시 참고)

자세한 내용은 `PROGRESS.md` 참고
