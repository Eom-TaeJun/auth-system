#!/bin/bash
# Monitor pending tasks

SYNC_DIR=".claude/sync"

echo "📋 Monitoring tasks..."
echo ""

echo "⏳ PENDING:"
ls -1 "$SYNC_DIR/tasks/pending/" 2>/dev/null | while read task; do
    if [ -f "$SYNC_DIR/tasks/pending/$task" ]; then
        echo "  - $task"
        jq -r '"\tType: \(.type) | From: \(.from_team) | To: \(.to_team)"' "$SYNC_DIR/tasks/pending/$task"
    fi
done

echo ""
echo "🔄 IN PROGRESS:"
ls -1 "$SYNC_DIR/tasks/in_progress/" 2>/dev/null | while read task; do
    if [ -f "$SYNC_DIR/tasks/in_progress/$task" ]; then
        echo "  - $task"
        jq -r '"\tType: \(.type) | Assigned: \(.assigned_to)"' "$SYNC_DIR/tasks/in_progress/$task"
    fi
done

echo ""
echo "✅ COMPLETED:"
ls -1 "$SYNC_DIR/tasks/completed/" 2>/dev/null | tail -5 | while read task; do
    if [ -f "$SYNC_DIR/tasks/completed/$task" ]; then
        echo "  - $task"
    fi
done
