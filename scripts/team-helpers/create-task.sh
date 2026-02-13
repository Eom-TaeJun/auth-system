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
