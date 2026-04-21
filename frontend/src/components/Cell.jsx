import React from 'react';

export default function Cell({ label, value, unit, bar, barColor, sub, className = '', smallValue = false }) {
  return (
    <div className={`bg-muted rounded-lg p-3 flex flex-col h-full min-h-[80px] ${className}`}>
      {label && (
        <p className="text-[0.6rem] uppercase tracking-widest text-accent font-semibold leading-none">
          {label}
        </p>
      )}
      <p className={`${smallValue ? 'text-lg' : 'text-2xl'} font-bold text-slate-100 leading-tight mt-auto`}>
        {value ?? '—'}
        {unit && value != null && (
          <span className="text-sm font-normal text-dim ml-1">{unit}</span>
        )}
      </p>
      {sub != null && bar === undefined && (
        <p className="text-xs text-dim mt-1">{sub}</p>
      )}
      {/* Always reserve bar height so all cells are equal */}
      <div className="h-1.5 mt-1.5">
        {bar !== undefined && (
          <div className="h-full bg-[#0f172a] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width: Math.max(0, Math.min(100, bar)) + '%', background: barColor || '#22c55e' }} />
          </div>
        )}
      </div>
    </div>
  );
}

export function CellRow({ children }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

export function CellGrid2x2({ children }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

export function CellWide({ label, value, unit, bar, barColor, sub }) {
  return (
    <Cell label={label} value={value} unit={unit}
          bar={bar} barColor={barColor} sub={sub}
          className="col-span-2" />
  );
}

/* ── Color helpers ──────────────────────────────────────────────────────── */

export function batteryColor(pct) {
  if (pct >= 80) return '#22c55e';
  if (pct >= 30) return '#f59e0b';
  return '#ef4444';
}

export function tpmsColor(val) {
  if (val == null) return '#475569';
  const v = parseFloat(val);
  if (v < 2.5)  return '#ef4444';
  if (v < 2.7)  return '#f59e0b';
  if (v <= 3.1) return '#22c55e';
  if (v <= 3.3) return '#f59e0b';
  return '#ef4444';
}

export function tpmsBar(val) {
  if (val == null) return undefined;
  return Math.max(0, Math.min(100, ((parseFloat(val) - 2.2) / (3.5 - 2.2)) * 100));
}

export function tempColor(val) {
  if (val == null) return '#475569';
  const v = parseFloat(val);
  if (v <= -5)  return '#1d4ed8';
  if (v <= 2)   return '#3b82f6';
  if (v <= 10)  return '#60a5fa';
  if (v <= 18)  return '#22c55e';
  if (v <= 24)  return '#84cc16';
  if (v <= 30)  return '#f59e0b';
  if (v <= 36)  return '#f97316';
  return '#ef4444';
}

export function tempBar(val, min = -20, max = 50) {
  if (val == null) return undefined;
  return Math.max(0, Math.min(100, ((parseFloat(val) - min) / (max - min)) * 100));
}
