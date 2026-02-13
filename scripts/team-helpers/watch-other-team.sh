#!/bin/bash
# Watch the other team's status

TEAM=${1:-beta}
STATUS_FILE=".claude/sync/status/${TEAM}_status.json"

if [ ! -f "$STATUS_FILE" ]; then
    echo "❌ Status file not found: $STATUS_FILE"
    exit 1
fi

watch -n 3 "jq '.' $STATUS_FILE"
