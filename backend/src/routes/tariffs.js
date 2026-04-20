import { Router } from 'express';
import { getSqlite } from '../db/sqlite.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getSqlite();
  const gid = req.query.geofence_id ? parseInt(req.query.geofence_id) : null;
  let rows;
  if (gid) {
    rows = db.prepare(`
      SELECT id, geofence_id, geofence_name, month, night_start, night_end,
             price_day, price_night, valid_from
      FROM monthly_tariffs WHERE geofence_id = ?
      ORDER BY month, valid_from DESC
    `).all(gid);
  } else {
    rows = db.prepare(`
      SELECT id, geofence_id, geofence_name, month, night_start, night_end,
             price_day, price_night, valid_from
      FROM monthly_tariffs
      ORDER BY geofence_id, month, valid_from DESC
    `).all();
  }
  res.json(rows);
});

router.post('/', (req, res) => {
  const db = getSqlite();
  const body = req.body;
  const rows = Array.isArray(body) ? body : [body];

  const ins = db.prepare(`
    INSERT INTO monthly_tariffs
      (geofence_id, geofence_name, month, night_start, night_end, price_day, price_night, valid_from)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(geofence_id, month, valid_from) DO UPDATE SET
      geofence_name = excluded.geofence_name,
      night_start   = excluded.night_start,
      night_end     = excluded.night_end,
      price_day     = excluded.price_day,
      price_night   = excluded.price_night
  `);

  const insertMany = db.transaction((rows) => {
    let inserted = 0;
    for (const r of rows) {
      const gid   = parseInt(r.geofence_id || 0);
      const gname = String(r.geofence_name || '').trim();
      const month = parseInt(r.month || 0);
      const ns    = parseInt(r.night_start ?? 22);
      const ne    = parseInt(r.night_end   ?? 6);
      const pd    = parseFloat(r.price_day  || 0);
      const pn    = parseFloat(r.price_night || 0);
      const vf    = String(r.valid_from || '').trim();

      if (!gid || !gname || month < 1 || month > 12 || !pd || !pn || !vf) {
        throw new Error(`Invalid row for month ${month}`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(vf)) {
        throw new Error(`valid_from must be YYYY-MM-DD, got: ${vf}`);
      }
      ins.run(gid, gname, month, ns, ne, pd, pn, vf);
      inserted++;
    }
    return inserted;
  });

  try {
    const inserted = insertMany(rows);
    res.json({ ok: true, inserted });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/', (req, res) => {
  const id = parseInt(req.query.id || 0);
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const db = getSqlite();
  const info = db.prepare('DELETE FROM monthly_tariffs WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;
