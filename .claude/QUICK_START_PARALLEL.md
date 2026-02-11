# 🚀 병렬 2개 계정 Team Agents 빠른 시작 가이드

## ✅ 완료된 개선 사항

### 1. Codex에게 코드 수정 권한 부여 ✅
- `codex-reviewer.yaml` → `read_only: false`로 변경
- `write`, `edit` 도구 추가
- Codex CLI 분석 결과를 바탕으로 자동 수정 가능
- **중요**: Codex가 직접 수정하는 것이 아니라, beta-codex (Claude agent)가 Codex 분석 결과를 보고 수정

### 2. 병렬 계정 아키텍처 구현 ✅
- Team Alpha (계정 1) + Team Beta (계정 2) 구조
- 파일 기반 통신 시스템
- 헬퍼 스크립트 자동 생성
- 에이전트 설정 파일 완성

---

## 📋 사전 준비 완료 체크리스트

✅ 2개 Claude Pro 계정
✅ Codex CLI 0.98.0 설치
✅ 디렉토리 구조 생성 (`.claude/sync/`)
✅ 6개 에이전트 YAML 파일 생성
✅ 헬퍼 스크립트 생성 및 실행 권한 부여

---

## 🎯 에이전트 구성

### Team Alpha (계정 1: tjeom01@gmail.com) - 개발팀
```
auth-system-team-alpha
├─ alpha-lead (Opus 4.6) - 개발 조율
├─ alpha-backend (Sonnet 4.5) - 백엔드 개발
└─ alpha-frontend (Sonnet 4.5) - 프론트엔드 개발
```

### Team Beta (계정 2: eomtj2001@gmail.com) - 품질/보안팀
```
auth-system-team-beta
├─ beta-lead (Opus 4.6) - 품질 조율
├─ beta-codex (Sonnet 4.5) - Codex 기반 보안 감사 + 자동 수정
└─ beta-qa (Sonnet 4.5) - 테스트 작성 및 실행
```

---

## 🚀 실행 방법

### 1단계: 터미널 1 - Team Alpha 시작

```bash
# 터미널 1 열기
cd /home/tj/projects/auth-system
claude --account tjeom01@gmail.com
```

Claude Code 내부에서:
```
TeamCreate로 팀 생성:
- team_name: auth-system-team-alpha
- description: Development team for feature implementation

그 다음 agents 스폰:
1. alpha-lead (team-lead 역할)
2. alpha-backend
3. alpha-frontend
```

### 2단계: 터미널 2 - Team Beta 시작

```bash
# 새 터미널 열기 (tmux 또는 별도 창)
cd /home/tj/projects/auth-system
claude --account eomtj2001@gmail.com
```

Claude Code 내부에서:
```
TeamCreate로 팀 생성:
- team_name: auth-system-team-beta
- description: Quality assurance and security team

그 다음 agents 스폰:
1. beta-lead (team-lead 역할)
2. beta-codex
3. beta-qa
```

---

## 🔄 워크플로우 예시

### 시나리오: 새 API 엔드포인트 추가

#### 터미널 1 (Team Alpha)
```
사용자: "POST /api/auth/2fa 엔드포인트를 추가해줘"

[alpha-lead] 작업 분해 및 할당
  → alpha-backend: 백엔드 구현
  → alpha-frontend: UI 컴포넌트 작성

[alpha-backend] backend/src/routes/2fa.ts 작성 완료
[alpha-frontend] frontend/components/TwoFactorForm.tsx 작성 완료

[alpha-lead] 리뷰 작업 생성
  $ ./scripts/team-helpers/create-task.sh alpha beta code_review \
      backend/src/routes/2fa.ts \
      frontend/components/TwoFactorForm.tsx

  → 파일 생성: .claude/sync/tasks/pending/task_XXXXX_code_review.json
```

#### 터미널 2 (Team Beta) - 자동으로 감지
```
[beta-lead] 새 작업 감지
  → Task ID: task_XXXXX_code_review
  → Type: code_review
  → Files: 2개
  → Assigned to: beta-codex

[beta-codex] Codex 보안 감사 시작
  $ codex review backend/src/routes/2fa.ts

  발견된 이슈:
  ❌ CRITICAL: SQL injection vulnerability (line 45)
  ❌ HIGH: JWT secret hardcoded (line 23)
  ⚠️  MEDIUM: Missing rate limiting

[beta-codex] 자동 수정 적용
  ✅ SQL injection 수정: parameterized query 적용
  ✅ JWT secret 수정: process.env.JWT_SECRET 사용
  📝 Rate limiting: 수동 검토 필요 (메시지 전송)

[beta-qa] 테스트 실행
  $ cd backend && npm test
  ✅ All tests passing
  📊 Coverage: 89%

[beta-lead] 작업 완료
  → 결과 작성 및 파일 이동
  → .claude/sync/tasks/completed/task_XXXXX_code_review.json

  Result:
  {
    "status": "completed",
    "auto_fixed": 2,
    "manual_review": 1,
    "tests_passing": true,
    "approval": "APPROVED_WITH_WARNINGS"
  }
```

#### 터미널 1 (Team Alpha) - 결과 확인
```
[alpha-lead] 완료된 작업 확인
  $ cat .claude/sync/tasks/completed/task_XXXXX_code_review.json

  → 2개 보안 이슈 자동 수정됨
  → Rate limiting 추가 권장
  → 테스트 통과

[alpha-lead] Rate limiting 추가 작업 할당
  → alpha-backend: rate limiting 미들웨어 추가

[alpha-backend] 추가 작업 완료
[alpha-lead] 재리뷰 요청 또는 승인
```

---

## 🛠️ 헬퍼 스크립트 사용법

### 1. 작업 생성
```bash
./scripts/team-helpers/create-task.sh alpha beta code_review file1.ts file2.ts
```

### 2. 작업 모니터링
```bash
./scripts/team-helpers/monitor-tasks.sh
```

출력:
```
⏳ PENDING:
  - task_1234_code_review
    Type: code_review | From: alpha | To: beta

🔄 IN PROGRESS:
  - task_5678_security_audit
    Type: security_audit | Assigned: beta-codex

✅ COMPLETED:
  - task_9012_testing
```

### 3. 상태 업데이트
```bash
./scripts/team-helpers/update-status.sh alpha working
./scripts/team-helpers/update-status.sh beta reviewing
```

### 4. 다른 팀 모니터링
```bash
# Team Alpha에서 Beta 상태 확인
./scripts/team-helpers/watch-other-team.sh beta

# Team Beta에서 Alpha 상태 확인
./scripts/team-helpers/watch-other-team.sh alpha
```

---

## 📨 팀 간 통신

### Team Alpha → Team Beta 메시지
```bash
# 터미널 1 (Alpha)
cat > .claude/sync/messages/alpha_to_beta/msg_$(date +%s).txt << 'EOF'
From: alpha-lead
To: beta-lead
Subject: Rate limiting implementation needed

We've added the 2FA endpoint but need rate limiting on:
- POST /api/auth/2fa/verify (max 5 attempts per 15 minutes)
- POST /api/auth/2fa/enable (max 3 attempts per hour)

Please review and advise on best approach.
EOF
```

### Team Beta → Team Alpha 메시지
```bash
# 터미널 2 (Beta)
cat > .claude/sync/messages/beta_to_alpha/msg_$(date +%s).txt << 'EOF'
From: beta-lead
To: alpha-lead
Subject: Re: Rate limiting implementation

Recommend using express-rate-limit middleware:
- 2FA verify: 5 requests per 15 min per IP
- 2FA enable: 3 requests per hour per user

I'll create a sample implementation for review.
EOF
```

---

## ⚠️ 주의사항

### 1. Git 충돌 방지
```bash
# 작업 전에 항상 pull
git pull origin main

# 작업 완료 후 즉시 commit & push
git add .
git commit -m "Feature: 2FA implementation"
git push origin main
```

### 2. 파일 잠금 확인
```bash
# 파일 수정 전에 잠금 확인
ls .claude/sync/locks/

# 잠금이 있으면 대기 또는 다른 작업
```

### 3. 상태 파일 동기화
```bash
# 정기적으로 상태 업데이트
./scripts/team-helpers/update-status.sh <team> <status>
```

---

## 🎉 장점

1. **병렬 작업**: 개발과 리뷰 동시 진행
2. **역할 분리**: 개발팀 vs 품질팀 명확한 책임
3. **사용량 분산**: 두 계정에 API 사용량 분산
4. **Extra Usage 활용**: Beta 팀에서 집약적 분석 작업
5. **보안 강화**: Codex 기반 전담 보안 감사 + 자동 수정
6. **자동화**: 파일 기반 작업 큐로 수동 조율 최소화

---

## 📊 비용 최적화

### Team Alpha (일반 Pro 계정)
- 일상적인 개발 작업
- 작은 변경 및 버그 수정
- 문서 작성

### Team Beta (Extra Usage 계정)
- 대규모 코드베이스 분석
- 집약적 보안 감사
- 종합 테스트 실행
- 복잡한 리팩토링 리뷰

---

## 🔍 테스트 시나리오

### 간단한 테스트
```bash
# 터미널 1
./scripts/team-helpers/create-task.sh alpha beta testing backend/

# 터미널 2에서 beta-lead가 자동으로 처리하는지 확인
```

### 보안 감사 테스트
```bash
# 터미널 1에서 의도적으로 취약한 코드 작성
# 터미널 2에서 beta-codex가 자동 수정하는지 확인
```

---

## 🆘 문제 해결

### 작업이 처리되지 않을 때
```bash
# 상태 파일 확인
cat .claude/sync/status/beta_status.json

# pending 작업 확인
ls -la .claude/sync/tasks/pending/

# beta-lead에게 명시적으로 작업 할당 메시지 전송
```

### 계정 전환 안 될 때
```bash
# 현재 계정 확인
cat ~/.claude/.claude.json | grep emailAddress

# 명시적으로 계정 지정
claude --account eomtj2001@gmail.com
```

---

## 📚 추가 문서

- `PARALLEL_ACCOUNTS_ARCHITECTURE.md` - 상세 아키텍처 설명
- `DUAL_ACCOUNT_STRATEGY.md` - 4가지 계정 활용 전략
- `.claude/sync/README.md` - 통신 프로토콜 상세
- `IMPROVEMENTS_2026-02-12.md` - 전체 개선 사항 요약

---

## 🎯 다음 단계

1. ✅ 설정 완료 - 이미 완료됨
2. 🚀 실제 테스트 - 두 터미널에서 팀 생성
3. 📊 워크플로우 검증 - 간단한 작업으로 통신 테스트
4. 🔧 필요시 조정 - 피드백 기반 개선

---

**준비 완료!** 이제 두 개의 터미널을 열고 각각의 계정으로 팀을 생성하면 됩니다! 🚀
