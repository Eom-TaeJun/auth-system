# Team Communication Directory

Canonical policy: `.claude/OPERATING_MODEL.md`

## Structure
- `tasks/pending/` - Tasks waiting to be picked up
- `tasks/in_progress/` - Currently active tasks
- `tasks/completed/` - Finished tasks with results
- `messages/alpha_to_beta/` - Messages from Team Alpha to Team Beta
- `messages/beta_to_alpha/` - Messages from Team Beta to Team Alpha
- `status/` - Current status of each team
- `locks/` - File locks to prevent concurrent modifications
- `reports/` - Optional review/test/security reports

## Task File Format (Schema v2)
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
  "description": "What needs to be done",
  "constraints": ["Do not change contracts"],
  "validation_commands": ["npm test"],
  "acceptance_criteria": ["All tests pass"],
  "created_at": "ISO 8601 timestamp",
  "assigned_to": null,
  "state": "pending|in_progress|completed|blocked"
}
```

## Usage
1. Team Alpha creates tasks in `tasks/pending/`
2. Team Beta monitors and picks up tasks
3. Results go to `tasks/completed/`
4. Status files are updated regularly
