import React from 'react';
import { timeSince } from '../lib/utils.js';

const STATE_CONFIG = {
  online:    { label: 'Online',     color: '#22c55e', pulse: 'pulse-green' },
  offline:   { label: 'Offline',    color: '#475569', pulse: null },
  asleep:    { label: 'Asleep',     color: '#8b5cf6', pulse: null },
  sleeping:  { label: 'Asleep',     color: '#8b5cf6', pulse: null },
  driving:   { label: 'Driving',    color: '#f59e0b', pulse: 'pulse-amber' },
  charging:  { label: 'Charging',   color: '#3b82f6', pulse: 'pulse-blue'  },
  suspended: { label: 'Suspended',  color: '#475569', pulse: null },
  updating:  { label: 'Updating',   color: '#f59e0b', pulse: 'pulse-amber' },
};

export default function StatusBar({ data, loading, onRefresh, dbOk }) {
  const state = data?.state ?? 'offline';
  const cfg   = STATE_CONFIG[state] || { label: state, color: '#475569', pulse: null };

  // Build charging details line
  let chargingInfo = null;
  if (state === 'charging' && data) {
    const parts = [];
    if (data.outside_temp != null) parts.push(data.outside_temp + '°');
    if (data.charger_power  != null) parts.push(data.charger_power + ' kW');
    if (data.charger_actual_current != null) parts.push(data.charger_actual_current + ' A');
    if (parts.length) chargingInfo = parts.join(' · ');
  }

  return (
    <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
             style={{ background: cfg.color,
                      animation: cfg.pulse ? `${cfg.pulse} 2s infinite` : 'none' }} />
        <div>
          <h1 className="text-lg font-bold text-slate-100 leading-none">
            {data?.car_name || 'Tesla'}{' '}
            <span className="text-sm font-normal text-dim">— {cfg.label}</span>
          </h1>
          {chargingInfo ? (
            <p className="text-[0.65rem] text-dim mt-0.5">{chargingInfo}</p>
          ) : data?.last_seen ? (
            <p className="text-[0.65rem] text-dim mt-0.5">Last seen {timeSince(data.last_seen)}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!dbOk && (
          <span className="text-xs text-danger bg-danger/10 border border-danger/30 px-2 py-0.5 rounded-full">
            DB disconnected
          </span>
        )}
        <button onClick={onRefresh} disabled={loading}
                className="text-dim hover:text-slate-300 disabled:opacity-40 p-1 rounded">
          <span className={loading ? 'spin inline-block' : ''}>⟳</span>
        </button>
      </div>
    </div>
  );
}
