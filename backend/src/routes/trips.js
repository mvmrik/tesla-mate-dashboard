import { Router } from 'express';
import { getSqlite } from '../db/sqlite.js';
import { getPool } from '../db/postgres.js';

const router = Router();

async function getTripStats(pool, carId, startDate, endDate) {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*)                                    AS drives_count,
      ROUND(SUM(d.distance)::numeric, 1)          AS total_km,
      SUM(d.duration_min)                         AS total_min,
      MAX(d.speed_max)                            AS speed_max,
      CASE WHEN SUM(d.duration_min) > 0
        THEN ROUND((SUM(d.distance) / (SUM(d.duration_min) / 60.0))::numeric, 0)
        ELSE NULL
      END                                         AS avg_speed_kmh,
      CASE WHEN SUM(d.distance) > 0
        THEN ROUND(
          (SUM((d.start_rated_range_km - d.end_rated_range_km) * c.efficiency)
           / SUM(d.distance) * 100)::numeric, 1)
        ELSE NULL
      END                                         AS avg_kwh_per_100km
    FROM drives d
    JOIN cars c ON c.id = d.car_id
    WHERE d.car_id = $1
      AND d.end_date IS NOT NULL
      AND d.end_date >= $2::timestamptz
      AND ($3::timestamptz IS NULL OR d.start_date <= $3::timestamptz)
      AND d.distance > 0.1
  `, [carId, startDate, endDate || null]);
  return rows[0] || {};
}

// GET /api/trips/active?car_id=1 — active trips with live stats (fast path)
router.get('/active', async (req, res) => {
  const carId = parseInt(req.query.car_id) || 1;
  try {
    const db   = getSqlite();
    const pool = getPool();
    const rows = db.prepare(
      'SELECT * FROM trips WHERE car_id = ? AND end_date IS NULL ORDER BY start_date DESC'
    ).all(carId);

    const trips = await Promise.all(rows.map(async t => ({
      ...t,
      stats: await getTripStats(pool, carId, t.start_date, null),
    })));
    res.json(trips);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/trips/history?car_id=1 — completed trips with stats (lazy, only on modal open)
router.get('/history', async (req, res) => {
  const carId = parseInt(req.query.car_id) || 1;
  try {
    const db   = getSqlite();
    const pool = getPool();
    const rows = db.prepare(
      'SELECT * FROM trips WHERE car_id = ? AND end_date IS NOT NULL ORDER BY start_date DESC'
    ).all(carId);

    const trips = await Promise.all(rows.map(async t => ({
      ...t,
      stats: await getTripStats(pool, carId, t.start_date, t.end_date),
    })));
    res.json(trips);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/trips — create new trip
router.post('/', async (req, res) => {
  const { name, car_id = 1 } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT ROUND(p.odometer::numeric, 0) AS odometer_km
       FROM positions p WHERE p.car_id = $1 ORDER BY p.date DESC LIMIT 1`,
      [car_id]
    );
    const odometer = rows[0]?.odometer_km ?? null;
    const now = new Date().toISOString();
    const db  = getSqlite();
    const info = db.prepare(
      'INSERT INTO trips (car_id, name, start_date, start_odometer) VALUES (?, ?, ?, ?)'
    ).run(car_id, name.trim(), now, odometer);
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(info.lastInsertRowid);
    res.json({ ...trip, stats: {} });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/trips/:id/stop — stop a trip
router.put('/:id/stop', (req, res) => {
  const db  = getSqlite();
  const now = new Date().toISOString();
  const info = db.prepare(
    'UPDATE trips SET end_date = ? WHERE id = ? AND end_date IS NULL'
  ).run(now, parseInt(req.params.id));
  if (!info.changes) return res.status(404).json({ error: 'Trip not found or already stopped' });
  res.json({ ok: true });
});

// GET /api/trips/:id/states — states/drives/charging during a trip
router.get('/:id/states', async (req, res) => {
  const tripId = parseInt(req.params.id);
  const carId  = parseInt(req.query.car_id) || 1;
  try {
    const db   = getSqlite();
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const tripStart = trip.start_date;
    const tripEnd   = trip.end_date || new Date().toISOString();
    const pool = getPool();

    const [{ rows }, { rows: driveStats }, { rows: elevStats }, { rows: chargeStats }] = await Promise.all([
      pool.query(`
        SELECT state::text, start_date, end_date FROM states
        WHERE car_id = $1
          AND start_date <= $3::timestamptz
          AND (end_date IS NULL OR end_date >= $2::timestamptz)

        UNION ALL

        SELECT 'driving'::text AS state, start_date, end_date FROM drives
        WHERE car_id = $1
          AND start_date <= $3::timestamptz
          AND (end_date IS NULL OR end_date >= $2::timestamptz)

        UNION ALL

        SELECT 'charging'::text AS state, start_date, end_date FROM charging_processes
        WHERE car_id = $1
          AND start_date <= $3::timestamptz
          AND (end_date IS NULL OR end_date >= $2::timestamptz)

        ORDER BY start_date
      `, [carId, tripStart, tripEnd]),

      pool.query(`
        SELECT
          ROUND(SUM(d.distance)::numeric, 1)          AS total_km,
          SUM(d.duration_min)                         AS total_min,
          MAX(d.speed_max)                            AS speed_max,
          CASE WHEN SUM(d.duration_min) > 0
            THEN ROUND((SUM(d.distance) / (SUM(d.duration_min) / 60.0))::numeric, 0)
            ELSE NULL
          END                                         AS avg_speed_kmh,
          CASE WHEN SUM(d.distance) > 0
            THEN ROUND(
              (SUM((d.start_rated_range_km - d.end_rated_range_km) * c.efficiency)
               / SUM(d.distance) * 100)::numeric, 1)
            ELSE NULL
          END                                         AS avg_kwh_per_100km,
          ROUND(SUM((d.start_rated_range_km - d.end_rated_range_km) * c.efficiency)::numeric, 1) AS total_kwh,
          ROUND(AVG(d.outside_temp_avg)::numeric, 1)  AS avg_outside_temp,
          ROUND(MIN(d.outside_temp_avg)::numeric, 1)  AS min_outside_temp,
          ROUND(MAX(d.outside_temp_avg)::numeric, 1)  AS max_outside_temp,
          MAX(d.power_max)                            AS power_max_kw,
          MIN(d.power_min)                            AS power_min_kw,
          SUM(d.ascent)                               AS total_ascent,
          SUM(d.descent)                              AS total_descent
        FROM drives d
        JOIN cars c ON c.id = d.car_id
        WHERE d.car_id = $1
          AND d.end_date IS NOT NULL
          AND d.end_date >= $2::timestamptz
          AND d.start_date <= $3::timestamptz
          AND d.distance > 0.1
      `, [carId, tripStart, tripEnd]),

      pool.query(`
        SELECT
          ROUND(MIN(p.elevation)::numeric, 0)                                              AS elevation_min,
          ROUND(MAX(p.elevation)::numeric, 0)                                              AS elevation_max,
          ROUND(AVG(p.elevation)::numeric, 0)                                              AS elevation_avg,
          MIN(p.battery_level)                                                             AS battery_min,
          MAX(p.battery_level)                                                             AS battery_max,
          ROUND(AVG(p.inside_temp) FILTER (WHERE p.drive_id IS NOT NULL)::numeric, 1)     AS avg_inside_temp_driving,
          ROUND(MIN(p.inside_temp) FILTER (WHERE p.drive_id IS NOT NULL)::numeric, 1)     AS min_inside_temp_driving,
          ROUND(MAX(p.inside_temp) FILTER (WHERE p.drive_id IS NOT NULL)::numeric, 1)     AS max_inside_temp_driving,
          ROUND(AVG(p.inside_temp) FILTER (WHERE p.drive_id IS NULL)::numeric, 1)         AS avg_inside_temp_parked,
          ROUND(MIN(p.inside_temp) FILTER (WHERE p.drive_id IS NULL)::numeric, 1)         AS min_inside_temp_parked,
          ROUND(MAX(p.inside_temp) FILTER (WHERE p.drive_id IS NULL)::numeric, 1)         AS max_inside_temp_parked
        FROM positions p
        WHERE p.car_id = $1
          AND p.date >= $2::timestamptz
          AND p.date <= $3::timestamptz
      `, [carId, tripStart, tripEnd]),

      pool.query(`
        SELECT
          COUNT(*)                                                                                         AS charge_count,
          ROUND(SUM(EXTRACT(EPOCH FROM (COALESCE(end_date, NOW()) - start_date)) / 60)::numeric, 0)::int  AS charge_min,
          ROUND(COALESCE(SUM(charge_energy_added), 0)::numeric, 1)                                       AS total_charge_kwh,
          CASE WHEN COALESCE(SUM(charge_energy_used), 0) > 0
            THEN ROUND((SUM(charge_energy_added) / SUM(charge_energy_used) * 100)::numeric, 1)
            ELSE NULL
          END                                                                                             AS charge_efficiency
        FROM charging_processes
        WHERE car_id = $1
          AND start_date <= $3::timestamptz
          AND (end_date IS NULL OR end_date >= $2::timestamptz)
          AND charge_energy_used IS NOT NULL
      `, [carId, tripStart, tripEnd]),
    ]);

    const stats = {
      ...driveStats[0],
      ...elevStats[0],
      ...chargeStats[0],
    };

    res.json({ trip, states: rows, stats });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/trips/:id
router.delete('/:id', (req, res) => {
  const db = getSqlite();
  db.prepare('DELETE FROM trips WHERE id = ?').run(parseInt(req.params.id));
  res.json({ ok: true });
});

export default router;
