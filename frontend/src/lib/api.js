const BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchCarData(carId = 1) {
  const r = await fetch(`${BASE}/car/${carId}/data`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchHealth() {
  const r = await fetch(`${BASE}/health`);
  return r.json();
}

export async function fetchGeofences() {
  const r = await fetch(`${BASE}/widgets/1/geofences`);
  if (!r.ok) return [];
  return r.json();
}

export async function fetchTariffs(geofenceId) {
  const r = await fetch(`${BASE}/tariffs${geofenceId ? `?geofence_id=${geofenceId}` : ''}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function saveTariffs(rows) {
  const r = await fetch(`${BASE}/tariffs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function deleteTariff(id) {
  const r = await fetch(`${BASE}/tariffs?id=${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchChargeCost(from, to, geofenceId) {
  const r = await fetch(`${BASE}/charge-cost?from=${from}&to=${to}&geofence_id=${geofenceId}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchWidgetLayout(carId = 1) {
  const r = await fetch(`${BASE}/widgets/${carId}`);
  if (!r.ok) return [];
  return r.json();
}

export async function saveWidgetLayout(carId, layout) {
  const r = await fetch(`${BASE}/widgets/${carId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(layout),
  });
  return r.json();
}
