const { JSDOM } = require('jsdom');
const assert = require('assert');

// Extract applyMark and render logic for testing
function createTestEnv(html) {
  const dom = new JSDOM(`<div class="article">${html}</div>`);
  const document = dom.window.document;
  const container = document.querySelector('.article');
  
  function applyMark(container, hl) {
    const walker = document.createTreeWalker(container, 4 /* SHOW_TEXT */);
    let pos = 0, node;
    const nodes = [];
    while (node = walker.nextNode()) {
      const end = pos + node.length;
      if (pos < hl.position.end && end > hl.position.start) {
        nodes.push({ node, pos, end });
      }
      pos = end;
    }
    if (!nodes.length) return false;

    for (let i = nodes.length - 1; i >= 0; i--) {
      const { node, pos: nodeStart } = nodes[i];
      const s = Math.max(0, hl.position.start - nodeStart);
      const e = Math.min(node.length, hl.position.end - nodeStart);
      const range = document.createRange();
      range.setStart(node, s);
      range.setEnd(node, e);
      const mark = document.createElement('mark');
      mark.className = 'hl-mark';
      if (hl.color) mark.dataset.color = hl.color;
      mark.dataset.id = hl.id;
      range.surroundContents(mark);
    }
    return true;
  }

  function render(highlights) {
    // Clear existing marks
    container.querySelectorAll('.hl-mark').forEach(el => el.replaceWith(document.createTextNode(el.textContent)));
    container.normalize();
    // Sort descending by start
    const sorted = [...highlights].filter(h => h.position).sort((a, b) => b.position.start - a.position.start);
    sorted.forEach(hl => applyMark(container, hl));
  }

  return { container, document, applyMark, render };
}

function getPlainText(container) {
  const walker = container.ownerDocument.createTreeWalker(container, 4);
  let text = '', node;
  while (node = walker.nextNode()) text += node.textContent;
  return text;
}

let passed = 0, failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  ${e.message}`);
    failed++;
  }
}

// Test 1: Single text node highlight
test('Single text node highlight', () => {
  const { container, applyMark } = createTestEnv('<p>Hello world this is a test</p>');
  const hl = { id: '1', position: { start: 6, end: 11 }, color: 'yellow' };
  applyMark(container, hl);
  const mark = container.querySelector('mark');
  assert(mark, 'mark element should exist');
  assert.strictEqual(mark.textContent, 'world');
  assert.strictEqual(mark.dataset.color, 'yellow');
});

// Test 2: Cross-node highlight (spanning <em> or <strong>)
test('Cross-node highlight spanning <strong>', () => {
  // "Hello <strong>bold world</strong> end" → plain text: "Hello bold world end"
  const { container, applyMark } = createTestEnv('<p>Hello <strong>bold world</strong> end</p>');
  // Highlight "lo bold wo" (positions 3-13)
  const hl = { id: '2', position: { start: 3, end: 13 }, color: 'blue' };
  applyMark(container, hl);
  const marks = container.querySelectorAll('mark');
  assert.strictEqual(marks.length, 2, 'should create 2 marks for cross-node');
  // Combined text
  const markText = Array.from(marks).map(m => m.textContent).join('');
  assert.strictEqual(markText, 'lo bold wo');
});

// Test 3: Multiple non-overlapping highlights (sorted desc)
test('Multiple non-overlapping highlights', () => {
  const { container, render } = createTestEnv('<p>The quick brown fox jumps over the lazy dog</p>');
  const highlights = [
    { id: '1', position: { start: 4, end: 9 }, color: 'yellow' },   // "quick"
    { id: '2', position: { start: 20, end: 25 }, color: 'green' },  // "jumps"
  ];
  render(highlights);
  const marks = container.querySelectorAll('mark');
  assert.strictEqual(marks.length, 2);
  assert.strictEqual(marks[0].textContent, 'quick');
  assert.strictEqual(marks[1].textContent, 'jumps');
});

// Test 4: Highlight at very start of container
test('Highlight at start of container', () => {
  const { container, applyMark } = createTestEnv('<p>Starting text here</p>');
  const hl = { id: '3', position: { start: 0, end: 8 }, color: 'red' };
  applyMark(container, hl);
  const mark = container.querySelector('mark');
  assert(mark, 'mark should exist');
  assert.strictEqual(mark.textContent, 'Starting');
});

// Test 5: Highlight at very end of container
test('Highlight at end of container', () => {
  const { container, applyMark } = createTestEnv('<p>Some text here</p>');
  // "Some text here" length=14, highlight "here" = 10-14
  const hl = { id: '4', position: { start: 10, end: 14 }, color: 'pink' };
  applyMark(container, hl);
  const mark = container.querySelector('mark');
  assert(mark, 'mark should exist');
  assert.strictEqual(mark.textContent, 'here');
});

// Test 6: Cross-node with <em>
test('Cross-node highlight spanning <em>', () => {
  const { container, applyMark } = createTestEnv('<p>Say <em>hello world</em> today</p>');
  // plain: "Say hello world today", highlight "hello world" = 4-15
  const hl = { id: '5', position: { start: 4, end: 15 }, color: 'orange' };
  applyMark(container, hl);
  const marks = container.querySelectorAll('mark');
  assert.strictEqual(marks.length, 1, 'entirely within <em> = 1 mark');
  assert.strictEqual(marks[0].textContent, 'hello world');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
