#!/bin/bash
# Auto-sync script for Team Alpha - monitors Team Beta results

SYNC_DIR=".claude/sync"
LAST_CHECK_FILE="/tmp/alpha-last-check"

echo "🔄 Team Alpha Auto-Sync Started"
echo "Monitoring Team Beta activity..."

# Initialize last check timestamp
if [ ! -f "$LAST_CHECK_FILE" ]; then
    date +%s > "$LAST_CHECK_FILE"
fi

while true; do
    CURRENT_TIME=$(date +%s)
    LAST_CHECK=$(cat "$LAST_CHECK_FILE")

    # Check for new completed tasks
    COMPLETED_DIR="$SYNC_DIR/tasks/completed"
    if [ -d "$COMPLETED_DIR" ]; then
        while IFS= read -r task_file; do
            if [ -f "$task_file" ]; then
                FILE_TIME=$(stat -c %Y "$task_file")
                if [ "$FILE_TIME" -gt "$LAST_CHECK" ]; then
                    echo ""
                    echo "✅ NEW RESULT FROM TEAM BETA:"
                    echo "   File: $(basename "$task_file")"

                    # Extract key info
                    TASK_TYPE=$(jq -r '.type // "unknown"' "$task_file" 2>/dev/null)
                    RESULT=$(jq -r '.result.status // .status // "completed"' "$task_file" 2>/dev/null)

                    echo "   Type: $TASK_TYPE"
                    echo "   Result: $RESULT"

                    # Check for issues
                    ISSUES=$(jq -r '.result.issues_found // 0' "$task_file" 2>/dev/null)
                    if [ "$ISSUES" != "0" ] && [ "$ISSUES" != "null" ]; then
                        echo "   ⚠️  Issues found: $ISSUES"
                    fi

                    echo "   📄 Full report: $task_file"
                    echo ""
                fi
            fi
        done < <(find "$COMPLETED_DIR" -type f -name "*.json" 2>/dev/null)
    fi

    # Check for new messages
    MSG_DIR="$SYNC_DIR/messages/beta_to_alpha"
    if [ -d "$MSG_DIR" ]; then
        while IFS= read -r msg_file; do
            if [ -f "$msg_file" ]; then
                FILE_TIME=$(stat -c %Y "$msg_file")
                if [ "$FILE_TIME" -gt "$LAST_CHECK" ]; then
                    echo ""
                    echo "💬 NEW MESSAGE FROM TEAM BETA:"
                    cat "$msg_file"
                    echo ""
                fi
            fi
        done < <(find "$MSG_DIR" -type f 2>/dev/null)
    fi

    # Check Team Beta status
    BETA_STATUS="$SYNC_DIR/status/beta_status.json"
    if [ -f "$BETA_STATUS" ]; then
        FILE_TIME=$(stat -c %Y "$BETA_STATUS")
        if [ "$FILE_TIME" -gt "$LAST_CHECK" ]; then
            STATUS=$(jq -r '.status // "unknown"' "$BETA_STATUS" 2>/dev/null)
            CURRENT_TASK=$(jq -r '.current_task // "none"' "$BETA_STATUS" 2>/dev/null)

            echo ""
            echo "📊 TEAM BETA STATUS UPDATE:"
            echo "   Status: $STATUS"
            echo "   Current task: $CURRENT_TASK"
            echo ""
        fi
    fi

    # Update last check time
    date +%s > "$LAST_CHECK_FILE"

    # Wait 10 seconds before next check
    sleep 10
done
