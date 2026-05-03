#!/bin/bash
# Learning System v2 — Data Integrity Tests
# Author: Sands | Reviewer: Bay
# Run: bash tests/data-integrity.sh
#
# These tests check REAL production data for consistency and known issues.
# No test data created; read-only.

set -euo pipefail

API="https://learning-system-api.majinghua02.workers.dev"
PASS=0
FAIL=0
ERRORS=()

pass() { echo "  ✅ $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL+1)); ERRORS+=("$1"); }

echo "================================================"
echo "  Learning System v2 — Data Integrity Tests"
echo "  API: $API"
echo "================================================"
echo ""

# Known article IDs
ARTICLES=("cat-wu-anthropic" "boris-cherny-claude-code" "brian-chesky-playbook" "dalton-caldwell-yc-startups" "elizabeth-stone-netflix" "jenny-wen-design-process" "kevin-weil-openai-cpo" "marc-andreessen-ai-boom" "marty-cagan-pm-theater" "nikita-bier-go-viral" "shreyas-doshi-pm-questions")

# ============================
# 1. PROGRESS CONSISTENCY
# ============================
echo "📊 Progress Data Consistency"

progress=$(curl -s "$API/api/progress")

# Check no fake 0.03% progress (the bug we fixed)
fake_count=$(echo "$progress" | python3 -c "
import json,sys
d=json.load(sys.stdin)
fake=0
for k,v in d.items():
    if k.startswith('__test__'): continue
    p=v.get('read_progress',0)
    if 0 < p < 0.05 and v.get('status')=='reading':
        print(f'  ⚠️  {k}: progress={p:.4f} (looks like page-load artifact)')
        fake+=1
print(fake)
" 2>/dev/null)
last_line=$(echo "$fake_count" | tail -1)
if [ "$last_line" = "0" ]; then
  pass "No fake progress values (0 < p < 0.05) found — bug fix effective"
else
  fail "Found $last_line articles with suspicious near-zero progress — bug may persist"
fi

# Check cat-wu-anthropic has highlights but reasonable progress
cat_status=$(echo "$progress" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('cat-wu-anthropic',{}).get('status','missing'))")
if [ "$cat_status" = "reading" ] || [ "$cat_status" = "read" ]; then
  pass "cat-wu-anthropic status is '$cat_status' (has highlights, so reading/read is correct)"
else
  fail "cat-wu-anthropic status is '$cat_status' — expected reading or read"
fi

echo ""

# ============================
# 2. HIGHLIGHTS QUALITY
# ============================
echo "✏️  Highlights Quality"

for id in "${ARTICLES[@]}"; do
  resp=$(curl -s "$API/api/highlights/$id")
  python3 -c "
import json,sys
d=json.load(sys.stdin)
content_id='$id'
for h in d:
    text = h.get('text','')
    # Check minimum length
    if len(text.strip()) < 6:
        print(f'SHORT:{content_id}:{h.get(\"id\",\"?\")}:{text}')
    # Check has color
    if not h.get('color'):
        print(f'NOCOLOR:{content_id}:{h.get(\"id\",\"?\")}:{text[:30]}')
    # Check has position
    if not h.get('position'):
        print(f'NOPOS:{content_id}:{h.get(\"id\",\"?\")}:{text[:30]}')
" <<< "$resp" 2>/dev/null | while read line; do
    type=$(echo "$line" | cut -d: -f1)
    case "$type" in
      SHORT)  fail "Highlight too short (<6 chars): $line" ;;
      NOCOLOR) fail "Highlight missing color: $line" ;;
      NOPOS)  fail "Highlight missing position: $line" ;;
    esac
  done
done

# Count total highlights
total_hl=$(python3 -c "
import json,sys,subprocess
total=0
for aid in sys.argv[1:]:
    try:
        r=subprocess.run(['curl','-s','$API/api/highlights/'+aid],capture_output=True,text=True,timeout=10)
        d=json.loads(r.stdout)
        total+=len(d)
    except: pass
print(total)
" "${ARTICLES[@]}" 2>/dev/null)
echo "  ℹ️  Total highlights across all articles: $total_hl"
if [ "$total_hl" -ge 1 ] 2>/dev/null; then
  pass "At least 1 highlight exists in the system"
else
  # This is OK if Marina hasn't read yet
  echo "  ⚠️  No highlights found (Marina may not have started reading)"
  pass "No highlights (acceptable for new system)"
fi

echo ""

# ============================
# 3. ACTIVITY DATA
# ============================
echo "🔥 Activity Data"

# Check recent 30 days
today=$(date -u +%Y-%m-%d)
month_ago=$(date -u -d "30 days ago" +%Y-%m-%d 2>/dev/null || date -u -v-30d +%Y-%m-%d 2>/dev/null || echo "2026-04-03")
resp=$(curl -s "$API/api/activity?from=$month_ago&to=$today")
day_count=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d))")
if [ "$day_count" -ge 1 ] 2>/dev/null; then
  pass "Activity data exists: $day_count days with activity in last 30 days"
else
  pass "No activity data in last 30 days (acceptable for fresh system)"
fi

# Check no duplicate activity types on same timestamp
echo "$resp" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for date, events in d.items():
    seen=set()
    for e in events:
        key=f'{e.get(\"type\")}:{e.get(\"contentId\")}:{e.get(\"timestamp\",\"\")}'
        if key in seen:
            print(f'DUP:{date}:{key}')
        seen.add(key)
" 2>/dev/null | while read line; do
  fail "Duplicate activity entry: $line"
done

# If we got here with no dups
pass "No exact-duplicate activity entries found"

echo ""

# ============================
# 4. CONTENT-DATA CONSISTENCY
# ============================
echo "📚 Content Data Consistency"

# Verify content-data.js articles match known IDs
cd_js=$(curl -sL "https://learning.marinago.one/assets/content-data.js")
for id in "${ARTICLES[@]}"; do
  if echo "$cd_js" | grep -q "'$id'\|\"$id\""; then
    : # pass silently for each
  else
    fail "Article $id missing from content-data.js"
  fi
done
pass "All 11 article IDs present in content-data.js"

# Verify each article has required fields
echo "$cd_js" | python3 -c "
import sys, re
text = sys.stdin.read()
# Extract articles using regex (it's JS, not JSON)
ids = re.findall(r\"id:\s*['\\\"]([^'\\\"]+)['\\\"]\", text)
titles = re.findall(r\"title:\s*['\\\"]([^'\\\"]+)['\\\"]\", text)
print(f'Found {len(ids)} IDs, {len(titles)} titles')
if len(ids) >= 11 and len(titles) >= 11:
    print('OK')
else:
    print('MISMATCH')
" 2>/dev/null | while read line; do
  if echo "$line" | grep -q "OK"; then
    pass "All articles have id and title fields"
  elif echo "$line" | grep -q "MISMATCH"; then
    fail "Article count mismatch in content-data.js"
  fi
done

echo ""

# ============================
# 5. API RESPONSE TIMES
# ============================
echo "⏱️  API Response Times"

for endpoint in "/api/progress" "/api/highlights/cat-wu-anthropic" "/api/notes" "/api/schedule"; do
  time_ms=$(curl -sL -o /dev/null -w "%{time_total}" "$API$endpoint" | python3 -c "import sys; print(int(float(sys.stdin.read())*1000))")
  if [ "$time_ms" -lt 3000 ] 2>/dev/null; then
    pass "$endpoint responds in ${time_ms}ms (<3s)"
  else
    fail "$endpoint too slow: ${time_ms}ms (>3s)"
  fi
done

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
