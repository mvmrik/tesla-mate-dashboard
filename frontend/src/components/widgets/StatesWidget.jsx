import React, { useState, useEffect } from 'react';
import { fetchCarStates } from '../../lib/api.js';

const STATE_CONFIG = {
  driving:   { label: 'Driving',   color: '#f59e0b' },
  charging:  { label: 'Charging',  color: '#3b82f6' },
  asleep:    { label: 'Asleep',    color: '#8b5cf6' },
  sleeping:  { label: 'Asleep',    color: '#8b5cf6' },
  online:    { label: 'Online',    color: '#22c55e' },
  offline:   { label: 'Offline',   color: '#1e293b' },
  suspended: { label: 'Suspended', color: '#334155' },
  updating:  { label: 'Updating',  color: '#84cc16' },
};

function cfg(state) {
  return STATE_CONFIG[state] || { label: state, color: '#334155' };
}

function normalise(states, winStart, winEnd) {
  const sorted = [...states].sort((a, b) =>
    new Date(a.start_date) - new Date(b.start_date));

  const result = [];
  let cursor = winStart;

  for (const s of sorted) {
    const start = Math.max(new Date(s.start_date).getTime(), winStart);
    const end   = s.end_date
      ? Math.min(new Date(s.end_date).getTime(), winEnd)
      : winEnd;

    if (start >= winEnd || end <= winStart) continue;

    if (start > cursor) {
      result.push({ state: 'offline', start: cursor, end: start });
    }
    if (end > Math.max(start, cursor)) {
      result.push({ state: s.state, start: Math.max(start, cursor), end });
    }
    cursor = Math.max(cursor, end);
  }

  if (cursor < winEnd) {
    result.push({ state: 'offline', start: cursor, end: winEnd });
  }
  return result;
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(ts) {
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}
function fmtDur(ms) {
  const min = Math.round(ms / 60000);
  if (min < 60) return min + 'min';
  const h = Math.floor(min / 60), m = min % 60;
  return h + 'h' + (m ? m + 'm' : '');
}

function TimelineBar({ states, winStart, winEnd, label, onSegmentClick }) {
  const total = winEnd - winStart;
  const segs  = normalise(states, winStart, winEnd);

  return (
    <div className="bg-muted rounded-lg p-3 flex flex-col justify-between min-h-[80px] flex-1">
      <div className="flex justify-between text-[0.55rem] text-dim mb-2">
        <span className="text-[0.6rem] uppercase tracking-widest text-accent font-semibold">{label}</span>
        <span>{winEnd >= Date.now() - 60000 ? 'now' : fmtTime(winEnd)}</span>
      </div>
      <div className="w-full h-6 rounded-md overflow-hidden flex mt-auto" style={{ background: '#0f172a' }}>
        {segs.map((seg, i) => {
          const w = Math.max(0.3, (seg.end - seg.start) / total * 100);
          return (
            <div key={i}
                 style={{ width: w + '%', background: cfg(seg.state).color, flexShrink: 0 }}
                 className="h-full cursor-pointer hover:brightness-125 transition-all"
                 onClick={() => onSegmentClick(seg)} />
          );
        })}
      </div>
      <div className="h-1.5 mt-1.5" />
    </div>
  );
}

function StateModal({ seg, onClose }) {
  const c = cfg(seg.state);
  const isNow = seg.end >= Date.now() - 60000;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl p-5 w-full max-w-xs"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: c.color }} />
          <span className="font-semibold text-slate-100">{c.label}</span>
          <button onClick={onClose}
                  className="ml-auto text-dim hover:text-slate-300 text-lg leading-none">✕</button>
        </div>
        <div className="flex flex-col gap-2.5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-dim">From</span>
            <span className="text-slate-200">{fmtDate(seg.start)} {fmtTime(seg.start)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-dim">To</span>
            <span className="text-slate-200">
              {isNow ? 'now' : fmtDate(seg.end) + ' ' + fmtTime(seg.end)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-dim">Duration</span>
            <span className="text-slate-200">{fmtDur(seg.end - seg.start)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StatesWidget({ size = 'medium' }) {
  const [states,   setStates]   = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const hours = size === 'small' ? 12 : 48;
    fetchCarStates(1, hours).then(setStates).catch(() => setStates([]));
  }, [size]);

  const now    = Date.now();
  const h12ago = now - 12 * 3600000;
  const h24ago = now - 24 * 3600000;
  const h48ago = now - 48 * 3600000;

  if (states === null) return (
    <div className={`grid gap-2 ${size === 'large' ? 'grid-cols-1' : ''}`}>
      <div className="bg-muted rounded-lg min-h-[80px] animate-pulse" />
      {size === 'large' && <div className="bg-muted rounded-lg min-h-[80px] animate-pulse" />}
    </div>
  );

  return (
    <div className="flex flex-col gap-2 h-full">
      {size === 'small' && (
        <TimelineBar states={states} winStart={h12ago} winEnd={now}
                     label="Last 12h" onSegmentClick={setSelected} />
      )}
      {size === 'medium' && (
        <TimelineBar states={states} winStart={h24ago} winEnd={now}
                     label="Last 24h" onSegmentClick={setSelected} />
      )}
      {size === 'large' && (
        <>
          <TimelineBar states={states} winStart={h24ago} winEnd={now}
                       label="Last 24h" onSegmentClick={setSelected} />
          <TimelineBar states={states} winStart={h48ago} winEnd={h24ago}
                       label="Previous 24h" onSegmentClick={setSelected} />
        </>
      )}
      {selected && <StateModal seg={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
