import React from 'react';
import { formatDateTime } from '../../lib/utils.js';

export default function LastChargeWidget({ data, size = 'medium' }) {
  if (!data) return <div className="h-16 bg-muted rounded animate-pulse" />;

  const pct = data.last_charge_end_pct;
  const kwh = data.last_charge_kwh;

  if (!pct && !kwh) return <p className="text-sm text-dim">No charge data</p>;

  if (size === 'small') return (
    <div className="flex items-center gap-4">
      <div>
        <p className="text-[0.6rem] text-dim">End</p>
        <p className="text-xl font-bold text-slate-100">{pct != null ? pct + '%' : '—'}</p>
      </div>
      <div>
        <p className="text-[0.6rem] text-dim">Added</p>
        <p className="text-xl font-bold text-slate-100">{kwh != null ? kwh + ' kWh' : '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted rounded-lg p-3">
          <p className="text-[0.6rem] uppercase tracking-widest text-accent mb-1">End level</p>
          <p className="text-2xl font-bold text-slate-100">{pct != null ? pct + '%' : '—'}</p>
        </div>
        <div className="bg-muted rounded-lg p-3">
          <p className="text-[0.6rem] uppercase tracking-widest text-accent mb-1">Added</p>
          <p className="text-2xl font-bold text-slate-100">{kwh != null ? kwh + ' kWh' : '—'}</p>
        </div>
      </div>
      {(size === 'medium' || size === 'large') && data.last_charge_date && (
        <p className="text-xs text-dim">{formatDateTime(data.last_charge_date)}</p>
      )}
    </div>
  );
}
