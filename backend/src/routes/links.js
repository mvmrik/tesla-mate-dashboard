import { Router } from 'express';
import { getSqlite } from '../db/sqlite.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getSqlite();
  res.json(db.prepare('SELECT * FROM links ORDER BY position').all());
});

router.post('/', (req, res) => {
  const { url, title, favicon } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  const db = getSqlite();
  const maxPos = db.prepare('SELECT COALESCE(MAX(position),0) as m FROM links').get().m;
  const info = db.prepare(
    'INSERT INTO links (url, title, favicon, position) VALUES (?, ?, ?, ?)'
  ).run(url, title || '', favicon || '', maxPos + 1);
  res.json({ id: info.lastInsertRowid, url, title, favicon, position: maxPos + 1 });
});

router.put('/:id', (req, res) => {
  const { url, title, favicon, position } = req.body;
  const db = getSqlite();
  db.prepare(
    'UPDATE links SET url=?, title=?, favicon=?, position=? WHERE id=?'
  ).run(url, title || '', favicon || '', position ?? 0, req.params.id);
  res.json({ ok: true });
});

router.post('/reorder', (req, res) => {
  const db   = getSqlite();
  const rows = req.body; // [{id, position}]
  const upd  = db.prepare('UPDATE links SET position=? WHERE id=?');
  const tx   = db.transaction(() => rows.forEach(r => upd.run(r.position, r.id)));
  tx();
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  const db = getSqlite();
  const info = db.prepare('DELETE FROM links WHERE id=?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// Proxy favicon fetch — fetches the full page URL to get title + favicon
router.get('/favicon', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    const parsed = new URL(url);
    const origin = parsed.origin;
    const ctrl   = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 5000);
    // Fetch the full URL (not just origin) to get the right page title
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    clearTimeout(timeout);
    const html = await r.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().slice(0, 60) : parsed.hostname;

    const faviconMatch =
      html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*icon[^"']*["']/i);

    let favicon = `${origin}/favicon.ico`;
    if (faviconMatch) {
      const href = faviconMatch[1];
      favicon = href.startsWith('http') ? href : new URL(href, url).href;
    }

    res.json({ title, favicon });
  } catch {
    try {
      const parsed = new URL(url);
      res.json({ title: parsed.hostname, favicon: `${parsed.origin}/favicon.ico` });
    } catch {
      res.json({ title: url, favicon: '' });
    }
  }
});

export default router;
