# Team Agents 운영 가이드

프로젝트: `/home/tj/projects/auth-system`

## 1) 권장 역할 구성
- `team-lead`: 작업 분배, 의존성 확인, 완료 기준 점검
- `backend-agent`: `backend/**` 전담
- `frontend-agent`: `frontend/**` 전담
- `qa-agent`: 테스트/검증 전담
- `codex-reviewer`: 보안 리뷰 전담(read-only)

Agent 정의 파일:
- `.claude/agents/team-lead.yaml`
- `.claude/agents/backend-agent.yaml`
- `.claude/agents/frontend-agent.yaml`
- `.claude/agents/qa-agent.yaml`
- `.claude/agents/codex-reviewer.yaml`

## 2) Claude Code와 동시 작업 규칙
- 같은 파일을 두 에이전트가 동시에 수정하지 않는다.
- 소유권을 고정한다:
  - 백엔드 변경: Claude Code 또는 backend-agent 중 하나만
  - 프론트 변경: Claude Code 또는 frontend-agent 중 하나만
  - 테스트/리뷰: qa-agent, codex-reviewer
- `PROGRESS.md`에 현재 담당자와 대상 경로를 먼저 기록하고 시작한다.
- 대규모 수정 전 `git status --short`로 충돌 가능성을 확인한다.

## 3) 권장 병렬 실행 패턴
1. `team-lead`가 이번 사이클 목표를 2~3개로 제한
2. 백엔드/프론트를 서로 다른 경로로 분리해서 병렬 진행
3. 각 에이전트는 완료 시 변경 파일 + 검증 결과만 보고
4. 마지막에 `qa-agent`와 `codex-reviewer`로 품질/보안 확인

## 4) 최소 핸드오프 템플릿
다음 형식으로 전달:

```text
[Task]
Phase:
Owner:
Scope:

[Done]
Changed files:
Validation:

[Risk]
Open issues:
```
