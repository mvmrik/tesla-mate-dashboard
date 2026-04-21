import { Router } from 'express';
import { getSqlite } from '../db/sqlite.js';

const router = Router();

const DEFAULTS = {
  timezone:     'UTC',
  timeFormat:   '24h',
  distanceUnit: 'km',
  tempUnit:     'C',
};

router.get('/', (req, res) => {
  const db = getSqlite();
  const rows = db.prepare('SELECT key, value FROM app_settings').all();
  const settings = { ...DEFAULTS };
  for (const row of rows) settings[row.key] = row.value;
  res.json(settings);
});

router.put('/', (req, res) => {
  const db = getSqlite();
  const allowed = ['timezone', 'timeFormat', 'distanceUnit', 'tempUnit'];
  const upsert = db.prepare(
    'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  const save = db.transaction((data) => {
    for (const key of allowed) {
      if (data[key] !== undefined) upsert.run(key, String(data[key]));
    }
  });
  save(req.body);
  res.json({ ok: true });
});

export default router;
