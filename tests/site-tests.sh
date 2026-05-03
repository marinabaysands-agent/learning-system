#!/bin/bash
# Learning System v2 — Site Structure & Deployment Tests
# Author: Sands | Reviewer: Bay
# Run: bash tests/site-tests.sh

set -euo pipefail

SITE="https://learning.marinago.one"
PASS=0
FAIL=0
ERRORS=()

pass() { echo "  ✅ $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL+1)); ERRORS+=("$1"); }

echo "================================================"
echo "  Learning System v2 — Site Tests"
echo "  Site: $SITE"
echo "================================================"
echo ""

# ============================
# 1. PAGE ACCESSIBILITY
# ============================
echo "🌐 Page Accessibility"

for page in "/" "/library/" "/notes/" "/topics/"; do
  code=$(curl -sL -o /dev/null -w "%{http_code}" "${SITE}${page}")
  if [ "$code" = "200" ]; then
    pass "${page} returns 200"
  else
    fail "${page} returned $code"
  fi
done

# Test an article page
code=$(curl -sL -o /dev/null -w "%{http_code}" "${SITE}/articles/cat-wu-anthropic.html")
if [ "$code" = "200" ]; then
  pass "/articles/cat-wu-anthropic.html returns 200"
else
  fail "/articles/cat-wu-anthropic.html returned $code"
fi

echo ""

# ============================
# 2. CRITICAL ASSETS
# ============================
echo "📦 Critical Assets"

# learning.js deployed
js=$(curl -sL "${SITE}/assets/learning.js")
if echo "$js" | grep -q "initHighlights"; then
  pass "learning.js contains initHighlights"
else
  fail "learning.js missing initHighlights"
fi

if echo "$js" | grep -q "initProgress"; then
  pass "learning.js contains initProgress"
else
  fail "learning.js missing initProgress"
fi

if echo "$js" | grep -q "initHeatmap"; then
  pass "learning.js contains initHeatmap"
else
  fail "learning.js missing initHeatmap"
fi

if echo "$js" | grep -q "logActivity"; then
  pass "learning.js contains logActivity"
else
  fail "learning.js missing logActivity"
fi

if echo "$js" | grep -q "MIN_HIGHLIGHT_LENGTH = 6"; then
  pass "learning.js has MIN_HIGHLIGHT_LENGTH = 6"
else
  fail "learning.js missing MIN_HIGHLIGHT_LENGTH = 6"
fi

# content-data.js
cd=$(curl -sL "${SITE}/assets/content-data.js")
if echo "$cd" | grep -q "ARTICLES"; then
  pass "content-data.js contains ARTICLES array"
else
  fail "content-data.js missing ARTICLES"
fi

count=$(echo "$cd" | grep -c "id:" || true)
if [ "$count" -ge 11 ]; then
  pass "content-data.js has ≥11 articles ($count found)"
else
  fail "content-data.js only has $count articles (expected ≥11)"
fi

# learning.css
css=$(curl -sL "${SITE}/assets/learning.css")
if echo "$css" | grep -q "hl-mark"; then
  pass "learning.css contains highlight styles (.hl-mark)"
else
  fail "learning.css missing .hl-mark styles"
fi

if echo "$css" | grep -q "heatmap"; then
  pass "learning.css contains heatmap styles"
else
  fail "learning.css missing heatmap styles"
fi

echo ""

# ============================
# 3. PROGRESS BUG FIX (v2 critical)
# ============================
echo "🐛 Progress Bug Fix"

if echo "$js" | grep -q "pct > 0.05"; then
  pass "learning.js has progress threshold (pct > 0.05) — bug fix deployed"
else
  fail "learning.js MISSING progress threshold fix (pct > 0.05) — BUG NOT FIXED"
fi

if echo "$js" | grep -q "Only save progress when"; then
  pass "learning.js has progress fix comment"
else
  fail "learning.js missing progress fix comment — may be old version"
fi

echo ""

# ============================
# 4. DESKTOP RESPONSIVE (v2 new)
# ============================
echo "🖥️  Desktop Responsive"

if echo "$css" | grep -q "min-width: 1024px"; then
  pass "learning.css has 1024px desktop breakpoint"
else
  fail "learning.css MISSING 1024px desktop breakpoint"
fi

# Check TOC sidebar in CSS
if echo "$css" | grep -q "position: fixed\|position:fixed\|sticky"; then
  pass "learning.css has fixed/sticky positioning (likely TOC sidebar)"
else
  fail "learning.css missing fixed/sticky positioning for TOC"
fi

echo ""

# ============================
# 5. NOTES PAGE CONVERSATION (v2 new)
# ============================
echo "💬 Notes Page Conversation Display"

notes=$(curl -sL "${SITE}/notes/")

if echo "$notes" | grep -q "conv-section"; then
  pass "Notes page has .conv-section elements"
else
  fail "Notes page MISSING .conv-section"
fi

if echo "$notes" | grep -q "fetchConversation"; then
  pass "Notes page has fetchConversation() function"
else
  fail "Notes page MISSING fetchConversation()"
fi

if echo "$notes" | grep -q "学习对话"; then
  pass "Notes page has '学习对话' label"
else
  fail "Notes page missing '学习对话' label"
fi

echo ""

# ============================
# 6. HOMEPAGE HEATMAP
# ============================
echo "🟩 Homepage Heatmap"

home=$(curl -sL "${SITE}/")

if echo "$home" | grep -q "heatmap-container"; then
  pass "Homepage has heatmap-container div"
else
  fail "Homepage MISSING heatmap-container"
fi

if echo "$home" | grep -q "initHeatmap"; then
  pass "Homepage calls initHeatmap()"
else
  fail "Homepage MISSING initHeatmap() call"
fi

echo ""

# ============================
# 7. ARTICLE PAGES STRUCTURE
# ============================
echo "📄 Article Page Structure"

articles=("cat-wu-anthropic" "boris-cherny-claude-code" "brian-chesky-playbook" "dalton-caldwell-yc-startups" "elizabeth-stone-netflix" "jenny-wen-design-process" "kevin-weil-openai-cpo" "marc-andreessen-ai-boom" "marty-cagan-pm-theater" "nikita-bier-go-viral" "shreyas-doshi-pm-questions")

for id in "${articles[@]}"; do
  code=$(curl -sL -o /dev/null -w "%{http_code}" "${SITE}/articles/${id}.html")
  if [ "$code" = "200" ]; then
    pass "Article ${id} accessible"
  else
    fail "Article ${id} returned $code"
  fi
done

# Check one article for critical elements
art=$(curl -sL "${SITE}/articles/cat-wu-anthropic.html")

if echo "$art" | grep -q "learning.js"; then
  pass "Article page includes learning.js"
else
  fail "Article page MISSING learning.js"
fi

if echo "$art" | grep -q "learning.css"; then
  pass "Article page includes learning.css"
else
  fail "Article page MISSING learning.css"
fi

if echo "$art" | grep -q "initHighlights"; then
  pass "Article page calls initHighlights()"
else
  fail "Article page MISSING initHighlights() call"
fi

if echo "$art" | grep -q "initProgress"; then
  pass "Article page calls initProgress()"
else
  fail "Article page MISSING initProgress() call"
fi

# Check NO retelling/QA sections
if echo "$art" | grep -qi "retelling-area\|qa-area\|复述区\|QA区"; then
  fail "Article page still has retelling/QA section (should be removed in v2)"
else
  pass "Article page has NO retelling/QA section (v2 cleanup done)"
fi

echo ""

# ============================
# 8. CORS HEADERS
# ============================
echo "🔐 CORS Headers"

headers=$(curl -sI -X OPTIONS "https://learning-system-api.majinghua02.workers.dev/api/progress")
if echo "$headers" | grep -qi "access-control-allow-origin"; then
  pass "API returns CORS headers"
else
  fail "API missing CORS headers"
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
