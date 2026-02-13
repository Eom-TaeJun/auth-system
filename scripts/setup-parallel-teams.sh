#!/usr/bin/env bash
# Setup script for parallel two-account team agents architecture

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SYNC_DIR="${PROJECT_ROOT}/.claude/sync"
HELPER_DIR="${PROJECT_ROOT}/scripts/team-helpers"

ACCOUNT_ALPHA="${ACCOUNT_ALPHA:-tjeom01@gmail.com}"
ACCOUNT_BETA="${ACCOUNT_BETA:-eomtj2001@gmail.com}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $1" >&2
    exit 1
  fi
}

require_cmd jq

echo "Setting up parallel team agents architecture..."
echo "Project root: ${PROJECT_ROOT}"

echo "Creating sync directories..."
mkdir -p "${SYNC_DIR}"/{tasks/{pending,in_progress,completed},messages/{alpha_to_beta,beta_to_alpha},status,locks,reports}

echo "Creating status files..."
cat > "${SYNC_DIR}/status/alpha_status.json" <<JSON
{
  "team": "alpha",
  "account": "${ACCOUNT_ALPHA}",
  "role": "development",
  "status": "initializing",
  "agents": {
    "alpha-lead": "not_started",
    "alpha-backend": "not_started",
    "alpha-frontend": "not_started",
    "alpha-codex": "not_started",
    "codex-executor": "not_started"
  },
  "current_task": null,
  "last_update": ""
}
JSON

cat > "${SYNC_DIR}/status/beta_status.json" <<JSON
{
  "team": "beta",
  "account": "${ACCOUNT_BETA}",
  "role": "quality_security",
  "status": "initializing",
  "agents": {
    "beta-lead": "not_started",
    "beta-codex": "not_started",
    "beta-qa": "not_started",
    "beta-monitor": "not_started"
  },
  "current_task": null,
  "last_update": ""
}
JSON

cat > "${SYNC_DIR}/README.md" <<'README'
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
README

mkdir -p "${HELPER_DIR}"

cat > "${HELPER_DIR}/create-task.sh" <<'CREATE_TASK'
#!/usr/bin/env bash
# Create a new task for the other team (Task schema v2)

set -euo pipefail

if [ "$#" -lt 4 ]; then
  echo "Usage: $0 <from_team> <to_team> <type> <scope_file_1> [scope_file_2 ...]" >&2
  echo "Example: $0 alpha beta code_review backend/src/routes/auth.ts" >&2
  exit 1
fi

FROM_TEAM="$1"
TO_TEAM="$2"
TYPE="$3"
shift 3
SCOPE_FILES=("$@")

PRIORITY="${TASK_PRIORITY:-medium}"
EXECUTOR="${TASK_EXECUTOR:-codex}"
AUTO_FIX_ALLOWED_RAW="$(echo "${TASK_AUTO_FIX_ALLOWED:-true}" | tr '[:upper:]' '[:lower:]')"
DESCRIPTION="${TASK_DESCRIPTION:-Review and analyze the specified files}"
STATE="pending"

case "${AUTO_FIX_ALLOWED_RAW}" in
  true|false)
    ;;
  *)
    echo "ERROR: TASK_AUTO_FIX_ALLOWED must be true|false" >&2
    exit 1
    ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TASK_DIR="${PROJECT_ROOT}/.claude/sync/tasks/pending"
mkdir -p "${TASK_DIR}"

TASK_ID="task_$(date +%s)_${TYPE}"
TASK_FILE="${TASK_DIR}/${TASK_ID}.json"

SCOPE_JSON="$(printf '%s\n' "${SCOPE_FILES[@]}" | jq -R . | jq -s .)"

# Optional JSON overrides via env vars
CONSTRAINTS_JSON="${TASK_CONSTRAINTS_JSON:-[]}"
VALIDATION_JSON="${TASK_VALIDATION_COMMANDS_JSON:-[]}"
ACCEPTANCE_JSON="${TASK_ACCEPTANCE_CRITERIA_JSON:-[]}"

jq -n \
  --arg schema_version "2" \
  --arg id "${TASK_ID}" \
  --arg from_team "${FROM_TEAM}" \
  --arg to_team "${TO_TEAM}" \
  --arg type "${TYPE}" \
  --arg priority "${PRIORITY}" \
  --arg executor "${EXECUTOR}" \
  --arg description "${DESCRIPTION}" \
  --arg created_at "$(date -Iseconds)" \
  --arg state "${STATE}" \
  --argjson auto_fix_allowed "${AUTO_FIX_ALLOWED_RAW}" \
  --argjson scope_files "${SCOPE_JSON}" \
  --argjson constraints "${CONSTRAINTS_JSON}" \
  --argjson validation_commands "${VALIDATION_JSON}" \
  --argjson acceptance_criteria "${ACCEPTANCE_JSON}" \
  '{
    schema_version: $schema_version,
    id: $id,
    from_team: $from_team,
    to_team: $to_team,
    type: $type,
    priority: $priority,
    executor: $executor,
    auto_fix_allowed: $auto_fix_allowed,
    scope_files: $scope_files,
    description: $description,
    constraints: $constraints,
    validation_commands: $validation_commands,
    acceptance_criteria: $acceptance_criteria,
    created_at: $created_at,
    assigned_to: null,
    state: $state
  }' > "${TASK_FILE}"

echo "Created task: ${TASK_ID}"
echo "Task file: ${TASK_FILE}"
CREATE_TASK

cat > "${HELPER_DIR}/monitor-tasks.sh" <<'MONITOR'
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SYNC_DIR="${PROJECT_ROOT}/.claude/sync"

echo "Monitoring tasks..."
echo ""

echo "PENDING:"
ls -1 "${SYNC_DIR}/tasks/pending/" 2>/dev/null | while read -r task; do
  [ -f "${SYNC_DIR}/tasks/pending/${task}" ] || continue
  echo "  - ${task}"
  jq -r '"    Type: \(.type) | Priority: \(.priority) | Executor: \(.executor) | AutoFix: \(.auto_fix_allowed)"' "${SYNC_DIR}/tasks/pending/${task}" 2>/dev/null || true
done

echo ""
echo "IN PROGRESS:"
ls -1 "${SYNC_DIR}/tasks/in_progress/" 2>/dev/null | while read -r task; do
  [ -f "${SYNC_DIR}/tasks/in_progress/${task}" ] || continue
  echo "  - ${task}"
  jq -r '"    Type: \(.type) | Assigned: \(.assigned_to // "none") | State: \(.state // "in_progress")"' "${SYNC_DIR}/tasks/in_progress/${task}" 2>/dev/null || true
done

echo ""
echo "COMPLETED (last 5):"
ls -1t "${SYNC_DIR}/tasks/completed/" 2>/dev/null | head -5 | while read -r task; do
  [ -f "${SYNC_DIR}/tasks/completed/${task}" ] || continue
  echo "  - ${task}"
done
MONITOR

cat > "${HELPER_DIR}/update-status.sh" <<'UPDATE_STATUS'
#!/usr/bin/env bash
set -euo pipefail

TEAM="${1:-}"
STATUS="${2:-}"
CURRENT_TASK="${3:-}"

if [ -z "${TEAM}" ] || [ -z "${STATUS}" ]; then
  echo "Usage: $0 <alpha|beta> <status> [current_task]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
STATUS_FILE="${PROJECT_ROOT}/.claude/sync/status/${TEAM}_status.json"

if [ ! -f "${STATUS_FILE}" ]; then
  echo "Status file not found: ${STATUS_FILE}" >&2
  exit 1
fi

if [ -n "${CURRENT_TASK}" ]; then
  jq --arg status "${STATUS}" --arg current_task "${CURRENT_TASK}" --arg time "$(date -Iseconds)" \
     '.status = $status | .current_task = $current_task | .last_update = $time' \
     "${STATUS_FILE}" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "${STATUS_FILE}"
else
  jq --arg status "${STATUS}" --arg time "$(date -Iseconds)" \
     '.status = $status | .last_update = $time' \
     "${STATUS_FILE}" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "${STATUS_FILE}"
fi

echo "Updated ${TEAM} status to: ${STATUS}"
UPDATE_STATUS

cat > "${HELPER_DIR}/watch-other-team.sh" <<'WATCH_OTHER'
#!/usr/bin/env bash
set -euo pipefail

TEAM="${1:-beta}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
STATUS_FILE="${PROJECT_ROOT}/.claude/sync/status/${TEAM}_status.json"

if [ ! -f "${STATUS_FILE}" ]; then
  echo "Status file not found: ${STATUS_FILE}" >&2
  exit 1
fi

watch -n 3 "jq '.' '${STATUS_FILE}'"
WATCH_OTHER

chmod +x "${HELPER_DIR}/create-task.sh"
chmod +x "${HELPER_DIR}/monitor-tasks.sh"
chmod +x "${HELPER_DIR}/update-status.sh"
chmod +x "${HELPER_DIR}/watch-other-team.sh"

echo ""
echo "Setup complete."
echo ""
echo "Next steps:"
echo "  1. Terminal 1: claude --account ${ACCOUNT_ALPHA}"
echo "  2. Terminal 2: claude --account ${ACCOUNT_BETA}"
echo ""
echo "Helper scripts:"
echo "  - scripts/team-helpers/create-task.sh"
echo "  - scripts/team-helpers/monitor-tasks.sh"
echo "  - scripts/team-helpers/update-status.sh"
echo "  - scripts/team-helpers/watch-other-team.sh"
