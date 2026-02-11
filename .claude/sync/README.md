# Team Communication Directory

## Structure
- `tasks/pending/` - Tasks waiting to be picked up
- `tasks/in_progress/` - Currently active tasks
- `tasks/completed/` - Finished tasks with results
- `messages/alpha_to_beta/` - Messages from Team Alpha to Team Beta
- `messages/beta_to_alpha/` - Messages from Team Beta to Team Alpha
- `status/` - Current status of each team
- `locks/` - File locks to prevent concurrent modifications

## Task File Format
```json
{
  "id": "task_TIMESTAMP",
  "from_team": "alpha|beta",
  "to_team": "alpha|beta",
  "type": "code_review|testing|bug_fix|feature",
  "priority": "low|medium|high|critical",
  "files": ["path/to/file1.ts", "path/to/file2.ts"],
  "description": "What needs to be done",
  "created_at": "ISO 8601 timestamp",
  "assigned_to": "agent-name"
}
```

## Lock File Format
```
TEAM_NAME
AGENT_NAME
TIMESTAMP
```

## Usage
1. Team Alpha creates tasks in `tasks/pending/`
2. Team Beta monitors and picks up tasks
3. Results go to `tasks/completed/`
4. Status files are updated regularly
