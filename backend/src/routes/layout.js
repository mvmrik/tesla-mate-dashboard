import { Router } from 'express';
import { getSqlite } from '../db/sqlite.js';

const router = Router();

// GET /api/layout/:carId — full layout with blocks and slot_widgets
router.get('/:carId', (req, res) => {
  const carId = parseInt(req.params.carId) || 1;
  const db = getSqlite();
  const blocks = db.prepare(
    'SELECT * FROM blocks WHERE car_id = ? ORDER BY position'
  ).all(carId);

  const slots = db.prepare(
    `SELECT sw.* FROM slot_widgets sw
     JOIN blocks b ON b.id = sw.block_id
     WHERE b.car_id = ?`
  ).all(carId);

  const slotsByBlock = {};
  for (const s of slots) {
    if (!slotsByBlock[s.block_id]) slotsByBlock[s.block_id] = [];
    slotsByBlock[s.block_id].push({ ...s, config: JSON.parse(s.config || '{}') });
  }

  res.json(blocks.map(b => ({ ...b, slots: slotsByBlock[b.id] || [] })));
});

// POST /api/layout/:carId/blocks — add a new block
router.post('/:carId/blocks', (req, res) => {
  const carId = parseInt(req.params.carId) || 1;
  const db = getSqlite();
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) AS m FROM blocks WHERE car_id = ?').get(carId).m;
  const info = db.prepare('INSERT INTO blocks (car_id, position) VALUES (?, ?)').run(carId, maxPos + 1);
  const block = db.prepare('SELECT * FROM blocks WHERE id = ?').get(info.lastInsertRowid);
  res.json({ ...block, slots: [] });
});

// DELETE /api/layout/blocks/:blockId — delete block (cascades slots)
router.delete('/blocks/:blockId', (req, res) => {
  const db = getSqlite();
  db.prepare('DELETE FROM blocks WHERE id = ?').run(parseInt(req.params.blockId));
  res.json({ ok: true });
});

// PUT /api/layout/:carId/blocks/reorder — reorder blocks
router.put('/:carId/blocks/reorder', (req, res) => {
  const db = getSqlite();
  const ids = req.body; // array of block ids in new order
  const upd = db.prepare('UPDATE blocks SET position = ? WHERE id = ?');
  const tx = db.transaction(() => ids.forEach((id, i) => upd.run(i, id)));
  tx();
  res.json({ ok: true });
});

// POST /api/layout/blocks/:blockId/slots — add widget to slot
router.post('/blocks/:blockId/slots', (req, res) => {
  const blockId = parseInt(req.params.blockId);
  const { slot, widget_id, config = {} } = req.body;
  if (slot == null || !widget_id) return res.status(400).json({ error: 'slot and widget_id required' });
  const db = getSqlite();
  db.prepare(
    'INSERT OR REPLACE INTO slot_widgets (block_id, slot, widget_id, config) VALUES (?, ?, ?, ?)'
  ).run(blockId, slot, widget_id, JSON.stringify(config));
  const row = db.prepare('SELECT * FROM slot_widgets WHERE block_id = ? AND slot = ?').get(blockId, slot);
  res.json({ ...row, config: JSON.parse(row.config) });
});

// DELETE /api/layout/slots/:slotId — remove widget from slot
router.delete('/slots/:slotId', (req, res) => {
  const db = getSqlite();
  db.prepare('DELETE FROM slot_widgets WHERE id = ?').run(parseInt(req.params.slotId));
  res.json({ ok: true });
});

// PUT /api/layout/slots/:slotId/config — update slot config (e.g. link url/title)
router.put('/slots/:slotId/config', (req, res) => {
  const db = getSqlite();
  db.prepare('UPDATE slot_widgets SET config = ? WHERE id = ?').run(
    JSON.stringify(req.body),
    parseInt(req.params.slotId)
  );
  res.json({ ok: true });
});

export default router;
