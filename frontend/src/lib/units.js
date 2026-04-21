// Unit conversion helpers — all functions accept the raw metric value + user's unit preference

export function fmtDist(km, unit) {
  if (km == null) return null;
  return unit === 'mi' ? Math.round(km * 0.621371 * 10) / 10 : km;
}
export function distLabel(unit) { return unit === 'mi' ? 'mi' : 'km'; }

export function fmtSpeed(kmh, unit) {
  if (kmh == null) return null;
  return unit === 'mi' ? Math.round(kmh * 0.621371) : kmh;
}
export function speedLabel(unit) { return unit === 'mi' ? 'mph' : 'km/h'; }

export function fmtTemp(c, unit) {
  if (c == null) return null;
  if (unit === 'F') return Math.round((c * 9 / 5 + 32) * 10) / 10;
  return c;
}
export function tempLabel(unit) { return unit === 'F' ? '°F' : '°C'; }

// kWh/100km → kWh/100mi (consumption per 100 miles is higher)
export function fmtConsumption(kwhPer100km, unit) {
  if (kwhPer100km == null) return null;
  return unit === 'mi' ? Math.round(kwhPer100km * 1.60934 * 10) / 10 : kwhPer100km;
}
export function consumptionLabel(unit) { return unit === 'mi' ? 'kWh/100mi' : 'kWh/100km'; }

export function fmtTime(iso, timeFormat) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
    hour12: timeFormat === '12h',
  });
}

export function fmtDateTime(iso, timeFormat) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
    hour12: timeFormat === '12h',
  });
}
