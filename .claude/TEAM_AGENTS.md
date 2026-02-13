# Team Agents 운영 가이드

프로젝트: `/home/tj/projects/auth-system`
기준 문서: `.claude/OPERATING_MODEL.md`

## 1) 기본 토폴로지
- 기본은 **2계정 병렬 운영**이다.
- Account Alpha: 개발 중심
- Account Beta: QA/보안 중심

## 2) 권장 역할 구성
- `alpha-lead` / `beta-lead`: Opus 조율 및 승인 게이트
- `alpha-backend`, `alpha-frontend`: 구현 담당
- `alpha-codex`, `beta-codex`: Codex 기반 리뷰 + **auto-fix 허용**
- `beta-qa`: 테스트/검증 담당
- `codex-executor`(선택): 대규모 구현을 `codex exec`에 위임

## 3) 핵심 운영 원칙
- 같은 파일을 두 에이전트가 동시에 수정하지 않는다.
- 모든 작업은 `.claude/sync/tasks/`의 task contract를 따른다.
- auto-fix는 허용하지만, scope/constraints를 벗어나면 안 된다.
- 변경 완료 시 반드시 validation command 결과를 첨부한다.
- 설계/계약 변경이 필요하면 즉시 `BLOCKED`로 리턴하고 lead 승인 후 재개한다.

## 4) 최소 핸드오프 템플릿
```text
[Task]
Owner:
Scope:
Constraints:
Validation Commands:

[Done]
Changed files:
Validation output:

[Risk]
Open issues:
Need approval:
```
