#!/usr/bin/env python3
"""Migrate existing podcast articles to learning system format."""
import os, re

ARTICLES_DIR = '/root/.openclaw/workspace-sands/projects/learning-system/site/articles'

# Injection: CSS link + learning CSS, JS files, retelling section, QA section
CSS_INJECT = '''<link rel="stylesheet" href="/assets/learning.css">'''

JS_INJECT = '''<script src="/assets/content-data.js"></script>
<script src="/assets/learning.js"></script>
<script>
(function() {
  const id = location.pathname.split('/').pop().replace('.html','');
  const article = ARTICLES.find(a => a.id === id);
  if (!article) return;
  initHighlights(id);
  initProgress(id);
  initRetelling(id);
  if (article) initQA(id, article.prompts);
})();
</script>'''

RETELLING_HTML = '''
<!-- RETELLING -->
<div class="retelling-section" id="retelling-section">
  <div class="section-label">费曼检验</div>
  <div class="section-title">用你自己的话说说：这篇你记住了什么？</div>
  <div class="section-desc">不用完美，用自己的语言讲出来才算真的理解了。</div>
  <button class="retell-record">🎤 按住说话</button>
  <div class="retell-status"></div>
  <div class="retell-transcript"></div>
  <div class="retell-done">✓ 已保存复述</div>
  <div class="retell-or">或者，打字也行：</div>
  <textarea class="retell-text-input" placeholder="用你自己的话复述这篇文章的核心观点..."></textarea>
  <button class="retell-text-save">保存</button>
</div>

<!-- QA -->
<div class="qa-section" id="qa-section">
  <div class="section-label">深度思考</div>
  <div class="section-title">逼问自己</div>
  <div class="qa-list"></div>
</div>
'''

for fname in os.listdir(ARTICLES_DIR):
    if not fname.endswith('.html'):
        continue
    fpath = os.path.join(ARTICLES_DIR, fname)
    with open(fpath, 'r') as f:
        html = f.read()
    
    # Skip if already migrated
    if 'learning.js' in html:
        print(f'  SKIP {fname} (already migrated)')
        continue
    
    # 1. Inject CSS before </style> or after last <link>
    html = html.replace('</style>\n</head>', f'</style>\n{CSS_INJECT}\n</head>')
    
    # 2. Change back link to point to /library/
    html = html.replace('href="./"', 'href="/library/"')
    html = html.replace('← Product Learning', '← 内容库')
    
    # 3. Insert retelling + QA before footer
    html = html.replace('<div class="footer">', f'{RETELLING_HTML}\n<div class="footer">')
    
    # 4. Change footer link
    html = html.replace('<a href="./">← 返回首页</a>', '<a href="/library/">← 内容库</a> · <a href="/">首页</a>')
    
    # 5. Inject JS before </body>
    html = html.replace('</body>', f'{JS_INJECT}\n</body>')
    
    # 6. Remove old scroll progress JS (we handle it in learning.js)
    html = re.sub(r"<script>\s*window\.addEventListener\('scroll'.*?</script>", '', html, flags=re.DOTALL)
    
    with open(fpath, 'w') as f:
        f.write(html)
    print(f'  OK {fname}')

print('Done!')
