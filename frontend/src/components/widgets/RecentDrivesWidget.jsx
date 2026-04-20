import React from 'react';
import { formatDateTime, shortAddr } from '../../lib/utils.js';

export default function RecentDrivesWidget({ data, size = 'medium' }) {
  if (!data) return <div className="h-32 bg-muted rounded animate-pulse" />;

  const drives = data.last_drives || [];
  if (!drives.length) return <p className="text-sm text-dim">No drives today or yesterday</p>;

  if (size === 'small') return (
    <div className="flex flex-col gap-2">
      {drives.slice(0, 2).map((dr, i) => (
        <div key={i} className="flex items-center justify-between gap-2 text-sm">
          <span className="text-accent text-xs">{formatDateTime(dr.start_date)}</span>
          <span className="text-slate-200 font-semibold">{dr.distance_km} km</span>
        </div>
      ))}
    </div>
  );

  // Medium: date, route, km, min, kWh/100
  // Large: all columns
  const largeCols = size === 'large';

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs min-w-[400px]">
        <thead>
          <tr>
            {['Date', 'Route', 'km', 'min', ...(largeCols ? ['km/h max', '°C'] : []), 'kWh/100'].map(h => (
              <th key={h} className="text-left text-[0.6rem] uppercase tracking-wider text-dim pb-2 pr-3 border-b border-muted whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {drives.map((dr, i) => {
            const from  = shortAddr(dr.start_address);
            const to    = shortAddr(dr.end_address);
            const route = from && to ? `${from} → ${to}` : to ? `→ ${to}` : from ? `${from} →` : '—';
            return (
              <tr key={i} className="border-b border-[#0f172a] last:border-0">
                <td className="py-2 pr-3 text-accent whitespace-nowrap">{formatDateTime(dr.start_date)}</td>
                <td className="py-2 pr-3 text-accent max-w-[140px] truncate" title={route}>{route}</td>
                <td className="py-2 pr-3 text-slate-200 font-semibold">{dr.distance_km}</td>
                <td className="py-2 pr-3 text-dim">{dr.duration_min}</td>
                {largeCols && <>
                  <td className="py-2 pr-3 text-dim">{dr.speed_max ?? '—'}</td>
                  <td className="py-2 pr-3 text-dim">{dr.outside_temp_avg ?? '—'}</td>
                </>}
                <td className="py-2 pr-3 text-slate-200 font-semibold">{dr.kwh_per_100km ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
