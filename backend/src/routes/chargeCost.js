import { Router } from 'express';
import { getPool } from '../db/postgres.js';
import { getSqlite } from '../db/sqlite.js';

const router = Router();
const TZ = () => process.env.TIMEZONE || 'UTC';

function tariffForDate(tariffMap, date) {
  const month = parseInt(date.slice(5, 7));
  const rows = tariffMap[month];
  if (!rows) return null;
  for (const row of rows) {
    if (row.valid_from <= date) return row;
  }
  return null;
}

router.get('/', async (req, res) => {
  const dateFrom   = req.query.from        || '';
  const dateTo     = req.query.to          || '';
  const geofenceId = parseInt(req.query.geofence_id || 1);

  if (!dateFrom || !dateTo) return res.status(400).json({ error: 'Missing from/to' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    return res.status(400).json({ error: 'Dates must be YYYY-MM-DD' });
  }

  try {
    const db = getSqlite();
    const tz = TZ();

    // Load tariffs for this geofence
    const tariffRows = db.prepare(`
      SELECT month, night_start, night_end, price_day, price_night, valid_from
      FROM monthly_tariffs WHERE geofence_id = ?
      ORDER BY month, valid_from DESC
    `).all(geofenceId);

    const tariffMap = {};
    for (const row of tariffRows) {
      const m = parseInt(row.month);
      if (!tariffMap[m]) tariffMap[m] = [];
      tariffMap[m].push(row);
    }

    // Fetch hourly kWh data from TeslaMate
    const pool = getPool();
    const { rows: hourRows } = await pool.query(`
      SELECT
        to_char(date_trunc('hour', (ch.date AT TIME ZONE 'UTC') AT TIME ZONE $1), 'YYYY-MM-DD HH24:MI') AS local_hour,
        cp.id                                                        AS process_id,
        to_char((cp.start_date AT TIME ZONE 'UTC') AT TIME ZONE $1, 'YYYY-MM-DD HH24:MI') AS session_start,
        to_char((cp.end_date   AT TIME ZONE 'UTC') AT TIME ZONE $1, 'YYYY-MM-DD HH24:MI') AS session_end,
        cp.start_battery_level,
        cp.end_battery_level,
        MAX(ch.charge_energy_added) - MIN(ch.charge_energy_added)   AS kwh_delta
      FROM charging_processes cp
      JOIN charges ch ON ch.charging_process_id = cp.id
      WHERE cp.car_id = 1
        AND cp.geofence_id = $2
        AND ((cp.start_date AT TIME ZONE 'UTC') AT TIME ZONE $1)::date >= $3::date
        AND ((cp.start_date AT TIME ZONE 'UTC') AT TIME ZONE $1)::date <= $4::date
      GROUP BY date_trunc('hour', (ch.date AT TIME ZONE 'UTC') AT TIME ZONE $1),
               cp.id, cp.start_date, cp.end_date, cp.start_battery_level, cp.end_battery_level
      ORDER BY local_hour
    `, [tz, geofenceId, dateFrom, dateTo]);

    // Aggregate
    let kwhDay = 0, kwhNight = 0, costDay = 0, costNight = 0;
    const sessions = {};
    const missingMonths = {};

    for (const row of hourRows) {
      const delta = parseFloat(row.kwh_delta);
      if (delta <= 0) continue;

      const localDate = row.local_hour.slice(0, 10);
      const hour      = parseInt(row.local_hour.slice(11, 13));
      const tariff    = tariffForDate(tariffMap, localDate);

      if (!tariff) {
        missingMonths[parseInt(localDate.slice(5, 7))] = true;
      }

      const ns = tariff ? parseInt(tariff.night_start) : -1;
      const ne = tariff ? parseInt(tariff.night_end)   : -1;

      let isNight = false;
      if (tariff) {
        isNight = ns > ne
          ? (hour >= ns || hour < ne)
          : (hour >= ns && hour < ne);
      }

      if (isNight) {
        kwhNight += delta;
        if (tariff) costNight += delta * parseFloat(tariff.price_night);
      } else {
        kwhDay += delta;
        if (tariff) costDay += delta * parseFloat(tariff.price_day);
      }

      const pid = row.process_id;
      if (!sessions[pid]) {
        sessions[pid] = {
          start:     row.session_start,
          end:       row.session_end,
          bat_start: row.start_battery_level,
          bat_end:   row.end_battery_level,
          kwh_day: 0, kwh_night: 0, cost_day: 0, cost_night: 0,
        };
      }
      if (isNight) {
        sessions[pid].kwh_night += delta;
        if (tariff) sessions[pid].cost_night += delta * parseFloat(tariff.price_night);
      } else {
        sessions[pid].kwh_day += delta;
        if (tariff) sessions[pid].cost_day += delta * parseFloat(tariff.price_day);
      }
    }

    // Geofence name from postgres
    const { rows: gfRows } = await pool.query(
      'SELECT name FROM geofences WHERE id = $1 LIMIT 1', [geofenceId]
    );

    const hasCost  = Object.keys(missingMonths).length === 0;
    const kwhTotal = kwhDay + kwhNight;
    const costTotal = costDay + costNight;

    const sessionList = Object.values(sessions).map(s => ({
      start:      s.start,
      end:        s.end,
      bat_start:  s.bat_start != null ? parseInt(s.bat_start) : null,
      bat_end:    s.bat_end   != null ? parseInt(s.bat_end)   : null,
      kwh_day:    Math.round(s.kwh_day   * 1000) / 1000,
      kwh_night:  Math.round(s.kwh_night * 1000) / 1000,
      kwh_total:  Math.round((s.kwh_day + s.kwh_night) * 1000) / 1000,
      cost_day:   hasCost ? Math.round(s.cost_day   * 10000) / 10000 : null,
      cost_night: hasCost ? Math.round(s.cost_night * 10000) / 10000 : null,
      cost_total: hasCost ? Math.round((s.cost_day + s.cost_night) * 10000) / 10000 : null,
    }));

    const response = {
      geofence_id:   geofenceId,
      geofence_name: gfRows[0]?.name || null,
      date_from:     dateFrom,
      date_to:       dateTo,
      sessions:      sessionList.length,
      session_list:  sessionList,
      kwh_day:       Math.round(kwhDay   * 1000) / 1000,
      kwh_night:     Math.round(kwhNight * 1000) / 1000,
      kwh_total:     Math.round(kwhTotal * 1000) / 1000,
      cost_day:      hasCost ? Math.round(costDay   * 100) / 100 : null,
      cost_night:    hasCost ? Math.round(costNight * 100) / 100 : null,
      cost_total:    hasCost ? Math.round(costTotal * 100) / 100 : null,
      currency:      'EUR',
      tariff_missing_months: Object.keys(missingMonths).map(Number),
    };

    if (!hasCost && (costDay > 0 || costNight > 0)) {
      response.cost_day_partial   = Math.round(costDay   * 100) / 100;
      response.cost_night_partial = Math.round(costNight * 100) / 100;
      response.cost_total_partial = Math.round(costTotal * 100) / 100;
    }

    res.json(response);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
