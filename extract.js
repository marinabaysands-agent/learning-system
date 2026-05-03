// extract.js — one-time script to extract JSON from existing HTML articles
const fs = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, 'site/articles');
const contentDir = path.join(__dirname, 'content');
fs.mkdirSync(contentDir, { recursive: true });

const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const id = file.replace('.html', '');
  const html = fs.readFileSync(path.join(articlesDir, file), 'utf-8');

  // Extract inline styles
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  const inlineStyles = styleMatch ? styleMatch[1] : '';

  // Extract body content (between <body> and the scripts block at end)
  const bodyMatch = html.match(/<div class="progress"[^>]*><\/div>\s*([\s\S]*?)(?=\n<script src="\/assets\/content-data)/);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : '';

  // Extract title from <h1>
  const h1Match = html.match(/<h1>([\s\S]*?)<\/h1>/);
  const title = h1Match ? h1Match[1].trim() : '';

  // Extract subtitle
  const subtitleMatch = html.match(/<div class="subtitle">([\s\S]*?)<\/div>/);
  const subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';

  // Extract meta spans
  const metaMatch = html.match(/<div class="meta">([\s\S]*?)<\/div>/);
  const metaHtml = metaMatch ? metaMatch[1] : '';
  const spans = [...metaHtml.matchAll(/<span>(.*?)<\/span>/g)].map(m => m[1].trim());
  
  // Extract source link if present
  const sourceLinkMatch = metaHtml.match(/<a href="([^"]*)"[^>]*>([^<]*)<\/a>/);
  
  // Parse meta - format varies but typically: date, source, guest, duration
  const date = spans[0] || '';
  const source = spans[1] || '';
  const guest = spans[2] || '';
  const duration = spans[3] || '';
  const sourceUrl = sourceLinkMatch ? sourceLinkMatch[1] : '';
  const sourceLabel = sourceLinkMatch ? sourceLinkMatch[2].trim() : '';

  const data = {
    id,
    title,
    subtitle,
    guest,
    source,
    sourceUrl,
    sourceLabel,
    duration,
    date,
    inlineStyles,
    bodyContent
  };

  fs.writeFileSync(
    path.join(contentDir, `${id}.json`),
    JSON.stringify(data, null, 2),
    'utf-8'
  );
  console.log(`✓ ${id}`);
}
console.log(`\nExtracted ${files.length} articles.`);
