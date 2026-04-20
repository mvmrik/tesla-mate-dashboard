import { Router } from 'express';
import { getPool, testConnection } from '../db/postgres.js';

const router = Router();

router.get('/status', async (req, res) => {
  const conn = await testConnection();
  res.json(conn);
});

router.get('/:carId/data', async (req, res) => {
  const carId = parseInt(req.params.carId) || 1;
  try {
    const pool = getPool();

    const { rows: main } = await pool.query(`
      SELECT
        c.name                          AS car_name,
        s.state,
        p.battery_level,
        p.usable_battery_level,
        ROUND(p.rated_battery_range_km::numeric, 0) AS rated_range_km,
        ROUND(p.est_battery_range_km::numeric, 0)   AS est_range_km,
        ROUND(p.odometer::numeric, 0)               AS odometer_km,
        p.outside_temp,
        p.inside_temp,
        p.is_climate_on,
        p.speed,
        p.tpms_pressure_fl,
        p.tpms_pressure_fr,
        p.tpms_pressure_rl,
        p.tpms_pressure_rr,
        p.date                          AS last_seen,
        cp.end_battery_level            AS last_charge_end_pct,
        ROUND(cp.charge_energy_added::numeric, 2)   AS last_charge_kwh,
        cp.end_date                     AS last_charge_date
      FROM states s
      JOIN cars c ON c.id = s.car_id
      LEFT JOIN positions p ON p.car_id = s.car_id
      LEFT JOIN LATERAL (
        SELECT end_battery_level, charge_energy_added, end_date
        FROM charging_processes
        WHERE car_id = s.car_id AND end_date IS NOT NULL
        ORDER BY end_date DESC
        LIMIT 1
      ) cp ON true
      WHERE s.car_id = $1
        AND s.end_date IS NULL
      ORDER BY p.date DESC
      LIMIT 1
    `, [carId]);

    if (!main.length) return res.status(404).json({ error: 'No data' });

    const row = main[0];

    const { rows: monthStats } = await pool.query(`
      SELECT
        COUNT(*)                                    AS drives_count,
        ROUND(SUM(d.distance)::numeric, 1)          AS total_km,
        SUM(d.duration_min)                         AS total_min,
        (SELECT ROUND(SUM(charge_energy_added)::numeric, 1)
         FROM charging_processes
         WHERE car_id = $2
           AND start_date >= date_trunc('month', NOW())
        )                                           AS total_kwh,
        (SELECT COUNT(*)
         FROM charging_processes
         WHERE car_id = $3
           AND start_date >= date_trunc('month', NOW())
           AND end_date IS NOT NULL
        )                                           AS charge_count,
        (SELECT ROUND(AVG(
           CASE WHEN duration_min > 0
             THEN charge_energy_added / (duration_min / 60.0)
             ELSE NULL END
         )::numeric, 1)
         FROM charging_processes
         WHERE car_id = $4
           AND start_date >= date_trunc('month', NOW())
           AND end_date IS NOT NULL
        )                                           AS avg_charge_kw,
        CASE WHEN SUM(d.distance) > 0
          THEN ROUND(
            (SUM((d.start_rated_range_km - d.end_rated_range_km) * c.efficiency) / SUM(d.distance) * 100)::numeric
          , 1)
          ELSE NULL
        END                                         AS avg_kwh_per_100km,
        CASE WHEN SUM(d.duration_min) > 0
          THEN ROUND((SUM(d.distance) / (SUM(d.duration_min) / 60.0))::numeric, 0)
          ELSE NULL
        END                                         AS avg_speed_kmh
      FROM drives d
      JOIN cars c ON c.id = d.car_id
      WHERE d.car_id = $1
        AND d.start_date >= date_trunc('month', NOW())
        AND d.distance > 0.5
    `, [carId, carId, carId, carId]);

    const { rows: lastDrives } = await pool.query(`
      SELECT
        start_date,
        end_date,
        ROUND(distance::numeric, 1)          AS distance_km,
        duration_min,
        speed_max,
        ROUND(outside_temp_avg::numeric, 1)  AS outside_temp_avg,
        ROUND((start_rated_range_km - end_rated_range_km)::numeric, 1) AS range_used_km,
        ROUND(((start_rated_range_km - end_rated_range_km) * c.efficiency)::numeric, 2) AS kwh_used,
        CASE WHEN d.distance > 0
          THEN ROUND((((start_rated_range_km - end_rated_range_km) * c.efficiency) / d.distance * 100)::numeric, 1)
          ELSE NULL
        END                                  AS kwh_per_100km,
        a_start.display_name                 AS start_address,
        a_end.display_name                   AS end_address
      FROM drives d
      JOIN cars c ON c.id = d.car_id
      LEFT JOIN addresses a_start ON a_start.id = d.start_address_id
      LEFT JOIN addresses a_end   ON a_end.id   = d.end_address_id
      WHERE d.car_id = $1
        AND d.end_date IS NOT NULL
        AND d.distance > 0.5
        AND (d.start_date AT TIME ZONE 'UTC' AT TIME ZONE $2)::date
            >= (NOW() AT TIME ZONE $2)::date - INTERVAL '1 day'
      ORDER BY d.start_date DESC
    `, [carId, process.env.TIMEZONE || 'UTC']);

    res.json({
      ...row,
      month_stats: monthStats[0] || null,
      last_drives: lastDrives,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
