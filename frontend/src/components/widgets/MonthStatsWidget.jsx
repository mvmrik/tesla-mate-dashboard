import React from 'react';

function Stat({ label, value, unit }) {
  return (
    <div className="bg-muted rounded-lg p-3">
      <p className="text-[0.6rem] uppercase tracking-widest text-accent mb-1">{label}</p>
      <p className="text-lg font-bold text-slate-100">
        {value ?? '—'}{unit && value != null ? <span className="text-sm text-dim ml-1">{unit}</span> : ''}
      </p>
    </div>
  );
}

export default function MonthStatsWidget({ data }) {
  if (!data) return <div className="grid grid-cols-3 gap-2 animate-pulse">{[0,1,2,3,4,5].map(i=><div key={i} className="h-16 bg-muted rounded-lg"/>)}</div>;

  const ms = data.month_stats;
  if (!ms || (parseInt(ms.drives_count) === 0 && !ms.total_km)) {
    return <p className="text-sm text-dim">No drives this month yet</p>;
  }

  const totalMin = parseInt(ms.total_min || 0);
  const timeStr  = totalMin >= 60
    ? Math.floor(totalMin / 60) + 'h ' + (totalMin % 60) + 'min'
    : totalMin + 'min';

  const now = new Date();
  const month = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-dim">{month}</p>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Drives"      value={ms.drives_count} />
        <Stat label="Distance"    value={ms.total_km}      unit="km" />
        <Stat label="Drive time"  value={timeStr} />
        <Stat label="Charged"     value={ms.total_kwh}     unit="kWh" />
        <Stat label="kWh/100km"   value={ms.avg_kwh_per_100km} />
        <Stat label="Avg speed"   value={ms.avg_speed_kmh} unit="km/h" />
      </div>
    </div>
  );
}
