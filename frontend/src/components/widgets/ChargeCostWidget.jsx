import React, { useState, useEffect, useCallback } from 'react';
import { fetchChargeCost, fetchGeofences, fetchTariffs, saveTariffs, deleteTariff } from '../../lib/api.js';
import { fmt3, fmt4, MONTH_SHORT, MONTH_NAMES } from '../../lib/utils.js';

const today = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};
const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

// ── Sessions modal ─────────────────────────────────────────────────────────────
function SessionsModal({ data, onClose }) {
  if (!data) return null;
  const hasCost = data.cost_total != null || data.cost_total_partial != null;
  const fmt = v => v != null ? (+v).toFixed(3) : '—';
  const fmtC = v => v != null ? (+v).toFixed(4) : '—';
  const list = [...(data.session_list || [])].reverse();
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h3 className="font-semibold text-slate-100">Charging sessions ({data.sessions})</h3>
          <button onClick={onClose} className="text-dim hover:text-slate-300 text-lg">✕</button>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-xs min-w-[600px]">
            <thead className="sticky top-0 bg-surface">
              <tr>
                {['#','Start','End','kWh day','kWh night','kWh total','Battery',
                  ...(hasCost ? ['Cost day','Cost night','Cost total'] : [])].map(h => (
                  <th key={h} className="text-left text-[0.6rem] uppercase tracking-wider text-dim p-2 border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((s, i) => (
                <tr key={i} className="border-b border-[#1e1e2a] last:border-0">
                  <td className="p-2 text-slate-300 font-semibold">{list.length - i}</td>
                  <td className="p-2 text-slate-200 whitespace-nowrap">{s.start ? s.start.slice(0,16).replace('T',' ') : '—'}</td>
                  <td className="p-2 text-slate-200 whitespace-nowrap">{s.end   ? s.end.slice(0,16).replace('T',' ')   : '—'}</td>
                  <td className="p-2 text-dim">{fmt(s.kwh_day)}</td>
                  <td className="p-2 text-night">{fmt(s.kwh_night)}</td>
                  <td className="p-2 text-hi font-semibold">{fmt(s.kwh_total)}</td>
                  <td className="p-2 text-dim whitespace-nowrap">{s.bat_start != null ? `${s.bat_start}% → ${s.bat_end}%` : '—'}</td>
                  {hasCost && <>
                    <td className="p-2 text-dim">{fmtC(s.cost_day)}</td>
                    <td className="p-2 text-night">{fmtC(s.cost_night)}</td>
                    <td className="p-2 text-hi font-semibold">{fmtC(s.cost_total)}</td>
                  </>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tariff manager modal ───────────────────────────────────────────────────────
function TariffModal({ geofences, onClose }) {
  const [gfId, setGfId]         = useState(geofences[0]?.id || 1);
  const [gfName, setGfName]     = useState(geofences[0]?.name || '');
  const [tariffs, setTariffs]   = useState([]);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState(null);
  const [selectedMonths, setSM] = useState([]);
  const [form, setForm]         = useState({
    validFrom: today(), priceDay: '', priceNight: '', nightStart: '22', nightEnd: '6'
  });

  const load = useCallback(async () => {
    try { setTariffs(await fetchTariffs(gfId)); } catch {}
  }, [gfId]);

  useEffect(() => { load(); }, [load]);

  const handleGfChange = (id) => {
    setGfId(parseInt(id));
    setGfName(geofences.find(g => g.id === parseInt(id))?.name || '');
  };

  const toggleMonth = (m) => setSM(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const handleSave = async () => {
    if (!form.validFrom || !form.priceDay || !form.priceNight || !selectedMonths.length) {
      setMsg({ type: 'warn', text: 'Fill all fields and select at least one month.' });
      return;
    }
    setSaving(true); setMsg(null);
    try {
      const rows = selectedMonths.map(m => ({
        geofence_id:   gfId,
        geofence_name: gfName,
        month:         m,
        night_start:   parseInt(form.nightStart),
        night_end:     parseInt(form.nightEnd),
        price_day:     parseFloat(form.priceDay),
        price_night:   parseFloat(form.priceNight),
        valid_from:    form.validFrom,
      }));
      const d = await saveTariffs(rows);
      setMsg({ type: 'ok', text: `Saved ${d.inserted} month(s).` });
      setSM([]);
      setForm(f => ({ ...f, priceDay: '', priceNight: '' }));
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this price entry?')) return;
    try { await deleteTariff(id); await load(); } catch (e) { alert(e.message); }
  };

  // Build map month -> latest active row
  const todayStr = today();
  const byMonth = {};
  for (const r of tariffs) {
    const m = parseInt(r.month);
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(r);
  }
  const activeByMonth = {};
  for (let m = 1; m <= 12; m++) {
    const rows = byMonth[m] || [];
    activeByMonth[m] = rows.find(r => r.valid_from <= todayStr) || null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-4 p-5"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-100">Electricity prices</h3>
          <button onClick={onClose} className="text-dim hover:text-slate-300 text-lg">✕</button>
        </div>

        {/* Location selector */}
        {geofences.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-accent">
            Location:
            <select value={gfId} onChange={e => handleGfChange(e.target.value)}
                    className="bg-bg border border-border rounded-md text-slate-200 text-sm px-2 py-1 outline-none focus:border-accent">
              {geofences.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}

        {/* 12-month grid */}
        <div>
          <p className="text-[0.6rem] uppercase tracking-widest text-dim mb-2">Current prices per month</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
              const active = activeByMonth[m];
              return (
                <div key={m} className={`rounded-lg p-2 border ${active ? 'border-[#1e3a5f] bg-[#0f172a]' : 'border-border bg-bg'}`}>
                  <p className="text-[0.6rem] uppercase tracking-widest text-accent font-semibold">{MONTH_SHORT[m]}</p>
                  {active ? <>
                    <p className="text-[0.65rem] text-slate-300 mt-1">
                      <span>{(+active.price_day).toFixed(4)}</span>
                      {' '}<span className="text-night">{(+active.price_night).toFixed(4)}</span>
                    </p>
                    <p className="text-[0.55rem] text-dim">{active.night_start}:00–{active.night_end}:00</p>
                  </> : (
                    <p className="text-[0.65rem] text-dim italic mt-1">not set</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* History */}
        {tariffs.length > 0 && (
          <div>
            <p className="text-[0.6rem] uppercase tracking-widest text-dim mb-2">Price history</p>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {[...tariffs].sort((a,b) => a.month - b.month || b.valid_from.localeCompare(a.valid_from)).map(r => (
                <div key={r.id} className="flex items-center gap-2 text-xs border-b border-[#0f0f13] py-1">
                  <span className="bg-muted text-accent rounded px-1.5 py-0.5 text-[0.6rem] font-semibold whitespace-nowrap">{MONTH_SHORT[parseInt(r.month)]}</span>
                  <span className="text-slate-300 flex-1">
                    day <strong>{(+r.price_day).toFixed(6)}</strong>
                    {' '}night <strong className="text-night">{(+r.price_night).toFixed(6)}</strong>
                    {' '}<span className="text-dim">{r.night_start}:00–{r.night_end}:00</span>
                  </span>
                  <span className="text-dim text-[0.6rem]">from {r.valid_from}</span>
                  <button onClick={() => handleDelete(r.id)}
                          className="text-dim hover:text-danger text-xs px-1">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add form */}
        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <p className="text-[0.6rem] uppercase tracking-widest text-dim">Add / update prices (valid from date)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Valid from', key: 'validFrom', type: 'date' },
              { label: 'Day (EUR/kWh)', key: 'priceDay', type: 'number', step: '0.000001', placeholder: '0.000000' },
              { label: 'Night (EUR/kWh)', key: 'priceNight', type: 'number', step: '0.000001', placeholder: '0.000000' },
              { label: 'Night start (h)', key: 'nightStart', type: 'number', min: 0, max: 23, placeholder: '22' },
              { label: 'Night end (h)', key: 'nightEnd', type: 'number', min: 0, max: 23, placeholder: '6' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[0.6rem] uppercase tracking-widest text-accent block mb-1">{f.label}</label>
                <input {...f} value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full bg-bg border border-border rounded-md text-slate-200 text-sm px-2 py-1.5 outline-none focus:border-accent" />
              </div>
            ))}
          </div>

          <div>
            <p className="text-[0.6rem] uppercase tracking-widest text-accent mb-2">Apply to months:</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <label key={m} className="flex items-center gap-1 text-xs text-dim cursor-pointer">
                  <input type="checkbox" checked={selectedMonths.includes(m)} onChange={() => toggleMonth(m)}
                         className="accent-blue-500" />
                  {MONTH_SHORT[m]}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 items-center justify-between">
            <button onClick={() => setSM(selectedMonths.length === 12 ? [] : Array.from({length:12},(_,i)=>i+1))}
                    className="text-xs text-accent hover:text-hi">
              {selectedMonths.length === 12 ? 'Deselect all' : 'Select all'}
            </button>
            <button onClick={handleSave} disabled={saving}
                    className="bg-muted border border-faint text-slate-300 hover:bg-[#263245] text-sm px-4 py-1.5 rounded-md disabled:opacity-50">
              {saving ? '...' : 'Save selected months'}
            </button>
          </div>

          {msg && (
            <p className={`text-xs ${msg.type === 'ok' ? 'text-success' : msg.type === 'warn' ? 'text-warning' : 'text-danger'}`}>
              {msg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main widget ─────────────────────────────────────────────────────────────────
export default function ChargeCostWidget() {
  const [dateFrom, setFrom]   = useState(firstOfMonth());
  const [dateTo, setTo]       = useState(today());
  const [geofences, setGf]    = useState([]);
  const [geofenceId, setGfId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [showSessions, setShowSessions] = useState(false);
  const [showTariffs, setShowTariffs]   = useState(false);

  useEffect(() => {
    fetchGeofences().then(gfs => {
      setGf(gfs);
      if (gfs.length) setGfId(String(gfs[0].id));
    });
  }, []);

  const calculate = async () => {
    if (!geofenceId) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const d = await fetchChargeCost(dateFrom, dateTo, geofenceId);
      if (d.error) throw new Error(d.error);
      setResult(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const hasCost = result && (result.cost_total != null || result.cost_total_partial != null);
  const costDay   = result?.cost_day   ?? result?.cost_day_partial   ?? null;
  const costNight = result?.cost_night ?? result?.cost_night_partial ?? null;
  const costTotal = result?.cost_total ?? result?.cost_total_partial ?? null;
  const partial   = result && result.cost_day == null && costDay != null;

  return (
    <div className="flex flex-col gap-4">
      {/* Form */}
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-[0.6rem] uppercase tracking-widest text-accent block mb-1">From</label>
          <input type="date" value={dateFrom} onChange={e => setFrom(e.target.value)}
                 className="bg-bg border border-border rounded-md text-slate-200 text-sm px-2 py-1.5 outline-none focus:border-accent" />
        </div>
        <div>
          <label className="text-[0.6rem] uppercase tracking-widest text-accent block mb-1">To</label>
          <input type="date" value={dateTo} onChange={e => setTo(e.target.value)}
                 className="bg-bg border border-border rounded-md text-slate-200 text-sm px-2 py-1.5 outline-none focus:border-accent" />
        </div>
        {geofences.length > 0 && (
          <div>
            <label className="text-[0.6rem] uppercase tracking-widest text-accent block mb-1">Location</label>
            <select value={geofenceId} onChange={e => setGfId(e.target.value)}
                    className="bg-bg border border-border rounded-md text-slate-200 text-sm px-2 py-1.5 outline-none focus:border-accent">
              {geofences.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}
        <button onClick={calculate} disabled={loading || !geofenceId}
                className="bg-muted border border-faint text-slate-300 hover:bg-[#263245] text-sm px-4 py-1.5 rounded-md disabled:opacity-50 whitespace-nowrap">
          {loading ? '...' : 'Calculate'}
        </button>
        <button onClick={() => setShowTariffs(true)}
                className="text-sm text-accent hover:text-hi px-2 py-1.5 whitespace-nowrap">
          ⚙ Prices
        </button>
      </div>

      {/* Error */}
      {error && <p className="text-sm text-danger">{error}</p>}

      {/* No sessions */}
      {result && result.sessions === 0 && (
        <p className="text-sm text-dim">No charging sessions found for this period and location.</p>
      )}

      {/* Missing tariffs warning */}
      {result?.tariff_missing_months?.length > 0 && (
        <p className="text-xs text-warning">
          Missing tariff for: {result.tariff_missing_months.map(m => MONTH_SHORT[m]).join(', ')}.
          Click ⚙ Prices to add.
        </p>
      )}

      {/* Results table */}
      {result && result.sessions > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-[0.6rem] uppercase tracking-wider text-dim pb-2 pr-4">Type</th>
                <th className="text-left text-[0.6rem] uppercase tracking-wider text-dim pb-2 pr-4">kWh</th>
                {hasCost && <th className="text-left text-[0.6rem] uppercase tracking-wider text-dim pb-2">Cost (EUR)</th>}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#0f0f13]">
                <td className="py-1.5 pr-4 text-dim">Day</td>
                <td className="py-1.5 pr-4 text-slate-200 font-semibold">{fmt3(result.kwh_day)}</td>
                {hasCost && <td className="py-1.5 text-dim">{fmt4(costDay)}</td>}
              </tr>
              <tr className="border-b border-[#0f0f13]">
                <td className="py-1.5 pr-4 text-night">Night</td>
                <td className="py-1.5 pr-4 text-slate-200 font-semibold">{fmt3(result.kwh_night)}</td>
                {hasCost && <td className="py-1.5 text-night">{fmt4(costNight)}</td>}
              </tr>
              <tr>
                <td className="py-1.5 pr-4 text-slate-200 font-semibold">
                  Total{partial ? ' *' : ''}{' '}
                  <button onClick={() => setShowSessions(true)}
                          className="text-accent underline text-xs font-normal hover:text-hi">
                    {result.sessions} session{result.sessions !== 1 ? 's' : ''}
                  </button>
                </td>
                <td className="py-1.5 pr-4 text-slate-200 font-semibold">
                  {fmt3((+(result.kwh_day||0)) + (+(result.kwh_night||0)))}
                </td>
                {hasCost && <td className="py-1.5 text-hi font-bold text-base">{costTotal != null ? (+costTotal).toFixed(4) : '—'}{partial?' *':''}</td>}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {showSessions && <SessionsModal data={result} onClose={() => setShowSessions(false)} />}
      {showTariffs  && <TariffModal geofences={geofences} onClose={() => { setShowTariffs(false); }} />}
    </div>
  );
}
