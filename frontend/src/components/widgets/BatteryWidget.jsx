import React from 'react';
import { batteryClass } from '../../lib/utils.js';

const COLOR = { success: '#22c55e', warning: '#f59e0b', danger: '#ef4444' };
const TEXT  = { success: 'text-success', warning: 'text-warning', danger: 'text-danger' };

export default function BatteryWidget({ data }) {
  if (!data) return <WidgetSkeleton />;
  const pct  = data.battery_level ?? 0;
  const cls  = batteryClass(pct);
  const fill = COLOR[cls];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-4xl font-bold text-slate-100">{pct}<span className="text-xl ml-1">%</span></span>
        <span className={`text-sm font-medium ${TEXT[cls]}`}>
          {data.rated_range_km ? data.rated_range_km + ' km' : '—'}
        </span>
      </div>

      {/* Battery bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden border border-border">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: pct + '%', background: fill }}
        />
      </div>

      {/* Usable vs rated */}
      {data.usable_battery_level != null && data.usable_battery_level !== pct && (
        <p className="text-xs text-dim">
          Usable: <span className="text-faint">{data.usable_battery_level}%</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Stat label="Est. range" value={data.est_range_km ? data.est_range_km + ' km' : '—'} />
        <Stat label="Odometer"   value={data.odometer_km  ? data.odometer_km + ' km'  : '—'} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[0.6rem] uppercase tracking-widest text-accent">{label}</p>
      <p className="text-sm font-semibold text-slate-300">{value}</p>
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="h-10 w-24 bg-muted rounded" />
      <div className="h-2 bg-muted rounded-full" />
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="h-8 bg-muted rounded" />
        <div className="h-8 bg-muted rounded" />
      </div>
    </div>
  );
}
