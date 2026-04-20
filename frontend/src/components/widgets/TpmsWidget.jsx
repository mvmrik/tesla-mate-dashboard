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

export default function TpmsWidget({ data }) {
  if (!data) return (
    <div className="grid grid-cols-2 gap-2 animate-pulse">
      {[0,1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-lg" />)}
    </div>
  );

  const allOk = [data.tpms_pressure_fl, data.tpms_pressure_fr,
                 data.tpms_pressure_rl, data.tpms_pressure_rr]
    .every(v => v == null || (parseFloat(v) >= 2.8));

  return (
    <div className="flex flex-col gap-3">
      {/* Car diagram layout: FL FR / RL RR */}
      <div className="grid grid-cols-2 gap-2">
        <TpmsCell label="FL" value={data.tpms_pressure_fl} />
        <TpmsCell label="FR" value={data.tpms_pressure_fr} />
        <TpmsCell label="RL" value={data.tpms_pressure_rl} />
        <TpmsCell label="RR" value={data.tpms_pressure_rr} />
      </div>
      {allOk && (
        <p className="text-xs text-success text-center">All pressures normal</p>
      )}
    </div>
  );
}
