import React from 'react';
import { batteryClass } from '../../lib/utils.js';

const COLOR = { success: '#22c55e', warning: '#f59e0b', danger: '#ef4444' };
const TEXT  = { success: 'text-success', warning: 'text-warning', danger: 'text-danger' };

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[0.6rem] uppercase tracking-widest text-accent">{label}</p>
      <p className="text-sm font-semibold text-slate-300">{value}</p>
    </div>
  );
}

export default function BatteryWidget({ data, size = 'medium' }) {
  if (!data) return <div className="h-16 bg-muted rounded animate-pulse" />;

  const pct  = data.battery_level ?? 0;
  const cls  = batteryClass(pct);
  const fill = COLOR[cls];

  if (size === 'small') return (
    <div className="flex items-center gap-3">
      <span className="text-3xl font-bold text-slate-100">{pct}%</span>
      <div className="flex-1">
        <div className="h-2 bg-muted rounded-full overflow-hidden border border-border">
          <div className="h-full rounded-full transition-all" style={{ width: pct + '%', background: fill }} />
        </div>
        <p className={`text-xs mt-1 ${TEXT[cls]}`}>{data.rated_range_km ? data.rated_range_km + ' km' : '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-4xl font-bold text-slate-100">{pct}<span className="text-xl ml-1">%</span></span>
        <span className={`text-sm font-medium ${TEXT[cls]}`}>{data.rated_range_km ? data.rated_range_km + ' km' : '—'}</span>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden border border-border">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: pct + '%', background: fill }} />
      </div>

      {size === 'large' && data.usable_battery_level != null && data.usable_battery_level !== pct && (
        <p className="text-xs text-dim">Usable: <span className="text-faint">{data.usable_battery_level}%</span></p>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Stat label="Est. range" value={data.est_range_km ? data.est_range_km + ' km' : '—'} />
        <Stat label="Odometer"   value={data.odometer_km  ? data.odometer_km  + ' km' : '—'} />
        {size === 'large' && <>
          <Stat label="State"  value={data.state ?? '—'} />
          <Stat label="Usable" value={data.usable_battery_level != null ? data.usable_battery_level + '%' : '—'} />
        </>}
      </div>
    </div>
  );
}
