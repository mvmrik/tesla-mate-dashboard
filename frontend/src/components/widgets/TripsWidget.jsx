import React, { useState, useEffect, useCallback } from 'react';
import { fetchActiveTrips, fetchTripHistory, createTrip, stopTrip, deleteTrip } from '../../lib/api.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDur(totalMin) {
  if (totalMin == null || totalMin === '0' || +totalMin === 0) return '—';
  const m = parseInt(totalMin);
  const h = Math.floor(m / 60), rem = m % 60;
  return h > 0 ? `${h}h ${rem > 0 ? rem + 'm' : ''}`.trim() : `${m}m`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function StatPill({ label, value, unit }) {
  if (value == null || value === '' || +value === 0) return null;
  return (
    <span className="flex flex-col items-center">
      <span className="text-[0.55rem] uppercase tracking-wider text-dim leading-none">{label}</span>
      <span className="text-xs font-semibold text-slate-200 leading-tight">
        {value}{unit && <span className="text-dim font-normal ml-0.5">{unit}</span>}
      </span>
    </span>
  );
}

// ── Trip row (compact, used in widget) ───────────────────────────────────────

function ActiveTripCard({ trip, onStop }) {
  const s = trip.stats || {};
  return (
    <div className="flex flex-col gap-1.5 bg-muted/60 rounded-lg px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0 animate-pulse" />
          <span className="text-sm font-semibold text-slate-100 truncate">{trip.name}</span>
        </div>
        <button onClick={() => onStop(trip.id)}
                className="text-[0.65rem] px-2 py-0.5 rounded border border-danger/40 text-danger hover:bg-danger/20 transition-colors flex-shrink-0 whitespace-nowrap">
          Stop
        </button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <StatPill label="Distance" value={s.total_km} unit="km" />
        <StatPill label="Drive time" value={fmtDur(s.total_min)} />
        <StatPill label="Avg speed" value={s.avg_speed_kmh} unit="km/h" />
        <StatPill label="Max speed" value={s.speed_max} unit="km/h" />
        <StatPill label="kWh/100" value={s.avg_kwh_per_100km} />
      </div>
      <span className="text-[0.6rem] text-dim">Started {fmtDateTime(trip.start_date)}
        {trip.start_odometer != null && ` · ${trip.start_odometer} km`}</span>
    </div>
  );
}

// ── History modal ─────────────────────────────────────────────────────────────

function TripModal({ activeTrips, onClose, onStop, onDelete, onRefresh }) {
  const [history, setHistory]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetchTripHistory(1)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  const handleStop = async (id) => {
    await onStop(id);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this trip?')) return;
    await onDelete(id);
    // Remove from history list locally
    setHistory(h => h?.filter(t => t.id !== id));
    onRefresh();
  };

  const allActive = activeTrips || [];
  const allHistory = history || [];

  const cols = ['Name', 'Started', 'Ended', 'km', 'Time', 'Avg km/h', 'Max km/h', 'kWh/100', ''];

  const TripRow = ({ trip, isActive }) => {
    const s = trip.stats || {};
    return (
      <tr className={`border-b border-[#0f172a] last:border-0 ${isActive ? 'bg-success/5' : ''}`}>
        <td className="py-2 pr-3 text-slate-200 font-semibold whitespace-nowrap max-w-[140px] truncate">
          <span className="flex items-center gap-1.5">
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0 animate-pulse" />}
            {trip.name}
          </span>
        </td>
        <td className="py-2 pr-3 text-dim text-xs whitespace-nowrap">{fmtDateTime(trip.start_date)}</td>
        <td className="py-2 pr-3 text-dim text-xs whitespace-nowrap">
          {isActive ? <span className="text-success text-xs">Active</span> : fmtDateTime(trip.end_date)}
        </td>
        <td className="py-2 pr-3 text-slate-200 font-semibold">{s.total_km ?? '—'}</td>
        <td className="py-2 pr-3 text-dim whitespace-nowrap">{fmtDur(s.total_min)}</td>
        <td className="py-2 pr-3 text-dim">{s.avg_speed_kmh ?? '—'}</td>
        <td className="py-2 pr-3 text-dim">{s.speed_max ?? '—'}</td>
        <td className="py-2 pr-3 text-dim">{s.avg_kwh_per_100km ?? '—'}</td>
        <td className="py-2 text-right whitespace-nowrap">
          {isActive && (
            <button onClick={() => handleStop(trip.id)}
                    className="text-xs px-2 py-0.5 rounded border border-danger/40 text-danger hover:bg-danger/20 transition-colors mr-1">
              Stop
            </button>
          )}
          <button onClick={() => handleDelete(trip.id)}
                  className="text-xs text-dim hover:text-danger transition-colors px-1">
            ✕
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl w-full max-w-4xl max-h-[88vh] flex flex-col"
           onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-5 pb-3 border-b border-border flex-shrink-0">
          <span className="font-semibold text-slate-100">All Trips</span>
          <button onClick={onClose} className="text-dim hover:text-slate-300 text-lg leading-none">✕</button>
        </div>

        <div className="overflow-auto flex-1">
          {loading && allActive.length === 0 ? (
            <div className="p-8 text-center text-dim text-sm">Loading...</div>
          ) : (
            <table className="w-full text-sm min-w-[700px]">
              <thead className="sticky top-0 bg-surface">
                <tr>
                  {cols.map(h => (
                    <th key={h} className="text-left text-[0.6rem] uppercase tracking-wider text-dim p-2 pb-3 border-b border-border whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allActive.map(t => <TripRow key={t.id} trip={t} isActive />)}
                {loading && <tr><td colSpan={9} className="py-4 text-center text-dim text-xs">Loading history...</td></tr>}
                {!loading && allHistory.map(t => <TripRow key={t.id} trip={t} isActive={false} />)}
                {!loading && allActive.length === 0 && allHistory.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-dim text-sm">No trips yet</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

export default function TripsWidget() {
  const [trips,    setTrips]    = useState(null);
  const [newName,  setNewName]  = useState('');
  const [adding,   setAdding]   = useState(false);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(() => {
    fetchActiveTrips(1).then(setTrips).catch(() => setTrips([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createTrip(newName.trim());
      setNewName('');
      setAdding(false);
      load();
    } finally {
      setCreating(false);
    }
  };

  const handleStop = async (id) => {
    await stopTrip(id);
    load();
  };

  const handleDelete = async (id) => {
    await deleteTrip(id);
    load();
  };

  const active = trips || [];

  return (
    <div className="flex flex-col h-full p-3 gap-3">

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <span className="text-[0.6rem] uppercase tracking-widest text-accent font-semibold">Trips</span>
        <div className="flex items-center gap-2">
          {active.length > 0 && (
            <button onClick={() => setShowModal(true)}
                    className="text-[0.65rem] text-dim hover:text-slate-300 transition-colors">
              View all →
            </button>
          )}
          {adding ? (
            <div className="flex items-center gap-1.5">
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                     onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setAdding(false); setNewName(''); }}}
                     placeholder="Trip name"
                     className="bg-bg border border-border rounded-md text-slate-200 text-xs px-2 py-1 outline-none focus:border-accent w-32" />
              <button onClick={handleCreate} disabled={creating || !newName.trim()}
                      className="text-xs px-2 py-1 rounded bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 disabled:opacity-40">
                {creating ? '…' : 'Start'}
              </button>
              <button onClick={() => { setAdding(false); setNewName(''); }}
                      className="text-dim hover:text-slate-300 text-sm leading-none">✕</button>
            </div>
          ) : (
            <button onClick={() => setAdding(true)}
                    className="text-xs px-2.5 py-1 rounded border border-border text-dim hover:text-slate-300 hover:border-faint transition-colors">
              + New Trip
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
        {trips === null && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
          </div>
        )}
        {trips !== null && active.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
            <span className="text-2xl">🗺️</span>
            <p className="text-sm text-dim">No active trips</p>
            <p className="text-xs text-dim/60">Press + New Trip to start tracking</p>
            {(trips !== null) && (
              <button onClick={() => setShowModal(true)}
                      className="mt-1 text-xs text-accent hover:text-hi transition-colors">
                View history →
              </button>
            )}
          </div>
        )}
        {active.map(trip => (
          <ActiveTripCard key={trip.id} trip={trip} onStop={handleStop} />
        ))}
      </div>

      {showModal && (
        <TripModal
          activeTrips={active}
          onClose={() => setShowModal(false)}
          onStop={handleStop}
          onDelete={handleDelete}
          onRefresh={load}
        />
      )}
    </div>
  );
}
