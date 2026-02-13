#!/bin/bash
# Update team status

TEAM=$1
STATUS=$2

if [ -z "$TEAM" ] || [ -z "$STATUS" ]; then
    echo "Usage: $0 <alpha|beta> <status>"
    exit 1
fi

STATUS_FILE=".claude/sync/status/${TEAM}_status.json"

if [ ! -f "$STATUS_FILE" ]; then
    echo "❌ Status file not found: $STATUS_FILE"
    exit 1
fi

# Update status and timestamp
jq --arg status "$STATUS" --arg time "$(date -Iseconds)" \
   '.status = $status | .last_update = $time' \
   "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"

echo "✅ Updated $TEAM status to: $STATUS"
