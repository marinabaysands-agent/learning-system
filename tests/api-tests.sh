#!/bin/bash
# Learning System v2 — API Integration Tests
# Author: Sands | Reviewer: Bay
# Run: bash tests/api-tests.sh

set -euo pipefail

API="https://learning-system-api.majinghua02.workers.dev"
PASS=0
FAIL=0
ERRORS=()
TEST_ID="__test__$(date +%s)"

pass() { echo "  ✅ $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL+1)); ERRORS+=("$1"); }

cleanup() {
  echo ""
  echo "🧹 Cleaning up test data..."
  # Delete test highlights
  curl -s -X DELETE "$API/api/highlights" \
    -H "Content-Type: application/json" \
    -d "{\"contentId\":\"$TEST_ID\",\"highlightId\":\"$TEST_ID-hl1\"}" > /dev/null 2>&1
  curl -s -X DELETE "$API/api/highlights" \
    -H "Content-Type: application/json" \
    -d "{\"contentId\":\"$TEST_ID\",\"highlightId\":\"$TEST_ID-hl2\"}" > /dev/null 2>&1
  # Reset test progress
  curl -s -X PUT "$API/api/progress" \
    -H "Content-Type: application/json" \
    -d "{\"contentId\":\"$TEST_ID\",\"status\":\"unread\",\"read_progress\":0}" > /dev/null 2>&1
  # Schedule cleanup (overwrite with empty)
  curl -s -X PUT "$API/api/schedule" \
    -H "Content-Type: application/json" \
    -d "{\"contentId\":\"$TEST_ID\",\"next_push\":null,\"push_count\":0,\"stage\":null}" > /dev/null 2>&1
  echo "  Done."
}
trap cleanup EXIT

echo "================================================"
echo "  Learning System v2 — API Integration Tests"
echo "  API: $API"
echo "  Test ID: $TEST_ID"
echo "================================================"
echo ""

# ============================
# 1. HIGHLIGHTS CRUD
# ============================
echo "📝 Highlights API"

# 1a. GET empty highlights
resp=$(curl -s "$API/api/highlights/$TEST_ID")
if echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); assert d==[], f'expected [], got {d}'" 2>/dev/null; then
  pass "GET /api/highlights/{id} returns [] for new content"
else
  fail "GET /api/highlights/{id} should return [] for new content, got: $resp"
fi

# 1b. POST create highlight
resp=$(curl -s -X POST "$API/api/highlights" \
  -H "Content-Type: application/json" \
  -d "{\"contentId\":\"$TEST_ID\",\"highlight\":{\"id\":\"$TEST_ID-hl1\",\"text\":\"This is a test highlight\",\"color\":\"yellow\",\"position\":{\"start\":0,\"end\":24}}}")
if echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); assert d['id']=='${TEST_ID}-hl1'" 2>/dev/null; then
  pass "POST /api/highlights creates highlight with correct id"
else
  fail "POST /api/highlights failed: $resp"
fi

# 1c. GET returns created highlight
resp=$(curl -s "$API/api/highlights/$TEST_ID")
count=$(echo "$resp" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
if [ "$count" = "1" ]; then
  pass "GET /api/highlights/{id} returns 1 highlight after create"
else
  fail "GET /api/highlights/{id} expected 1, got $count"
fi

# 1d. POST second highlight
curl -s -X POST "$API/api/highlights" \
  -H "Content-Type: application/json" \
  -d "{\"contentId\":\"$TEST_ID\",\"highlight\":{\"id\":\"$TEST_ID-hl2\",\"text\":\"Second test highlight green\",\"color\":\"green\",\"position\":{\"start\":30,\"end\":56}}}" > /dev/null

resp=$(curl -s "$API/api/highlights/$TEST_ID")
count=$(echo "$resp" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
if [ "$count" = "2" ]; then
  pass "POST second highlight, total now 2"
else
  fail "Expected 2 highlights, got $count"
fi

# 1e. POST replace (update note on existing highlight)
resp=$(curl -s -X POST "$API/api/highlights" \
  -H "Content-Type: application/json" \
  -d "{\"contentId\":\"$TEST_ID\",\"highlight\":{\"id\":\"$TEST_ID-hl1\",\"note\":\"My annotation\"},\"replace\":true}")
has_note=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('note',''))")
if [ "$has_note" = "My annotation" ]; then
  pass "POST replace=true updates highlight note"
else
  fail "POST replace=true: note='$has_note', expected 'My annotation'"
fi

# 1f. Verify replace didn't create duplicate
resp=$(curl -s "$API/api/highlights/$TEST_ID")
count=$(echo "$resp" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
if [ "$count" = "2" ]; then
  pass "Replace did not create duplicate (still 2)"
else
  fail "Replace created duplicate: expected 2, got $count"
fi

# 1g. DELETE highlight
resp=$(curl -s -X DELETE "$API/api/highlights" \
  -H "Content-Type: application/json" \
  -d "{\"contentId\":\"$TEST_ID\",\"highlightId\":\"$TEST_ID-hl1\"}")
ok=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin).get('ok',False))")
if [ "$ok" = "True" ]; then
  pass "DELETE /api/highlights returns ok"
else
  fail "DELETE /api/highlights: $resp"
fi

# 1h. Verify deletion
resp=$(curl -s "$API/api/highlights/$TEST_ID")
count=$(echo "$resp" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
if [ "$count" = "1" ]; then
  pass "After delete, 1 highlight remains"
else
  fail "After delete, expected 1, got $count"
fi

echo ""

# ============================
# 2. PROGRESS API
# ============================
echo "📊 Progress API"

# 2a. GET default progress
resp=$(curl -s "$API/api/progress/$TEST_ID")
status=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))")
if [ "$status" = "unread" ]; then
  pass "GET /api/progress/{id} defaults to 'unread'"
else
  fail "GET /api/progress/{id} expected 'unread', got '$status'"
fi

# 2b. PUT progress (reading)
resp=$(curl -s -X PUT "$API/api/progress" \
  -H "Content-Type: application/json" \
  -d "{\"contentId\":\"$TEST_ID\",\"status\":\"reading\",\"read_progress\":0.42}")
status=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['status'])")
progress=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['read_progress'])")
if [ "$status" = "reading" ] && [ "$progress" = "0.42" ]; then
  pass "PUT /api/progress sets status=reading, progress=0.42"
else
  fail "PUT progress: status=$status, progress=$progress"
fi

# 2c. Verify has last_interaction
has_ts=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print('yes' if d.get('last_interaction') else 'no')")
if [ "$has_ts" = "yes" ]; then
  pass "PUT /api/progress sets last_interaction timestamp"
else
  fail "PUT /api/progress missing last_interaction"
fi

# 2d. PUT progress (read, >90%)
resp=$(curl -s -X PUT "$API/api/progress" \
  -H "Content-Type: application/json" \
  -d "{\"contentId\":\"$TEST_ID\",\"status\":\"read\",\"read_progress\":0.95}")
status=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])")
if [ "$status" = "read" ]; then
  pass "PUT /api/progress status=read at 95%"
else
  fail "PUT progress read: got $status"
fi

# 2e. GET all progress
resp=$(curl -s "$API/api/progress")
has_test=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print('yes' if '$TEST_ID' in d else 'no')")
if [ "$has_test" = "yes" ]; then
  pass "GET /api/progress (all) includes test content"
else
  fail "GET /api/progress (all) missing test content"
fi

echo ""

# ============================
# 3. ACTIVITY API
# ============================
echo "🔥 Activity API"

today=$(date -u +%Y-%m-%d)

# 3a. POST activity
resp=$(curl -s -X POST "$API/api/activity" \
  -H "Content-Type: application/json" \
  -d "{\"date\":\"$today\",\"contentId\":\"$TEST_ID\",\"type\":\"read\",\"detail\":\"test read\"}")
ok=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin).get('ok',False))")
if [ "$ok" = "True" ]; then
  pass "POST /api/activity logs activity"
else
  fail "POST /api/activity: $resp"
fi

# 3b. POST second activity
curl -s -X POST "$API/api/activity" \
  -H "Content-Type: application/json" \
  -d "{\"date\":\"$today\",\"contentId\":\"$TEST_ID\",\"type\":\"highlight\",\"detail\":\"test highlight\"}" > /dev/null

# 3c. GET activity range
resp=$(curl -s "$API/api/activity?from=$today&to=$today")
count=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('$today',[])))")
if [ "$count" -ge 2 ] 2>/dev/null; then
  pass "GET /api/activity returns ≥2 events for today"
else
  fail "GET /api/activity: expected ≥2 events, got $count"
fi

# 3d. GET activity missing params
resp=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/activity")
if [ "$resp" = "400" ]; then
  pass "GET /api/activity without params returns 400"
else
  fail "GET /api/activity without params: expected 400, got $resp"
fi

echo ""

# ============================
# 4. CONVERSATION API
# ============================
echo "💬 Conversation API"

# 4a. POST conversation
resp=$(curl -s -X POST "$API/api/conversation" \
  -H "Content-Type: application/json" \
  -d "{\"contentId\":\"$TEST_ID\",\"date\":\"$today\",\"type\":\"review\",\"messages\":[{\"role\":\"sands\",\"content\":\"What was your key takeaway?\"},{\"role\":\"user\",\"content\":\"The PM role is changing with AI\"}]}")
has_created=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print('yes' if d.get('created_at') else 'no')")
if [ "$has_created" = "yes" ]; then
  pass "POST /api/conversation creates conversation with timestamp"
else
  fail "POST /api/conversation: $resp"
fi

# 4b. GET conversations list
resp=$(curl -s "$API/api/conversations/$TEST_ID")
count=$(echo "$resp" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
if [ "$count" -ge 1 ] 2>/dev/null; then
  pass "GET /api/conversations/{id} returns ≥1 conversation"
else
  fail "GET /api/conversations/{id}: expected ≥1, got $count"
fi

# 4c. Verify conversation has messages
msg_count=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d[0].get('messages',[])))")
if [ "$msg_count" = "2" ]; then
  pass "Conversation has 2 messages"
else
  fail "Conversation messages: expected 2, got $msg_count"
fi

# 4d. GET conversations for non-existent content
resp=$(curl -s "$API/api/conversations/__nonexistent__")
count=$(echo "$resp" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
if [ "$count" = "0" ]; then
  pass "GET /api/conversations for non-existent content returns []"
else
  fail "GET /api/conversations non-existent: expected 0, got $count"
fi

echo ""

# ============================
# 5. SCHEDULE API
# ============================
echo "📅 Schedule API"

# 5a. PUT schedule
resp=$(curl -s -X PUT "$API/api/schedule" \
  -H "Content-Type: application/json" \
  -d "{\"contentId\":\"$TEST_ID\",\"next_push\":\"2026-05-06\",\"push_count\":1,\"stage\":\"day3\"}")
stage=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin).get('stage',''))")
if [ "$stage" = "day3" ]; then
  pass "PUT /api/schedule sets stage=day3"
else
  fail "PUT /api/schedule: stage=$stage"
fi

# 5b. GET single schedule
resp=$(curl -s "$API/api/schedule/$TEST_ID")
next=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin).get('next_push',''))")
if [ "$next" = "2026-05-06" ]; then
  pass "GET /api/schedule/{id} returns next_push"
else
  fail "GET /api/schedule/{id}: next=$next"
fi

# 5c. GET all schedules
resp=$(curl -s "$API/api/schedule")
has_test=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print('yes' if '$TEST_ID' in d else 'no')")
if [ "$has_test" = "yes" ]; then
  pass "GET /api/schedule (all) includes test schedule"
else
  fail "GET /api/schedule (all) missing test"
fi

echo ""

# ============================
# 6. NOTES AGGREGATE API
# ============================
echo "📋 Notes Aggregate API"

resp=$(curl -s "$API/api/notes")
is_obj=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print('yes' if isinstance(d,dict) else 'no')")
if [ "$is_obj" = "yes" ]; then
  pass "GET /api/notes returns object"
else
  fail "GET /api/notes: not an object"
fi

echo ""

# ============================
# 7. ERROR HANDLING
# ============================
echo "⚠️  Error Handling"

# 7a. POST highlights missing params
resp=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/highlights" \
  -H "Content-Type: application/json" -d '{}')
if [ "$resp" = "400" ]; then
  pass "POST /api/highlights with {} returns 400"
else
  fail "POST /api/highlights with {}: expected 400, got $resp"
fi

# 7b. PUT progress missing contentId
resp=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API/api/progress" \
  -H "Content-Type: application/json" -d '{"status":"reading"}')
if [ "$resp" = "400" ]; then
  pass "PUT /api/progress without contentId returns 400"
else
  fail "PUT /api/progress without contentId: expected 400, got $resp"
fi

# 7c. 404 for unknown route
resp=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/nonexistent")
if [ "$resp" = "404" ]; then
  pass "Unknown route returns 404"
else
  fail "Unknown route: expected 404, got $resp"
fi

# 7d. OPTIONS returns 204 (CORS preflight)
resp=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$API/api/highlights")
if [ "$resp" = "204" ]; then
  pass "OPTIONS returns 204 (CORS)"
else
  fail "OPTIONS: expected 204, got $resp"
fi

echo ""

# ============================
# SUMMARY
# ============================
echo "================================================"
echo "  RESULTS: $((PASS+FAIL)) tests | ✅ $PASS passed | ❌ $FAIL failed"
echo "================================================"

if [ $FAIL -gt 0 ]; then
  echo ""
  echo "Failed tests:"
  for e in "${ERRORS[@]}"; do
    echo "  - $e"
  done
  exit 1
fi
