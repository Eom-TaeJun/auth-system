# 병렬 2개 계정 에이전트 아키텍처

## 목표
Claude1(eomtj2001@gmail.com)과 Claude(tjeom01@gmail.com)를 **동시에** 다른 에이전트로 실행하여 병렬 작업

---

## 🏗️ 아키텍처 설계

### 전체 구조
```
프로젝트: /home/tj/projects/auth-system

┌─────────────────────────────────────────────────────────────┐
│  터미널 1 (계정 1: tjeom01@gmail.com)                         │
│  Team: auth-system-team-alpha                                │
│  ├─ alpha-lead (Opus 4.6) - 전체 조율                        │
│  ├─ alpha-backend (Sonnet 4.5) - 백엔드 개발                 │
│  └─ alpha-frontend (Sonnet 4.5) - 프론트엔드 개발            │
└─────────────────────────────────────────────────────────────┘
                              ↕
          파일 기반 통신 (.claude/sync/)
                              ↕
┌─────────────────────────────────────────────────────────────┐
│  터미널 2 (계정 2: eomtj2001@gmail.com - Extra Usage)        │
│  Team: auth-system-team-beta                                 │
│  ├─ beta-lead (Opus 4.6) - 품질/보안 조율                    │
│  ├─ beta-codex (Sonnet 4.5) - Codex 보안 감사 + 자동 수정   │
│  └─ beta-qa (Sonnet 4.5) - 테스트 작성 및 검증              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 파일 기반 통신 시스템

### 공유 디렉토리 구조
```
/home/tj/projects/auth-system/.claude/sync/
├── tasks/                  # 작업 큐
│   ├── pending/           # 대기 중인 작업
│   ├── in_progress/       # 진행 중인 작업
│   └── completed/         # 완료된 작업
├── messages/              # 팀 간 메시지
│   ├── alpha_to_beta/
│   └── beta_to_alpha/
└── status/                # 상태 파일
    ├── alpha_status.json
    └── beta_status.json
```

### 작업 파일 형식 (JSON)
```json
{
  "id": "task_001",
  "from_team": "alpha",
  "to_team": "beta",
  "type": "code_review",
  "priority": "high",
  "files": ["backend/src/routes/auth.ts"],
  "description": "Review authentication endpoint security",
  "created_at": "2026-02-12T10:30:00Z",
  "assigned_to": "beta-codex"
}
```

---

## 🎯 역할 분담

### Team Alpha (계정 1 - 일반 개발)
**역할**: 기능 개발 및 구현
- **alpha-lead**: 전체 조율, 작업 분배
- **alpha-backend**: 백엔드 코드 작성
- **alpha-frontend**: 프론트엔드 코드 작성

**작업 흐름**:
1. 새 기능 구현
2. 코드 작성 완료
3. 작업 파일 생성 → `.claude/sync/tasks/pending/`
4. beta 팀의 리뷰 대기

### Team Beta (계정 2 - 품질/보안)
**역할**: 품질 보증 및 보안 감사
- **beta-lead**: 품질 조율, 최종 승인
- **beta-codex**: Codex CLI 기반 보안 감사 + 자동 수정
- **beta-qa**: 테스트 작성 및 실행

**작업 흐름**:
1. pending 작업 모니터링
2. Codex로 보안 감사
3. 자동 수정 적용 (가능한 경우)
4. 테스트 실행
5. 결과 보고 → `.claude/sync/tasks/completed/`

---

## 🚀 실행 방법

### 터미널 1 (Team Alpha) 시작
```bash
cd /home/tj/projects/auth-system
claude --account tjeom01@gmail.com

# Claude Code 내부에서:
# TeamCreate로 auth-system-team-alpha 생성
# alpha-lead, alpha-backend, alpha-frontend 스폰
```

### 터미널 2 (Team Beta) 시작
```bash
cd /home/tj/projects/auth-system
claude --account eomtj2001@gmail.com

# Claude Code 내부에서:
# TeamCreate로 auth-system-team-beta 생성
# beta-lead, beta-codex, beta-qa 스폰
```

---

## 🔄 워크플로우 예시

### 시나리오: 새 인증 엔드포인트 추가

#### Phase 1 - 개발 (Team Alpha)
```
터미널 1:
[alpha-lead] 새 작업: /api/auth/2fa 엔드포인트 추가
[alpha-backend] 코드 작성 중...
[alpha-backend] 완료! backend/src/routes/2fa.ts 생성
[alpha-frontend] UI 컴포넌트 작성 중...
[alpha-frontend] 완료! frontend/components/TwoFactorForm.tsx

[alpha-lead] 작업 파일 생성:
  → .claude/sync/tasks/pending/task_2fa_review.json
  → 내용: "beta-codex에게 보안 리뷰 요청"
```

#### Phase 2 - 리뷰 (Team Beta)
```
터미널 2:
[beta-lead] 새 작업 감지: task_2fa_review.json
[beta-lead] beta-codex에게 할당

[beta-codex] Codex CLI 실행 중...
  $ codex review backend/src/routes/2fa.ts
  → 발견: SQL injection 위험 (line 45)
  → 발견: JWT secret hardcoded (line 23)

[beta-codex] 자동 수정 적용 중...
  ✓ Parameterized query 적용
  ✓ JWT secret을 env 변수로 이동

[beta-qa] 테스트 실행 중...
  $ npm test backend/tests/2fa.test.ts
  ✓ All tests passed

[beta-lead] 결과 보고:
  → .claude/sync/tasks/completed/task_2fa_review.json
  → 메시지: "2개 보안 이슈 자동 수정 완료, 테스트 통과"
```

#### Phase 3 - 확인 (Team Alpha)
```
터미널 1:
[alpha-lead] 완료 작업 확인
[alpha-lead] Git diff 검토
[alpha-lead] 승인 및 커밋
  $ git add .
  $ git commit -m "Add 2FA endpoint (reviewed by beta-codex)"
```

---

## 🛡️ 충돌 방지 전략

### 1. Git 브랜치 분리
```bash
# Team Alpha
git checkout -b feature/alpha-2fa-implementation

# Team Beta
git checkout feature/alpha-2fa-implementation
# Read-only 또는 별도 리뷰 브랜치
git checkout -b review/beta-2fa-security
```

### 2. 파일 경로 분리
- **Team Alpha**: `backend/`, `frontend/` 작성
- **Team Beta**: 주로 읽기, 필요시 수정 (별도 커밋)

### 3. 작업 잠금 (Lock File)
```
.claude/sync/locks/backend-routes-auth.lock
→ Team이 특정 파일 작업 중일 때 생성
→ 다른 팀은 해당 파일 수정 대기
```

---

## 📊 상태 모니터링

### alpha_status.json 예시
```json
{
  "team": "alpha",
  "account": "tjeom01@gmail.com",
  "status": "active",
  "current_task": "feature/2fa-implementation",
  "agents": {
    "alpha-lead": "idle",
    "alpha-backend": "working",
    "alpha-frontend": "idle"
  },
  "last_update": "2026-02-12T10:45:00Z"
}
```

### 모니터링 명령어
```bash
# Team Alpha에서
watch -n 5 cat .claude/sync/status/beta_status.json

# Team Beta에서
watch -n 5 cat .claude/sync/status/alpha_status.json
```

---

## 🎛️ 헬퍼 스크립트

### 작업 생성 스크립트
```bash
# scripts/create-task.sh
#!/bin/bash
TASK_ID="task_$(date +%s)"
cat > .claude/sync/tasks/pending/${TASK_ID}.json << EOF
{
  "id": "$TASK_ID",
  "from_team": "alpha",
  "to_team": "beta",
  "type": "$1",
  "files": $(printf '%s\n' "${@:2}" | jq -R . | jq -s .),
  "created_at": "$(date -Iseconds)"
}
EOF
echo "Created task: $TASK_ID"
```

### 사용 예시
```bash
./scripts/create-task.sh code_review backend/src/routes/2fa.ts
```

---

## 🔧 에이전트 설정 파일

### Team Alpha 에이전트

#### `.claude/agents/alpha-lead.yaml`
```yaml
name: alpha-lead
model: opus
subagent_type: general-purpose
description: Team Alpha coordinator - manages development workflow

prompt: |
  You are the leader of Team Alpha (development team).

  Monitor: .claude/sync/tasks/completed/
  Create tasks in: .claude/sync/tasks/pending/
  Update status: .claude/sync/status/alpha_status.json

  After completing development work, create review tasks for Team Beta.

tools:
  - bash
  - read
  - write
  - edit
  - grep
  - glob

permissions:
  read_only: false
  allow_bash: true
```

#### `.claude/agents/alpha-backend.yaml`
```yaml
name: alpha-backend
model: sonnet
subagent_type: general-purpose
description: Backend development specialist

prompt: |
  You are the backend developer for Team Alpha.
  Focus on: backend/ directory
  After completing code, notify alpha-lead.

tools:
  - bash
  - read
  - write
  - edit
  - grep
  - glob

permissions:
  read_only: false
  allow_bash: true
```

### Team Beta 에이전트

#### `.claude/agents/beta-lead.yaml`
```yaml
name: beta-lead
model: opus
subagent_type: general-purpose
description: Team Beta coordinator - manages quality and security

prompt: |
  You are the leader of Team Beta (quality & security team).

  Monitor: .claude/sync/tasks/pending/
  Complete tasks to: .claude/sync/tasks/completed/
  Update status: .claude/sync/status/beta_status.json

  Assign security reviews to beta-codex.
  Assign testing to beta-qa.

tools:
  - bash
  - read
  - write
  - edit
  - grep
  - glob

permissions:
  read_only: false
  allow_bash: true
```

#### `.claude/agents/beta-codex.yaml`
```yaml
name: beta-codex
model: sonnet
subagent_type: general-purpose
description: Security auditor using Codex CLI with auto-fix capability

prompt: |
  You are the security specialist for Team Beta.

  1. Run: codex review --uncommitted
  2. Analyze findings
  3. Auto-fix issues when possible (use write/edit tools)
  4. Report results to beta-lead

  You have WRITE permissions to fix security issues.

tools:
  - bash
  - read
  - write
  - edit
  - grep
  - glob

permissions:
  read_only: false
  allow_bash: true
```

---

## 💾 초기 설정

### 1. 디렉토리 생성
```bash
mkdir -p .claude/sync/{tasks/{pending,in_progress,completed},messages/{alpha_to_beta,beta_to_alpha},status,locks}
```

### 2. 초기 상태 파일
```bash
# Alpha 상태
cat > .claude/sync/status/alpha_status.json << 'EOF'
{
  "team": "alpha",
  "account": "tjeom01@gmail.com",
  "status": "initializing",
  "agents": {},
  "last_update": ""
}
EOF

# Beta 상태
cat > .claude/sync/status/beta_status.json << 'EOF'
{
  "team": "beta",
  "account": "eomtj2001@gmail.com",
  "status": "initializing",
  "agents": {},
  "last_update": ""
}
EOF
```

### 3. 에이전트 파일 생성
```bash
# 위의 yaml 파일들을 .claude/agents/ 디렉토리에 생성
```

---

## ⚠️ 주의사항

### 동시 수정 충돌
- 같은 파일을 동시에 수정하지 않도록 작업 분리
- Lock 파일로 충돌 방지
- Git을 자주 pull/push

### 통신 지연
- 파일 기반 통신은 실시간이 아님
- 5-10초 간격으로 폴링 필요
- 중요한 작업은 명시적으로 확인

### 비용 관리
- 두 계정 동시 사용 시 비용 2배
- Beta 팀은 필요할 때만 활성화
- Alpha 작업 완료 후 Beta 호출 권장

---

## 🎉 장점

1. **병렬 작업**: 개발과 리뷰 동시 진행
2. **역할 분리**: 개발팀 vs 품질팀
3. **사용량 분산**: 두 계정에 로드 분산
4. **Extra Usage 활용**: Beta 팀에서 집약적 작업
5. **보안 강화**: 전담 보안 에이전트 (beta-codex)

---

## 🚀 시작하기

```bash
# 1. 초기 설정
./scripts/setup-parallel-teams.sh

# 2. 터미널 1 시작
claude --account tjeom01@gmail.com
# TeamCreate로 alpha 팀 생성

# 3. 터미널 2 시작 (새 터미널)
claude --account eomtj2001@gmail.com
# TeamCreate로 beta 팀 생성

# 4. 작업 시작!
```
