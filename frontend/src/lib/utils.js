export function timeSince(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'))) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return 'Today ' + time;
  if (diffDays === 1) return 'Yesterday ' + time;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + time;
}

export function shortAddr(addr) {
  if (!addr) return '';
  return addr.split(',').slice(0, 2).join(',').trim();
}

export function tpmsClass(val) {
  if (val == null) return '';
  const v = parseFloat(val);
  if (v < 2.5) return 'text-danger';
  if (v < 2.8) return 'text-warning';
  return '';
}

export function batteryClass(pct) {
  if (pct >= 80) return 'success';
  if (pct >= 30) return 'warning';
  return 'danger';
}

export function fmt3(v) { return v != null ? (+v).toFixed(3) : '—'; }
export function fmt4(v) { return v != null ? (+v).toFixed(4) : '—'; }
export function fmt2(v) { return v != null ? (+v).toFixed(2) : '—'; }

const MONTH_NAMES = ['','January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const MONTH_SHORT = ['','Jan','Feb','Mar','Apr','May','Jun',
                     'Jul','Aug','Sep','Oct','Nov','Dec'];
export { MONTH_NAMES, MONTH_SHORT };
