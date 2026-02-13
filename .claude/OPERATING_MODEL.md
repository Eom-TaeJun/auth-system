# Auth-System Operating Model

Last Updated: 2026-02-12

## Decisions (Locked)
- `autofix`: **allowed**
- `default topology`: **2 accounts (Alpha + Beta)**
- `execution default`: **Codex**
- `reasoning/review`: **Opus lead agents**

## Account Topology (Default)

### Account 1: Alpha (Development)
- `alpha-lead` (Opus): planning, dependency ordering, approval gate
- `alpha-backend` (Sonnet): backend implementation
- `alpha-frontend` (Sonnet): frontend implementation
- `alpha-codex` (Sonnet): fast Codex-driven quality checks + targeted auto-fix
- `codex-executor` (Haiku): delegates heavy coding tasks to `codex exec`

### Account 2: Beta (QA/Security)
- `beta-lead` (Opus): quality/security orchestration and final QA gate
- `beta-codex` (Sonnet): deep security review + auto-fix
- `beta-qa` (Sonnet): test expansion, integration/e2e verification
- `beta-monitor` (Haiku): queue/status monitor

## Auto-Fix Policy
Auto-fix is enabled for both `alpha-codex` and `beta-codex`.

### Allowed auto-fix scope
- Deterministic security fixes (parameterized SQL, secret handling, validation guards)
- Deterministic correctness fixes (null checks, obvious type/runtime mismatches)
- Deterministic test fixes directly tied to changed behavior

### Required guardrails
- Stay within task/work-order `scope_files`
- Record `changed_files`, `commands_run`, `validation_results`
- If design/contract change is needed: stop and return `BLOCKED`
- Never claim pass without command output evidence

## Task Contract (Schema v2)
All files under `.claude/sync/tasks/*` should follow this structure:

```json
{
  "schema_version": "2",
  "id": "task_<timestamp>_<type>",
  "from_team": "alpha|beta",
  "to_team": "alpha|beta",
  "type": "code_review|testing|security_audit|performance_test|bug_fix|feature",
  "priority": "low|medium|high|critical",
  "executor": "codex|claude",
  "auto_fix_allowed": true,
  "scope_files": ["path/to/file.ts"],
  "description": "what to do",
  "constraints": ["no contract change"],
  "validation_commands": ["npm test"],
  "acceptance_criteria": ["all tests pass"],
  "created_at": "ISO 8601",
  "assigned_to": null,
  "state": "pending|in_progress|completed|blocked"
}
```

## Canonical Files
- Team definitions: `.claude/agents/*.yaml`
- Queue/state: `.claude/sync/`
- Setup: `scripts/setup-parallel-teams.sh`
- Helper scripts: `scripts/team-helpers/*.sh`

## Notes
- `IMPLEMENTATION_PLAN.md` is a historical planning artifact.
- Current truth for completion/progress is `PROGRESS.md`, `STATUS.md`, and task artifacts in `.claude/sync/`.
