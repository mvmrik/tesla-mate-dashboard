import React from 'react';
import { tpmsClass } from '../../lib/utils.js';

function TpmsCell({ label, value }) {
  const cls = tpmsClass(value);
  return (
    <div className="flex flex-col items-center gap-1 bg-muted rounded-lg p-2">
      <span className="text-[0.55rem] uppercase tracking-widest text-dim">{label}</span>
      <span className={`text-lg font-bold ${cls || 'text-slate-200'}`}>
        {value != null ? parseFloat(value).toFixed(1) : '—'}
      </span>
      <span className="text-[0.6rem] text-dim">bar</span>
    </div>
  );
}

export default function TpmsWidget({ data, size = 'medium' }) {
  if (!data) return <div className="h-16 bg-muted rounded animate-pulse" />;

  const vals = [
    { label: 'FL', val: data.tpms_pressure_fl },
    { label: 'FR', val: data.tpms_pressure_fr },
    { label: 'RL', val: data.tpms_pressure_rl },
    { label: 'RR', val: data.tpms_pressure_rr },
  ];

  const allOk = vals.every(v => v.val == null || parseFloat(v.val) >= 2.8);

  if (size === 'small') return (
    <div className="flex items-center justify-between gap-2">
      {vals.map(({ label, val }) => {
        const cls = tpmsClass(val);
        return (
          <div key={label} className="flex flex-col items-center">
            <span className="text-[0.55rem] text-dim">{label}</span>
            <span className={`text-sm font-bold ${cls || 'text-slate-200'}`}>
              {val != null ? parseFloat(val).toFixed(1) : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {vals.map(({ label, val }) => <TpmsCell key={label} label={label} value={val} />)}
      </div>
      {size === 'large' && (
        <p className={`text-xs text-center ${allOk ? 'text-success' : 'text-warning'}`}>
          {allOk ? 'All pressures normal' : 'Check tyre pressure'}
        </p>
      )}
      {size === 'medium' && allOk && (
        <p className="text-xs text-success text-center">All pressures normal</p>
      )}
    </div>
  );
}
