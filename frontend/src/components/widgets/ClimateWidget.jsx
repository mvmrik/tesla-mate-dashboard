import React from 'react';

function TempBar({ value, min = -20, max = 50 }) {
  if (value == null) return null;
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const color = value < 5 ? '#60a5fa' : value > 30 ? '#ef4444' : '#22c55e';
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
      <div className="h-full rounded-full transition-all" style={{ width: pct + '%', background: color }} />
    </div>
  );
}

export default function ClimateWidget({ data }) {
  if (!data) return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-16 bg-muted rounded" />
      <div className="h-16 bg-muted rounded" />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted rounded-lg p-3">
          <p className="text-[0.6rem] uppercase tracking-widest text-accent mb-1">Outside</p>
          <p className="text-2xl font-bold text-slate-100">
            {data.outside_temp != null ? data.outside_temp + '°' : '—'}
          </p>
          <TempBar value={data.outside_temp} />
        </div>
        <div className="bg-muted rounded-lg p-3">
          <p className="text-[0.6rem] uppercase tracking-widest text-accent mb-1">
            Inside {data.is_climate_on && <span className="text-hi">❄</span>}
          </p>
          <p className="text-2xl font-bold text-slate-100">
            {data.inside_temp != null ? data.inside_temp + '°' : '—'}
          </p>
          <TempBar value={data.inside_temp} />
        </div>
      </div>

      {data.is_climate_on && (
        <div className="flex items-center gap-2 text-hi text-sm">
          <span>❄</span>
          <span>Climate control is active</span>
        </div>
      )}
    </div>
  );
}
