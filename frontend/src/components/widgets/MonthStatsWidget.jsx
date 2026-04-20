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

export default function MonthStatsWidget({ data, size = 'medium' }) {
  if (!data) return <div className="h-24 bg-muted rounded animate-pulse" />;

  const ms = data.month_stats;
  if (!ms || (parseInt(ms.drives_count) === 0 && !ms.total_km)) {
    return <p className="text-sm text-dim">No drives this month yet</p>;
  }

  const totalMin = parseInt(ms.total_min || 0);
  const timeStr  = totalMin >= 60
    ? Math.floor(totalMin / 60) + 'h ' + (totalMin % 60) + 'min'
    : totalMin + 'min';

  const month = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  if (size === 'small') return (
    <div className="flex items-center gap-4 flex-wrap">
      <div><p className="text-[0.6rem] text-dim">Drives</p><p className="text-xl font-bold text-slate-100">{ms.drives_count}</p></div>
      <div><p className="text-[0.6rem] text-dim">km</p><p className="text-xl font-bold text-slate-100">{ms.total_km}</p></div>
      <div><p className="text-[0.6rem] text-dim">kWh/100</p><p className="text-xl font-bold text-slate-100">{ms.avg_kwh_per_100km ?? '—'}</p></div>
    </div>
  );

  const mediumStats = [
    { label: 'Drives',    value: ms.drives_count },
    { label: 'Distance',  value: ms.total_km,     unit: 'km' },
    { label: 'kWh/100km', value: ms.avg_kwh_per_100km },
    { label: 'Charged',   value: ms.total_kwh,    unit: 'kWh' },
  ];

  const largeStats = [
    ...mediumStats,
    { label: 'Drive time', value: timeStr },
    { label: 'Avg speed',  value: ms.avg_speed_kmh, unit: 'km/h' },
  ];

  const stats = size === 'large' ? largeStats : mediumStats;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-dim">{month}</p>
      <div className="grid grid-cols-3 gap-2">
        {stats.map(s => <Stat key={s.label} {...s} />)}
      </div>
    </div>
  );
}
