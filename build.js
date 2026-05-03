// build.js — generate article HTML from content JSON + template
const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, 'content');
const templatePath = path.join(__dirname, 'templates/article.html');
const outputDir = path.join(__dirname, 'site/articles');

const template = fs.readFileSync(templatePath, 'utf-8');
fs.mkdirSync(outputDir, { recursive: true });

const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.json'));
let count = 0;

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(contentDir, file), 'utf-8'));
  
  let html = template
    .replace(/\{\{id\}\}/g, data.id)
    .replace('{{title}}', data.title)
    .replace('{{inlineStyles}}', data.inlineStyles ? `<style>${data.inlineStyles}</style>` : '')
    .replace('{{bodyContent}}', data.bodyContent);

  fs.writeFileSync(path.join(outputDir, `${data.id}.html`), html, 'utf-8');
  count++;
  console.log(`✓ ${data.id}`);
}

console.log(`\nBuilt ${count} articles.`);
