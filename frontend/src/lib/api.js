const BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchCarData(carId = 1) {
  const r = await fetch(`${BASE}/car/${carId}/data`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchCarStates(carId = 1, hours = 48) {
  const r = await fetch(`${BASE}/car/${carId}/states?hours=${hours}`);
  if (!r.ok) return [];
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

export async function fetchSettings() {
  const r = await fetch(`${BASE}/settings`);
  if (!r.ok) return {};
  return r.json();
}

export async function fetchLinks() {
  const r = await fetch(`${BASE}/links`);
  if (!r.ok) return [];
  return r.json();
}

export async function addLink(data) {
  const r = await fetch(`${BASE}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function updateLink(id, data) {
  const r = await fetch(`${BASE}/links/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function reorderLinks(order) {
  const r = await fetch(`${BASE}/links/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  return r.json();
}

export async function deleteLink(id) {
  const r = await fetch(`${BASE}/links/${id}`, { method: 'DELETE' });
  return r.json();
}

export async function fetchFavicon(url) {
  const r = await fetch(`${BASE}/links/favicon?url=${encodeURIComponent(url)}`);
  if (!r.ok) return { title: '', favicon: '' };
  return r.json();
}

export async function saveSettings(data) {
  const r = await fetch(`${BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}

// Block-based layout API
export async function fetchLayout(carId = 1) {
  const r = await fetch(`${BASE}/layout/${carId}`);
  if (!r.ok) return [];
  return r.json();
}

export async function addBlock(carId = 1) {
  const r = await fetch(`${BASE}/layout/${carId}/blocks`, { method: 'POST' });
  return r.json();
}

export async function deleteBlock(blockId) {
  const r = await fetch(`${BASE}/layout/blocks/${blockId}`, { method: 'DELETE' });
  return r.json();
}

export async function reorderBlocks(carId, ids) {
  const r = await fetch(`${BASE}/layout/${carId}/blocks/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids),
  });
  return r.json();
}

export async function addSlotWidget(blockId, slot, widget_id, config = {}) {
  const r = await fetch(`${BASE}/layout/blocks/${blockId}/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slot, widget_id, config }),
  });
  return r.json();
}

export async function deleteSlotWidget(slotId) {
  const r = await fetch(`${BASE}/layout/slots/${slotId}`, { method: 'DELETE' });
  return r.json();
}

export async function updateSlotConfig(slotId, config) {
  const r = await fetch(`${BASE}/layout/slots/${slotId}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return r.json();
}
