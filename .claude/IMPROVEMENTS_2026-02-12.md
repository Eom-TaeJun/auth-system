# Team Agents 개선 반영 (2026-02-12)

## 적용된 운영 결정
- `autofix`: 허용
- `default topology`: 2계정 병렬(Alpha/Beta)
- `execution default`: Codex

## 반영 내용
1. 기준 문서 추가: `.claude/OPERATING_MODEL.md`
2. 운영 가이드 정합화: `.claude/TEAM_AGENTS.md`
3. 병렬 셋업 스크립트 개선:
   - 프로젝트 경로 하드코딩 제거
   - task schema v2 필드 반영
   - helper 스크립트 생성 로직 강화
4. task 생성 헬퍼 개선:
   - 공백 경로 안전 처리
   - `executor`, `auto_fix_allowed`, `scope_files`, `state` 포함

## 정책 명확화
- `codex-reviewer`, `alpha-codex`, `beta-codex`는 auto-fix 가능
- 단, `scope_files`/`constraints`/`validation_commands`를 반드시 준수
- 설계/계약 변경 필요 시 auto-fix 금지, lead 승인 필요

## 현재 권장 실행 흐름
1. lead(Opus)가 task 생성
2. executor(Codex default)가 구현/수정 수행
3. QA/Security가 검증
4. lead가 최종 승인

## 참고
기존 일부 문서에 있던 "Codex는 읽기 전용" 설명은 더 이상 기본 정책이 아니다.
최신 기준은 `.claude/OPERATING_MODEL.md`를 따른다.
