import React, { useState, useEffect, useRef } from 'react';
import { fetchSettings, saveSettings, fetchWidgetLayout, saveWidgetLayout } from '../lib/api.js';

const TIMEZONES = [
  'UTC',
  'Europe/London','Europe/Paris','Europe/Berlin','Europe/Sofia','Europe/Athens',
  'Europe/Bucharest','Europe/Kiev','Europe/Moscow','Europe/Amsterdam','Europe/Rome',
  'Europe/Madrid','Europe/Warsaw','Europe/Prague','Europe/Vienna','Europe/Zurich',
  'America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
  'America/Toronto','America/Vancouver','America/Sao_Paulo','America/Mexico_City',
  'Asia/Dubai','Asia/Istanbul','Asia/Jerusalem','Asia/Kolkata','Asia/Tokyo',
  'Asia/Shanghai','Asia/Singapore','Asia/Seoul','Asia/Bangkok',
  'Australia/Sydney','Australia/Melbourne','Pacific/Auckland',
  'Africa/Cairo','Africa/Johannesburg','Africa/Lagos',
];

const WIDGET_META = {
  battery:             { label: 'Battery & Range',     wide: false },
  tpms:                { label: 'Tyre Pressures',      wide: false },
  climate:             { label: 'Temperature',          wide: false, sizes: ['small', 'medium'] },
  monthly_driving:     { label: 'Monthly Driving',     wide: false },
  monthly_consumption: { label: 'Monthly Consumption', wide: false },
  recent_drives:       { label: 'Today & Yesterday',   wide: true  },
  charge_cost:         { label: 'Charging Cost',       wide: true  },
  links:               { label: 'Quick Links',         wide: false },
  states:              { label: 'Car States',          wide: false },
};

const SIZE_OPTIONS = [
  { value: 'small',  label: 'S', title: 'Small — essentials only' },
  { value: 'medium', label: 'M', title: 'Medium — standard view' },
  { value: 'large',  label: 'L', title: 'Large — full details' },
];

export default function SettingsPage({ onClose }) {
  const [timezone, setTimezone] = useState('UTC');
  const [layout, setLayout]     = useState([]);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  // Drag state
  const dragIdx  = useRef(null);
  const dragOver = useRef(null);

  useEffect(() => {
    fetchSettings().then(s => { if (s.timezone) setTimezone(s.timezone); });
    fetchWidgetLayout(1).then(rows => {
      const saved = rows.length ? rows.sort((a, b) => a.position - b.position) : [];
      const savedIds = new Set(saved.map(w => w.widget_id));
      const maxPos = saved.reduce((m, w) => Math.max(m, w.position), saved.length - 1);
      const missing = Object.keys(WIDGET_META)
        .filter(id => !savedIds.has(id))
        .map((id, i) => ({ widget_id: id, position: maxPos + 1 + i, enabled: 1, size: 'medium' }));
      setLayout([...saved, ...missing]);
    });
  }, []);

  const toggleWidget = (widget_id) =>
    setLayout(prev => prev.map(w => w.widget_id === widget_id ? { ...w, enabled: w.enabled ? 0 : 1 } : w));

  const setSize = (widget_id, size) =>
    setLayout(prev => prev.map(w => w.widget_id === widget_id ? { ...w, size } : w));

  // Drag & drop handlers
  const onDragStart = (i) => { dragIdx.current = i; };
  const onDragEnter = (i) => { dragOver.current = i; };
  const onDragEnd   = () => {
    if (dragIdx.current === null || dragOver.current === null) return;
    if (dragIdx.current === dragOver.current) return;
    const next = [...layout];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(dragOver.current, 0, moved);
    setLayout(next.map((w, i) => ({ ...w, position: i })));
    dragIdx.current  = null;
    dragOver.current = null;
  };

  const moveUp   = (i) => { if (i === 0) return; const n = [...layout]; [n[i-1], n[i]] = [n[i], n[i-1]]; setLayout(n.map((w,j)=>({...w,position:j}))); };
  const moveDown = (i) => { if (i === layout.length - 1) return; const n = [...layout]; [n[i], n[i+1]] = [n[i+1], n[i]]; setLayout(n.map((w,j)=>({...w,position:j}))); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveSettings({ timezone }),
        saveWidgetLayout(1, layout.map((w, i) => ({ ...w, position: i }))),
      ]);
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 700);
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto"
         onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl w-full max-w-lg my-8 flex flex-col gap-5 p-6"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">Settings</h2>
          <button onClick={onClose} className="text-dim hover:text-slate-300 text-lg leading-none">✕</button>
        </div>

        {/* Timezone */}
        <div className="flex flex-col gap-2">
          <label className="text-[0.6rem] uppercase tracking-widest text-accent font-semibold">Timezone</label>
          <p className="text-xs text-dim">Used for displaying charging times correctly.</p>
          <select value={timezone} onChange={e => setTimezone(e.target.value)}
                  className="bg-bg border border-border rounded-lg text-slate-200 text-sm px-3 py-2 outline-none focus:border-accent">
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
          </select>
        </div>

        <hr className="border-border" />

        {/* Widgets */}
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[0.6rem] uppercase tracking-widest text-accent font-semibold mb-1">Widgets</p>
            <p className="text-xs text-dim">Drag to reorder · toggle on/off · choose size (S / M / L)</p>
          </div>

          <div className="flex flex-col gap-1">
            {layout.map((w, i) => {
              const meta = WIDGET_META[w.widget_id];
              if (!meta) return null;
              return (
                <div key={w.widget_id}
                     draggable
                     onDragStart={() => onDragStart(i)}
                     onDragEnter={() => onDragEnter(i)}
                     onDragEnd={onDragEnd}
                     onDragOver={e => e.preventDefault()}
                     className={`flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all select-none
                       ${w.enabled ? 'border-border bg-muted/40' : 'border-transparent opacity-50'}`}>

                  {/* Drag handle */}
                  <span className="text-dim text-sm flex-shrink-0">⠿</span>

                  {/* Up/down arrows for touch/mobile */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button onClick={() => moveUp(i)}   disabled={i === 0}
                            className="text-dim hover:text-slate-300 disabled:opacity-20 text-xs leading-none px-0.5">▲</button>
                    <button onClick={() => moveDown(i)} disabled={i === layout.length - 1}
                            className="text-dim hover:text-slate-300 disabled:opacity-20 text-xs leading-none px-0.5">▼</button>
                  </div>

                  {/* Toggle */}
                  <div onClick={() => toggleWidget(w.widget_id)}
                       className={`w-9 h-5 rounded-full relative flex-shrink-0 cursor-pointer transition-colors ${w.enabled ? 'bg-accent' : 'bg-[#2d2d3d]'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${w.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200">{meta.label}</p>
                    {meta.wide && <p className="text-[0.6rem] text-dim">Full width</p>}
                  </div>

                  {/* Size */}
                  <div className="flex gap-1">
                    {SIZE_OPTIONS.filter(s => !meta.sizes || meta.sizes.includes(s.value)).map(s => (
                      <button key={s.value} title={s.title}
                              onClick={() => setSize(w.widget_id, s.value)}
                              disabled={!w.enabled}
                              className={`w-7 h-7 rounded text-xs font-bold transition-colors disabled:opacity-30 ${
                                (w.size || 'medium') === s.value
                                  ? 'bg-accent text-bg'
                                  : 'bg-muted text-dim hover:text-slate-300'
                              }`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving || saved}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  saved
                    ? 'bg-success/20 border border-success/40 text-success'
                    : 'bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30'
                } disabled:opacity-60`}>
          {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
