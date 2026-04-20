import React from 'react';

/**
 * Standard cell — the building block for all widgets.
 * label    : small uppercase text top-left
 * value    : large bold value
 * unit     : small unit after value
 * bar      : 0-100 fill percentage (shows progress bar at bottom)
 * barColor : CSS color string for the bar
 * sub      : small text below value (shown when no bar)
 */
export default function Cell({ label, value, unit, bar, barColor, sub, className = '' }) {
  return (
    <div className={`bg-muted rounded-lg p-3 flex flex-col gap-1.5 min-h-[80px] ${className}`}>
      {label && (
        <p className="text-[0.6rem] uppercase tracking-widest text-accent font-semibold leading-none">
          {label}
        </p>
      )}
      <p className="text-2xl font-bold text-slate-100 leading-tight mt-auto">
        {value ?? '—'}
        {unit && value != null && (
          <span className="text-sm font-normal text-dim ml-1">{unit}</span>
        )}
      </p>
      {bar !== undefined ? (
        <div className="h-1.5 bg-[#0f172a] rounded-full overflow-hidden mt-auto">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: Math.max(0, Math.min(100, bar)) + '%', background: barColor || '#22c55e' }}
          />
        </div>
      ) : sub != null ? (
        <p className="text-xs text-dim mt-auto">{sub}</p>
      ) : null}
    </div>
  );
}

/** Two cells side by side */
export function CellRow({ children }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

/** 2×2 grid of cells */
export function CellGrid2x2({ children }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

/** One wide cell spanning full width */
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
  if (v < 2.5) return '#ef4444';
  if (v < 2.7) return '#f59e0b';
  if (v <= 3.1) return '#22c55e';
  if (v <= 3.3) return '#f59e0b';
  return '#ef4444';
}

export function tpmsBar(val) {
  if (val == null) return 0;
  return Math.max(0, Math.min(100, ((parseFloat(val) - 2.2) / (3.5 - 2.2)) * 100));
}

export function tempColor(val) {
  if (val == null) return '#475569';
  if (val < 0)   return '#3b82f6';
  if (val < 10)  return '#60a5fa';
  if (val < 25)  return '#22c55e';
  if (val < 35)  return '#f59e0b';
  return '#ef4444';
}

export function tempBar(val, min = -20, max = 50) {
  if (val == null) return 0;
  return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
}
