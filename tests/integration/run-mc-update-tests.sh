#!/bin/bash
# Integration tests for scripts/mc-update.sh
#
# Usage: bash tests/integration/run-mc-update-tests.sh
#
# These tests create a temporary copy of tasks.json, run mc-update.sh
# commands against it, and verify the results.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
MC_UPDATE="$REPO_DIR/scripts/mc-update.sh"

PASS=0
FAIL=0

# Create temp working directory
WORK_DIR=$(mktemp -d)
trap "rm -rf $WORK_DIR" EXIT

# Set up a fake git repo so mc-update.sh can run
cp -r "$REPO_DIR/data" "$WORK_DIR/data"
cp -r "$REPO_DIR/scripts" "$WORK_DIR/scripts"
cd "$WORK_DIR"
git init -q
git add -A
git commit -q -m "init"

assert_eq() {
    local desc="$1" expected="$2" actual="$3"
    if [[ "$expected" == "$actual" ]]; then
        echo "  PASS: $desc"
        PASS=$((PASS + 1))
    else
        echo "  FAIL: $desc"
        echo "    Expected: $expected"
        echo "    Actual:   $actual"
        FAIL=$((FAIL + 1))
    fi
}

assert_contains() {
    local desc="$1" needle="$2" haystack="$3"
    if echo "$haystack" | grep -q "$needle"; then
        echo "  PASS: $desc"
        PASS=$((PASS + 1))
    else
        echo "  FAIL: $desc"
        echo "    Expected to contain: $needle"
        echo "    Got: $haystack"
        FAIL=$((FAIL + 1))
    fi
}

assert_exit_code() {
    local desc="$1" expected="$2" actual="$3"
    if [[ "$expected" == "$actual" ]]; then
        echo "  PASS: $desc"
        PASS=$((PASS + 1))
    else
        echo "  FAIL: $desc (expected exit $expected, got $actual)"
        FAIL=$((FAIL + 1))
    fi
}

echo "=== mc-update.sh Integration Tests ==="
echo ""

# --- Test: sanitize_input rejects backticks ---
echo "Test: sanitize_input rejects backticks"
OUTPUT=$(bash "$WORK_DIR/scripts/mc-update.sh" status '`whoami`' backlog 2>&1 || true)
assert_contains "rejects backtick in task_id" "Invalid characters" "$OUTPUT"

# --- Test: sanitize_input rejects $ ---
echo "Test: sanitize_input rejects dollar sign"
OUTPUT=$(bash "$WORK_DIR/scripts/mc-update.sh" status '$HOME' backlog 2>&1 || true)
assert_contains "rejects dollar sign in task_id" "Invalid characters" "$OUTPUT"

# --- Test: missing arguments show usage ---
echo "Test: missing arguments show usage"
OUTPUT=$(bash "$WORK_DIR/scripts/mc-update.sh" status 2>&1 || true)
assert_contains "shows usage on missing args" "Usage:" "$OUTPUT"

# --- Test: unknown command shows help ---
echo "Test: unknown command shows help"
OUTPUT=$(bash "$WORK_DIR/scripts/mc-update.sh" 2>&1 || true)
assert_contains "shows help for no command" "Commands:" "$OUTPUT"

# --- Test: non-existent task ID fails ---
echo "Test: non-existent task ID fails"
OUTPUT=$(bash "$WORK_DIR/scripts/mc-update.sh" status nonexistent_task done 2>&1 || true)
assert_contains "fails for missing task" "not found" "$OUTPUT"

# --- Test: tasks.json remains valid JSON after operations ---
echo "Test: tasks.json remains valid JSON"
python3 -c "import json; json.load(open('$WORK_DIR/data/tasks.json'))" 2>&1
assert_exit_code "tasks.json is valid JSON" "0" "$?"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [[ $FAIL -gt 0 ]]; then
    exit 1
fi
