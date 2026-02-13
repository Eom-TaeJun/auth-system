# 2개 Claude 계정 활용 전략

> Canonical policy: .claude/OPERATING_MODEL.md (conflict 시 기준 문서 우선, auto-fix 허용, 2계정 기본).

## 현재 계정 상황
- **계정 1 (claude)**: tjeom01@gmail.com - Claude Pro
- **계정 2 (claude1)**: eomtj2001@gmail.com - Claude Pro + Extra Usage

## 제약 사항
⚠️ **Team agents는 단일 세션(계정) 내에서만 동작**
- 하나의 팀에서 여러 계정의 agents를 혼용할 수 없음
- 각 agent는 스폰한 계정의 API 사용량 소비

---

## 전략 1: 역할 기반 계정 분리 (권장) ⭐

### 계정 1 (claude - 기본 계정)
**역할**: 일상 개발 및 팀 협업
```bash
# 기본 계정으로 실행
claude
```

**사용 케이스**:
- Team agents 운영 (leader + 4 specialists)
- 일반 코딩 작업
- 문서 작성
- 가벼운 리팩토링

### 계정 2 (claude1 - Extra Usage)
**역할**: 고비용 작업 전용
```bash
# Extra Usage 계정으로 실행
claude --account eomtj2001@gmail.com
```

**사용 케이스**:
- 대규모 코드베이스 탐색
- 복잡한 아키텍처 설계 (Plan mode)
- 장시간 디버깅 세션
- 대량 파일 처리
- Web search 집약적 작업

---

## 전략 2: 프로젝트 기반 분리

### 계정 1: auth-system (현재 프로젝트)
- Team agents 활성화
- 점진적 개발

### 계정 2: 새 프로젝트 또는 연구 작업
- 독립적인 세션
- 실험적 기능 테스트

---

## 전략 3: 병렬 세션 (동시 작업)

**터미널 1 (계정 1)**:
```bash
cd /home/tj/projects/auth-system
claude
# Team agents로 백엔드 개발
```

**터미널 2 (계정 2)**:
```bash
cd /home/tj/projects/auth-system
claude --account eomtj2001@gmail.com
# Codex CLI로 보안 감사 수행
```

### 장점:
- ✅ 사용량 분산
- ✅ 독립적인 컨텍스트
- ✅ 블로킹 없이 병렬 진행

### 단점:
- ❌ 수동 조율 필요 (두 세션 간 소통 불가)
- ❌ Git 충돌 위험 (파일 동시 수정)
- ❌ 컨텍스트 공유 불가

---

## 전략 4: 핸드오프 패턴 (순차 작업)

```bash
# Phase 1: 계정 1로 구현
claude
# 코드 작성 완료

# Phase 2: 계정 2로 리뷰
claude --account eomtj2001@gmail.com
# 보안 감사 및 최적화
```

---

## Codex 통합 고려사항

### 현재 구조:
```
Claude Team Agents (계정 1)
├─ team-lead (Claude Opus 4.6)
├─ backend-agent (Claude Sonnet 4.5)
├─ frontend-agent (Claude Sonnet 4.5)
├─ qa-agent (Claude Sonnet 4.5)
└─ codex-reviewer (Claude Sonnet 4.5)
    └─ Bash: codex review --uncommitted
```

**중요**: Codex는 별도 CLI 도구
- Codex 자체는 에이전트가 아님
- codex-reviewer가 **Claude agent**로 bash를 통해 codex 명령어 실행
- Codex API 사용량은 별도 (Claude 사용량과 무관)

---

## 추천 워크플로우

### 일상 개발 (계정 1):
```bash
claude  # 기본 계정
# Team agents로 feature 개발
# codex-reviewer가 자동으로 Codex CLI 호출
```

### 대규모 작업 (계정 2):
```bash
claude --account eomtj2001@gmail.com
# Extra Usage로 대용량 작업
```

### 계정 전환:
```bash
# 현재 계정 확인
claude --version  # 설정 확인

# 계정 전환
claude --account eomtj2001@gmail.com

# 기본 계정으로 복귀
claude --account tjeom01@gmail.com
# 또는 그냥
claude
```

---

## 사용량 모니터링

### 계정 1 확인:
```bash
cat ~/.claude/.claude.json | grep -A 5 '"lastCost"'
```

### 계정 2 확인:
```bash
cat ~/.claude-account1/.claude.json | grep -A 5 '"lastCost"'
```

---

## 결론

**최적 전략**: 역할 기반 분리 (전략 1)
- 계정 1: 일상 개발 + Team agents
- 계정 2: 고비용 작업 전용

**주의사항**:
- Team agents 내에서 계정 혼용 불가
- 병렬 세션 시 Git 충돌 주의
- Codex는 모든 계정에서 동일하게 사용 가능 (별도 서비스)
