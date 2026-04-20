import React from 'react';
import { timeSince } from '../lib/utils.js';

const STATE_LABELS = {
  online: 'Online', offline: 'Offline', asleep: 'Asleep',
  charging: 'Charging', driving: 'Driving',
};

export default function StatusBar({ data, loading, onRefresh, dbOk }) {
  const state = data?.state ?? 'offline';
  const label = STATE_LABELS[state] || state;

  return (
    <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 dot-${state}`} />
        <div>
          <h1 className="text-lg font-bold text-slate-100 leading-none">
            {data?.car_name || 'Tesla'} <span className="text-sm font-normal text-dim">— {label}</span>
          </h1>
          {data?.last_seen && (
            <p className="text-[0.65rem] text-dim mt-0.5">Last seen {timeSince(data.last_seen)}</p>
          )}
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
