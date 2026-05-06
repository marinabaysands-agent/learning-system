// Learning System v2 — API Client + Highlights + Progress
const API_BASE = 'https://learning-system-api.majinghua02.workers.dev';

const api = {
  async get(path) { return (await fetch(`${API_BASE}${path}`)).json(); },
  async post(path, body) {
    return (await fetch(`${API_BASE}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })).json();
  },
  async put(path, body) {
    return (await fetch(`${API_BASE}${path}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })).json();
  },
  async del(path, body) {
    return (await fetch(`${API_BASE}${path}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })).json();
  }
};

// ===================== HIGHLIGHT SYSTEM =====================
const MIN_HIGHLIGHT_LENGTH = 6;

function initHighlights(contentId) {
  const LS_KEY = `hl:${contentId}`;
  let highlights = [];

  try { highlights = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch {}

  // Sync from API
  api.get(`/api/highlights/${contentId}`).then(data => {
    if (data && data.length) {
      const localIds = new Set(highlights.map(h => h.id));
      data.forEach(h => { if (!localIds.has(h.id)) highlights.push(h); });
      save();
    }
    render();
  }).catch(() => render());

  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(highlights)); } catch {}
  }

  const articles = document.querySelectorAll('.article');
  if (!articles.length) return;

  // Toast
  const toast = document.createElement('div');
  toast.className = 'hl-toast';
  document.body.appendChild(toast);

  function showToast(msg, duration = 1500, undoFn) {
    toast.innerHTML = undoFn ? `${msg} <button class="toast-undo">撤销</button>` : msg;
    toast.classList.add('show');
    if (undoFn) toast.querySelector('.toast-undo').onclick = (e) => { e.stopPropagation(); undoFn(); toast.classList.remove('show'); };
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), duration);
  }

  // Bottom bar (mobile) / floating toolbar (desktop)
  const bar = document.createElement('div');
  bar.className = 'hl-bar';
  bar.innerHTML = `
    <button class="hl-color" data-action="highlight" data-color="yellow" style="background:oklch(85% 0.15 85)"></button>
    <button class="hl-color" data-action="highlight" data-color="green" style="background:oklch(82% 0.14 155)"></button>
    <button class="hl-icon" data-action="note">💬</button>
    <button class="hl-icon" data-action="cancel">✕</button>
  `;
  document.body.appendChild(bar);

  let pendingSelection = null;

  function getTextPosition(container, range) {
    const pre = document.createRange();
    pre.selectNodeContents(container);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    return { start, end: start + range.toString().length };
  }

  function tryCapture() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      pendingSelection = null;
      bar.classList.remove('show');
      return;
    }
    const text = sel.toString().trim();
    // Minimum highlight length to prevent accidental micro-highlights on mobile
    if (text.length < MIN_HIGHLIGHT_LENGTH) {
      pendingSelection = null;
      bar.classList.remove('show');
      return;
    }
    const node = sel.anchorNode;
    const art = Array.from(articles).find(a => a.contains(node));
    if (!art) { pendingSelection = null; bar.classList.remove('show'); return; }
    const range = sel.getRangeAt(0);
    pendingSelection = { text, position: getTextPosition(art, range) };
    bar.classList.add('show');
    // Desktop: position bar above selection
    if (window.innerWidth >= 768) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      bar.style.position = 'absolute';
      bar.style.top = (window.scrollY + rect.top - bar.offsetHeight - 8) + 'px';
      bar.style.left = (rect.left + rect.width / 2) + 'px';
    }
  }

  let timer = null;
  document.addEventListener('selectionchange', () => {
    clearTimeout(timer);
    timer = setTimeout(tryCapture, 120);
  });
  document.addEventListener('mouseup', (e) => {
    if (bar.contains(e.target)) return;
    clearTimeout(timer);
    timer = setTimeout(tryCapture, 50);
  });
  document.addEventListener('touchend', (e) => {
    if (bar.contains(e.target)) return;
    setTimeout(tryCapture, 100);
    setTimeout(tryCapture, 400);
  }, { passive: true });

  // Prevent bar clicks from clearing selection
  bar.addEventListener('mousedown', (e) => { e.preventDefault(); });

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'cancel') {
      window.getSelection()?.removeAllRanges();
      bar.classList.remove('show');
      pendingSelection = null;
      return;
    }

    if (!pendingSelection) return;
    const { text, position } = pendingSelection;

    if (action === 'note') {
      bar.classList.remove('show');
      window.getSelection()?.removeAllRanges();
      openNoteNew(text, position);
      pendingSelection = null;
      return;
    }

    // Highlight
    const color = btn.dataset.color || 'yellow';
    const id = 'hl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const hl = { id, text, position, color };
    highlights.push(hl);
    render(); save();
    showToast('已高亮', 2000, () => {
      highlights = highlights.filter(h => h.id !== id);
      render(); save();
      showToast('已撤销', 1000);
    });
    api.post('/api/highlights', { contentId, highlight: hl }).catch(() => {});
    // Log activity
    logActivity(contentId, 'highlight', text.slice(0, 50));
    cleanup();
  });

  function cleanup() {
    window.getSelection()?.removeAllRanges();
    bar.classList.remove('show');
    pendingSelection = null;
  }

  // Click on existing highlight
  articles.forEach(art => art.addEventListener('click', (e) => {
    const mark = e.target.closest('.hl-mark');
    if (!mark || !mark.dataset.id) return;
    e.preventDefault();
    e.stopPropagation();
    openMenu(mark, highlights.find(h => h.id === mark.dataset.id), mark.dataset.id);
  }));

  function openMenu(mark, hl, hlId) {
    closeMenu();
    const overlay = document.createElement('div');
    overlay.className = 'hl-menu-overlay';
    const menu = document.createElement('div');
    menu.className = 'hl-menu';
    menu.innerHTML = `
      <div class="hl-menu-text">"${(hl?.text || mark.textContent).slice(0, 60)}…"</div>
      ${hl?.note ? `<div class="hl-menu-note">💬 ${hl.note}</div>` : ''}
      <div class="hl-menu-actions">
        <button data-action="note">💬 ${hl?.note ? '编辑批注' : '添加批注'}</button>
        <button data-action="delete" class="danger">🗑 删除</button>
      </div>
    `;
    overlay.appendChild(menu);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { closeMenu(); return; }
      const a = e.target.dataset.action;
      if (a === 'delete') {
        highlights = highlights.filter(h => h.id !== hlId);
        render(); save(); closeMenu();
        api.del('/api/highlights', { contentId, highlightId: hlId }).catch(() => {});
        showToast('已删除', 1200);
      } else if (a === 'note') {
        closeMenu();
        openNoteEdit(hl, hlId);
      }
    });
  }

  function closeMenu() {
    document.querySelectorAll('.hl-menu-overlay').forEach(el => el.remove());
  }

  function openNoteEdit(hl, hlId) {
    const overlay = document.createElement('div');
    overlay.className = 'note-overlay';
    overlay.innerHTML = `
      <div class="note-card">
        <div class="note-quote">"${(hl?.text || '').slice(0, 80)}…"</div>
        <textarea class="note-textarea" placeholder="写下你的批注...">${hl?.note || ''}</textarea>
        <div class="note-actions"><button class="note-cancel">取消</button><button class="note-save">保存</button></div>
      </div>
    `;
    document.body.appendChild(overlay);
    const ta = overlay.querySelector('.note-textarea');
    setTimeout(() => ta.focus(), 100);
    overlay.querySelector('.note-cancel').onclick = () => overlay.remove();
    overlay.querySelector('.note-save').onclick = () => {
      const idx = highlights.findIndex(h => h.id === hlId);
      if (idx >= 0) highlights[idx].note = ta.value.trim();
      render(); save(); overlay.remove();
      showToast('批注已保存', 1200);
      api.post('/api/highlights', { contentId, highlight: { ...hl, note: ta.value.trim() }, replace: true }).catch(() => {});
    };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  function openNoteNew(text, position) {
    const overlay = document.createElement('div');
    overlay.className = 'note-overlay';
    overlay.innerHTML = `
      <div class="note-card">
        <div class="note-quote">"${text.slice(0, 80)}${text.length > 80 ? '…' : ''}"</div>
        <textarea class="note-textarea" placeholder="写下你的批注..."></textarea>
        <div class="note-actions"><button class="note-cancel">取消</button><button class="note-save">保存</button></div>
      </div>
    `;
    document.body.appendChild(overlay);
    const ta = overlay.querySelector('.note-textarea');
    setTimeout(() => ta.focus(), 100);
    overlay.querySelector('.note-cancel').onclick = () => overlay.remove();
    overlay.querySelector('.note-save').onclick = () => {
      const id = 'hl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const hl = { id, text, position, note: ta.value.trim() };
      highlights.push(hl);
      render(); save(); overlay.remove();
      showToast('已高亮并添加批注', 1500);
      api.post('/api/highlights', { contentId, highlight: hl }).catch(() => {});
      logActivity(contentId, 'highlight', text.slice(0, 50));
    };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  function render() {
    articles.forEach(art => {
      art.querySelectorAll('.hl-mark').forEach(el => el.replaceWith(document.createTextNode(el.textContent)));
      art.normalize();
    });
    highlights.forEach(hl => {
      if (!hl.position) return;
      try { for (const art of articles) { if (applyMark(art, hl)) break; } } catch {}
    });
  }

  function applyMark(container, hl) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let pos = 0, node;
    while (node = walker.nextNode()) {
      const end = pos + node.length;
      if (pos < hl.position.end && end > hl.position.start) {
        const s = Math.max(0, hl.position.start - pos);
        const e = Math.min(node.length, hl.position.end - pos);
        const range = document.createRange();
        range.setStart(node, s);
        range.setEnd(node, e);
        const mark = document.createElement('mark');
        mark.className = 'hl-mark';
        if (hl.color) mark.dataset.color = hl.color;
        mark.dataset.id = hl.id;
        if (hl.note) mark.classList.add('has-note');
        range.surroundContents(mark);
        return true;
      }
      pos = end;
    }
  }

  render();
}

// ===================== READING PROGRESS =====================
function initProgress(contentId) {
  let ticking = false;
  const prog = document.getElementById('prog');

  api.get(`/api/progress/${contentId}`).then(data => {
    if (data && data.read_progress > 0.05) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, h * data.read_progress);
    }
  });

  // Log reading activity once per session
  let readLogged = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? window.scrollY / h : 0;
      if (prog) prog.style.width = (pct * 100) + '%';

      // Log reading activity once
      if (!readLogged && pct > 0.05) {
        readLogged = true;
        logActivity(contentId, 'read');
      }

      // Only save progress when user has scrolled meaningfully (>5%)
      // This prevents page-load scroll events from overwriting real progress
      if (pct > 0.05 && (!initProgress._lastSave || Date.now() - initProgress._lastSave > 5000)) {
        initProgress._lastSave = Date.now();
        const status = pct > 0.9 ? 'read' : 'reading';
        api.put('/api/progress', { contentId, status, read_progress: pct });
      }
      ticking = false;
    });
  });
}

// ===================== ACTIVITY LOGGING =====================
function logActivity(contentId, type, detail) {
  const today = new Date().toISOString().slice(0, 10);
  api.post('/api/activity', { date: today, contentId, type, detail }).catch(() => {});
}

// ===================== HEATMAP =====================
async function initHeatmap(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const today = new Date();
  const days = 90;
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days + 1);

  // Fetch activity data
  const from = startDate.toISOString().slice(0, 10);
  const to = today.toISOString().slice(0, 10);
  let activityData = {};
  try {
    activityData = await api.get(`/api/activity?from=${from}&to=${to}`);
  } catch {}

  // Build grid
  const grid = document.createElement('div');
  grid.className = 'heatmap';

  // Day labels
  const dayLabels = document.createElement('div');
  dayLabels.className = 'heatmap-days';
  ['', 'Mon', '', 'Wed', '', 'Fri', ''].forEach(d => {
    const el = document.createElement('div');
    el.className = 'heatmap-day-label';
    el.textContent = d;
    dayLabels.appendChild(el);
  });

  // Weeks
  const weeksContainer = document.createElement('div');
  weeksContainer.className = 'heatmap-weeks';

  // Month labels container
  const monthLabels = document.createElement('div');
  monthLabels.className = 'heatmap-months';

  const d = new Date(startDate);
  // Align to start of week (Sunday)
  d.setDate(d.getDate() - d.getDay());

  let currentMonth = -1;
  let weekCount = 0;

  while (d <= today || d.getDay() !== 0) {
    if (d > today && d.getDay() === 0) break;

    const week = document.createElement('div');
    week.className = 'heatmap-week';

    // Month label
    if (d.getMonth() !== currentMonth) {
      currentMonth = d.getMonth();
      const ml = document.createElement('div');
      ml.className = 'heatmap-month-label';
      ml.textContent = d.toLocaleDateString('zh-CN', { month: 'short' });
      ml.style.gridColumnStart = weekCount + 1;
      monthLabels.appendChild(ml);
    }

    for (let i = 0; i < 7; i++) {
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      const dateStr = d.toISOString().slice(0, 10);

      if (d > today || d < startDate) {
        cell.classList.add('empty');
      } else {
        const activities = activityData[dateStr] || [];
        const count = Array.isArray(activities) ? activities.length : 0;
        const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;
        cell.dataset.level = level;
        cell.dataset.date = dateStr;
        cell.title = `${dateStr}: ${count} 次活动`;

        cell.addEventListener('click', () => showDayDetail(dateStr, activities));
      }

      week.appendChild(cell);
      d.setDate(d.getDate() + 1);
    }
    weeksContainer.appendChild(week);
    weekCount++;
  }

  // Assemble
  const wrapper = document.createElement('div');
  wrapper.className = 'heatmap-wrapper';
  wrapper.appendChild(monthLabels);

  const body = document.createElement('div');
  body.className = 'heatmap-body';
  body.appendChild(dayLabels);
  body.appendChild(weeksContainer);
  wrapper.appendChild(body);

  // Legend
  const legend = document.createElement('div');
  legend.className = 'heatmap-legend';
  legend.innerHTML = '<span>少</span>' +
    [0,1,2,3,4].map(l => `<div class="heatmap-cell" data-level="${l}"></div>`).join('') +
    '<span>多</span>';
  wrapper.appendChild(legend);

  // Day detail tooltip
  const detail = document.createElement('div');
  detail.className = 'heatmap-detail';
  detail.id = 'heatmap-detail';
  wrapper.appendChild(detail);

  container.innerHTML = '';
  container.appendChild(wrapper);
}

function showDayDetail(date, activities) {
  const detail = document.getElementById('heatmap-detail');
  if (!detail) return;

  if (!activities || !activities.length) {
    detail.innerHTML = `<div class="heatmap-detail-date">${date}</div><div class="heatmap-detail-empty">这天没有学习活动</div>`;
  } else {
    const items = activities.map(a => {
      const icons = { read: '📖', highlight: '✏️', conversation: '💬', output: '📝' };
      return `<div class="heatmap-detail-item">${icons[a.type] || '•'} ${a.detail || a.type}</div>`;
    }).join('');
    detail.innerHTML = `<div class="heatmap-detail-date">${date}</div>${items}`;
  }
  detail.classList.add('show');
  setTimeout(() => detail.classList.remove('show'), 4000);
}
