// Learning System API Worker v2
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function err(msg, status = 400) {
  return json({ error: msg }, status);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // --- Highlights ---
      if (path.match(/^\/api\/highlights\/[\w-]+$/) && method === 'GET') {
        const contentId = path.split('/').pop();
        const data = await env.KV.get(`highlights:${contentId}`, 'json');
        return json(data || []);
      }

      if (path === '/api/highlights' && method === 'POST') {
        const body = await request.json();
        const { contentId, highlight } = body;
        if (!contentId || !highlight) return err('Missing contentId or highlight');
        const key = `highlights:${contentId}`;
        const existing = (await env.KV.get(key, 'json')) || [];
        if (body.replace && highlight.id) {
          const idx = existing.findIndex(h => h.id === highlight.id);
          if (idx >= 0) {
            existing[idx] = { ...existing[idx], ...highlight };
            await env.KV.put(key, JSON.stringify(existing));
            return json(existing[idx]);
          }
        }
        highlight.id = highlight.id || crypto.randomUUID();
        highlight.created_at = highlight.created_at || new Date().toISOString();
        existing.push(highlight);
        await env.KV.put(key, JSON.stringify(existing));
        return json(highlight, 201);
      }

      if (path === '/api/highlights' && method === 'DELETE') {
        const body = await request.json();
        const { contentId, highlightId } = body;
        if (!contentId || !highlightId) return err('Missing contentId or highlightId');
        const key = `highlights:${contentId}`;
        const existing = (await env.KV.get(key, 'json')) || [];
        const filtered = existing.filter(h => h.id !== highlightId);
        await env.KV.put(key, JSON.stringify(filtered));
        return json({ ok: true });
      }

      // --- Progress ---
      if (path.match(/^\/api\/progress\/[\w-]+$/) && method === 'GET') {
        const contentId = path.split('/').pop();
        const data = await env.KV.get(`progress:${contentId}`, 'json');
        return json(data || { status: 'unread', read_progress: 0 });
      }

      if (path === '/api/progress' && (method === 'PUT' || method === 'POST')) {
        let body;
        try { body = await request.json(); } catch { 
          // sendBeacon sends text/plain, try parsing text
          const text = await request.text();
          body = JSON.parse(text);
        }
        const { contentId, status, read_progress } = body;
        if (!contentId) return err('Missing contentId');
        const key = `progress:${contentId}`;
        const existing = (await env.KV.get(key, 'json')) || { status: 'unread', read_progress: 0 };
        if (status) existing.status = status;
        if (read_progress !== undefined) existing.read_progress = read_progress;
        existing.last_interaction = new Date().toISOString();
        await env.KV.put(key, JSON.stringify(existing));
        return json(existing);
      }

      // --- All Notes (aggregate) ---
      if (path === '/api/notes' && method === 'GET') {
        const notes = {};
        const list = await env.KV.list({ prefix: 'highlights:' });
        for (const key of list.keys) {
          const contentId = key.name.replace('highlights:', '');
          if (!notes[contentId]) notes[contentId] = {};
          notes[contentId].highlights = await env.KV.get(key.name, 'json');
        }
        return json(notes);
      }

      // --- All Progress ---
      if (path === '/api/progress' && method === 'GET') {
        const progress = {};
        const list = await env.KV.list({ prefix: 'progress:' });
        for (const key of list.keys) {
          const contentId = key.name.replace('progress:', '');
          progress[contentId] = await env.KV.get(key.name, 'json');
        }
        return json(progress);
      }

      // --- Activity Log (for heatmap) ---
      if (path === '/api/activity' && method === 'POST') {
        const body = await request.json();
        const { date, contentId, type, detail } = body;
        if (!date || !type) return err('Missing date or type');
        const key = `activity:${date}`;
        const existing = (await env.KV.get(key, 'json')) || [];
        existing.push({
          contentId: contentId || null,
          type,
          detail: detail || null,
          timestamp: new Date().toISOString()
        });
        await env.KV.put(key, JSON.stringify(existing));
        return json({ ok: true }, 201);
      }

      if (path === '/api/activity' && method === 'GET') {
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');
        if (!from || !to) return err('Missing from or to');

        const result = {};
        const start = new Date(from);
        const end = new Date(to);
        const d = new Date(start);

        while (d <= end) {
          const dateStr = d.toISOString().slice(0, 10);
          const data = await env.KV.get(`activity:${dateStr}`, 'json');
          if (data && data.length) result[dateStr] = data;
          d.setDate(d.getDate() + 1);
        }
        return json(result);
      }

      // --- Conversation (for learning dialogue storage) ---
      if (path === '/api/conversation' && method === 'POST') {
        const body = await request.json();
        const { contentId, date, type, messages, related_highlights } = body;
        if (!contentId || !date) return err('Missing contentId or date');
        const key = `conversation:${contentId}:${date}`;
        const convo = { contentId, date, type, messages, related_highlights, created_at: new Date().toISOString() };
        await env.KV.put(key, JSON.stringify(convo));
        return json(convo, 201);
      }

      if (path.match(/^\/api\/conversations\/[\w-]+$/) && method === 'GET') {
        const contentId = path.split('/').pop();
        const list = await env.KV.list({ prefix: `conversation:${contentId}:` });
        const convos = [];
        for (const key of list.keys) {
          const data = await env.KV.get(key.name, 'json');
          if (data) convos.push(data);
        }
        convos.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        return json(convos);
      }

      // --- Schedule (spaced repetition) ---
      if (path.match(/^\/api\/schedule\/[\w-]+$/) && method === 'GET') {
        const contentId = path.split('/').pop();
        const data = await env.KV.get(`schedule:${contentId}`, 'json');
        return json(data || null);
      }

      if (path === '/api/schedule' && method === 'GET') {
        const schedules = {};
        const list = await env.KV.list({ prefix: 'schedule:' });
        for (const key of list.keys) {
          const contentId = key.name.replace('schedule:', '');
          schedules[contentId] = await env.KV.get(key.name, 'json');
        }
        return json(schedules);
      }

      if (path === '/api/schedule' && method === 'PUT') {
        const body = await request.json();
        const { contentId, next_push, push_count, last_pushed, stage } = body;
        if (!contentId) return err('Missing contentId');
        const key = `schedule:${contentId}`;
        const data = { contentId, next_push, push_count, last_pushed, stage };
        await env.KV.put(key, JSON.stringify(data));
        return json(data);
      }

      return err('Not found', 404);
    } catch (e) {
      return err(e.message, 500);
    }
  },
};
