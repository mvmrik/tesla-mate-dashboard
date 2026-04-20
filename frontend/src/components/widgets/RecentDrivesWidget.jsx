import React from 'react';
import { formatDateTime, shortAddr } from '../../lib/utils.js';

export default function RecentDrivesWidget({ data }) {
  if (!data) return <div className="h-32 bg-muted rounded animate-pulse" />;

  const drives = data.last_drives || [];
  if (!drives.length) {
    return <p className="text-sm text-dim">No drives today or yesterday</p>;
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs min-w-[480px]">
        <thead>
          <tr>
            {['Date', 'Route', 'km', 'min', 'km/h max', '°C', 'kWh/100'].map(h => (
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
                <td className="py-2 pr-3 text-accent max-w-[160px] truncate" title={route}>{route}</td>
                <td className="py-2 pr-3 text-slate-200 font-semibold whitespace-nowrap">{dr.distance_km}</td>
                <td className="py-2 pr-3 text-dim whitespace-nowrap">{dr.duration_min}</td>
                <td className="py-2 pr-3 text-dim whitespace-nowrap">{dr.speed_max ?? '—'}</td>
                <td className="py-2 pr-3 text-dim whitespace-nowrap">{dr.outside_temp_avg ?? '—'}</td>
                <td className="py-2 pr-3 text-slate-200 font-semibold whitespace-nowrap">{dr.kwh_per_100km ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
