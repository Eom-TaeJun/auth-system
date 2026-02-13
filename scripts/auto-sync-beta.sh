#!/bin/bash
# Auto-sync script for Team Beta - monitors Team Alpha tasks

SYNC_DIR=".claude/sync"
LAST_CHECK_FILE="/tmp/beta-last-check"

echo "🔄 Team Beta Auto-Sync Started"
echo "Monitoring Team Alpha task requests..."

# Initialize last check timestamp
if [ ! -f "$LAST_CHECK_FILE" ]; then
    date +%s > "$LAST_CHECK_FILE"
fi

while true; do
    CURRENT_TIME=$(date +%s)
    LAST_CHECK=$(cat "$LAST_CHECK_FILE")

    # Check for new pending tasks
    PENDING_DIR="$SYNC_DIR/tasks/pending"
    if [ -d "$PENDING_DIR" ]; then
        TASK_COUNT=$(ls "$PENDING_DIR" 2>/dev/null | wc -l)

        if [ "$TASK_COUNT" -gt 0 ]; then
            while IFS= read -r task_file; do
                if [ -f "$task_file" ]; then
                    FILE_TIME=$(stat -c %Y "$task_file")
                    if [ "$FILE_TIME" -gt "$LAST_CHECK" ]; then
                        echo ""
                        echo "📥 NEW TASK FROM TEAM ALPHA:"
                        echo "   File: $(basename "$task_file")"

                        # Extract task details
                        TASK_ID=$(jq -r '.id // "unknown"' "$task_file" 2>/dev/null)
                        TASK_TYPE=$(jq -r '.type // "unknown"' "$task_file" 2>/dev/null)
                        TASK_PRIORITY=$(jq -r '.priority // "medium"' "$task_file" 2>/dev/null)
                        FILES=$(jq -r '.files[]?' "$task_file" 2>/dev/null | tr '\n' ' ')

                        echo "   ID: $TASK_ID"
                        echo "   Type: $TASK_TYPE"
                        echo "   Priority: $TASK_PRIORITY"
                        echo "   Files: $FILES"

                        # Suggest assignment
                        case "$TASK_TYPE" in
                            security_audit)
                                echo "   👉 Recommended: Assign to beta-codex"
                                ;;
                            testing)
                                echo "   👉 Recommended: Assign to beta-qa"
                                ;;
                            code_review)
                                echo "   👉 Recommended: Assign to beta-codex + beta-qa"
                                ;;
                            *)
                                echo "   👉 Recommended: Assign to beta-lead for triage"
                                ;;
                        esac

                        echo "   📄 Full task: $task_file"
                        echo ""
                    fi
                fi
            done < <(find "$PENDING_DIR" -type f -name "*.json" 2>/dev/null)
        fi
    fi

    # Check for new messages
    MSG_DIR="$SYNC_DIR/messages/alpha_to_beta"
    if [ -d "$MSG_DIR" ]; then
        while IFS= read -r msg_file; do
            if [ -f "$msg_file" ]; then
                FILE_TIME=$(stat -c %Y "$msg_file")
                if [ "$FILE_TIME" -gt "$LAST_CHECK" ]; then
                    echo ""
                    echo "💬 NEW MESSAGE FROM TEAM ALPHA:"
                    cat "$msg_file"
                    echo ""
                fi
            fi
        done < <(find "$MSG_DIR" -type f 2>/dev/null)
    fi

    # Check Team Alpha status
    ALPHA_STATUS="$SYNC_DIR/status/alpha_status.json"
    if [ -f "$ALPHA_STATUS" ]; then
        FILE_TIME=$(stat -c %Y "$ALPHA_STATUS")
        if [ "$FILE_TIME" -gt "$LAST_CHECK" ]; then
            STATUS=$(jq -r '.status // "unknown"' "$ALPHA_STATUS" 2>/dev/null)
            CURRENT_TASK=$(jq -r '.current_task // "none"' "$ALPHA_STATUS" 2>/dev/null)

            echo ""
            echo "📊 TEAM ALPHA STATUS UPDATE:"
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
