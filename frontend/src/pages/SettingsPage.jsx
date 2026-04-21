import React, { useState, useEffect } from 'react';
import { fetchSettings, saveSettings } from '../lib/api.js';

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

export default function SettingsPage({ onClose }) {
  const [timezone,      setTimezone]      = useState('UTC');
  const [timeFormat,    setTimeFormat]    = useState('24h');
  const [distanceUnit,  setDistanceUnit]  = useState('km');
  const [tempUnit,      setTempUnit]      = useState('C');
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);

  useEffect(() => {
    fetchSettings().then(s => {
      if (s.timezone)     setTimezone(s.timezone);
      if (s.timeFormat)   setTimeFormat(s.timeFormat);
      if (s.distanceUnit) setDistanceUnit(s.distanceUnit);
      if (s.tempUnit)     setTempUnit(s.tempUnit);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings({ timezone, timeFormat, distanceUnit, tempUnit });
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
      <div className="bg-surface border border-border rounded-xl w-full max-w-md my-8 flex flex-col gap-5 p-6"
           onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">Settings</h2>
          <button onClick={onClose} className="text-dim hover:text-slate-300 text-lg leading-none">✕</button>
        </div>

        {/* Timezone */}
        <div className="flex flex-col gap-2">
          <label className="text-[0.6rem] uppercase tracking-widest text-accent font-semibold">Timezone</label>
          <p className="text-xs text-dim">Used for displaying drive and charge times correctly.</p>
          <select value={timezone} onChange={e => setTimezone(e.target.value)}
                  className="bg-bg border border-border rounded-lg text-slate-200 text-sm px-3 py-2 outline-none focus:border-accent">
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
          </select>
        </div>

        <hr className="border-border" />

        {/* Time format */}
        <div className="flex flex-col gap-2">
          <label className="text-[0.6rem] uppercase tracking-widest text-accent font-semibold">Time Format</label>
          <div className="flex gap-2">
            {['24h', '12h'].map(f => (
              <button key={f} onClick={() => setTimeFormat(f)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        timeFormat === f
                          ? 'bg-accent/20 border-accent/50 text-accent'
                          : 'bg-muted border-border text-dim hover:text-slate-300'
                      }`}>
                {f === '24h' ? '24-hour (14:30)' : '12-hour (2:30 PM)'}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-border" />

        {/* Distance unit */}
        <div className="flex flex-col gap-2">
          <label className="text-[0.6rem] uppercase tracking-widest text-accent font-semibold">Distance Unit</label>
          <div className="flex gap-2">
            {[['km', 'Kilometres (km)'], ['mi', 'Miles (mi)']].map(([val, label]) => (
              <button key={val} onClick={() => setDistanceUnit(val)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        distanceUnit === val
                          ? 'bg-accent/20 border-accent/50 text-accent'
                          : 'bg-muted border-border text-dim hover:text-slate-300'
                      }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-border" />

        {/* Temperature unit */}
        <div className="flex flex-col gap-2">
          <label className="text-[0.6rem] uppercase tracking-widest text-accent font-semibold">Temperature Unit</label>
          <div className="flex gap-2">
            {[['C', 'Celsius (°C)'], ['F', 'Fahrenheit (°F)']].map(([val, label]) => (
              <button key={val} onClick={() => setTempUnit(val)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        tempUnit === val
                          ? 'bg-accent/20 border-accent/50 text-accent'
                          : 'bg-muted border-border text-dim hover:text-slate-300'
                      }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

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
