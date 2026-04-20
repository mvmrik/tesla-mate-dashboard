import { Router } from 'express';
import { getSqlite } from '../db/sqlite.js';

const router = Router();

router.get('/:carId', (req, res) => {
  const carId = parseInt(req.params.carId) || 1;
  const db = getSqlite();
  const rows = db.prepare(`
    SELECT widget_id, position, enabled
    FROM widget_layout WHERE car_id = ?
    ORDER BY position
  `).all(carId);
  res.json(rows);
});

router.put('/:carId', (req, res) => {
  const carId = parseInt(req.params.carId) || 1;
  const layout = req.body; // [{ widget_id, position, enabled }]
  if (!Array.isArray(layout)) return res.status(400).json({ error: 'Expected array' });

  const db = getSqlite();
  const upsert = db.prepare(`
    INSERT INTO widget_layout (car_id, widget_id, position, enabled)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(car_id, widget_id) DO UPDATE SET
      position = excluded.position,
      enabled  = excluded.enabled
  `);
  const updateAll = db.transaction((items) => {
    for (const item of items) {
      upsert.run(carId, item.widget_id, item.position, item.enabled ? 1 : 0);
    }
  });
  updateAll(layout);
  res.json({ ok: true });
});

router.get('/:carId/geofences', async (req, res) => {
  const { getPool } = await import('../db/postgres.js');
  try {
    const { rows } = await getPool().query(
      'SELECT id, name FROM geofences ORDER BY name'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
