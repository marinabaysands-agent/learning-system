#!/bin/bash
# Learning System v2 — Run All Tests
# Author: Sands | Reviewer: Bay
# Run: bash tests/run-all.sh

set -uo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
TOTAL_PASS=0
TOTAL_FAIL=0

echo "╔════════════════════════════════════════════════╗"
echo "║  Learning System v2 — Full Test Suite          ║"
echo "║  Date: $(date '+%Y-%m-%d %H:%M %Z')              ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

run_suite() {
  local name="$1"
  local script="$2"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Running: $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  if bash "$DIR/$script"; then
    echo ""
    echo "  ✅ Suite passed"
  else
    echo ""
    echo "  ❌ Suite has failures"
    TOTAL_FAIL=$((TOTAL_FAIL+1))
  fi
  echo ""
}

run_suite "API Integration Tests" "api-tests.sh"
run_suite "Site Structure & Deployment Tests" "site-tests.sh"
run_suite "Data Integrity Tests" "data-integrity.sh"

echo "╔════════════════════════════════════════════════╗"
if [ $TOTAL_FAIL -eq 0 ]; then
  echo "║  🎉 ALL SUITES PASSED                          ║"
else
  echo "║  ⚠️  $TOTAL_FAIL SUITE(S) HAVE FAILURES              ║"
fi
echo "╚════════════════════════════════════════════════╝"

exit $TOTAL_FAIL
