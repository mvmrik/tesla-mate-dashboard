import React, { useState } from 'react';
import { saveWidgetLayout } from '../lib/api.js';

const WIDGET_META = {
  battery:      { label: 'Battery & Range',   wide: false },
  tpms:         { label: 'Tyre Pressures',    wide: false },
  climate:      { label: 'Temperature',        wide: false },
  last_charge:  { label: 'Last Charge',        wide: false },
  month_stats:  { label: 'Monthly Stats',      wide: true  },
  recent_drives:{ label: 'Recent Drives',      wide: true  },
  charge_cost:  { label: 'Charging Cost',      wide: true  },
};

export default function WidgetManager({ layout, onSave, onClose }) {
  const [local, setLocal] = useState(layout.map(w => ({ ...w })));

  const toggle = (widget_id) => {
    setLocal(prev => prev.map(w =>
      w.widget_id === widget_id ? { ...w, enabled: w.enabled ? 0 : 1 } : w
    ));
  };

  const handleSave = async () => {
    await saveWidgetLayout(1, local);
    onSave(local);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl w-full max-w-sm flex flex-col gap-4 p-5"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-100">Manage Widgets</h3>
          <button onClick={onClose} className="text-dim hover:text-slate-300">✕</button>
        </div>

        <div className="flex flex-col gap-2">
          {local.map(w => {
            const meta = WIDGET_META[w.widget_id] || { label: w.widget_id };
            return (
              <label key={w.widget_id} className="flex items-center justify-between gap-3 py-2 border-b border-muted last:border-0 cursor-pointer">
                <div>
                  <p className="text-sm text-slate-200">{meta.label}</p>
                  {meta.wide && <p className="text-xs text-dim">Full width</p>}
                </div>
                <div
                  onClick={() => toggle(w.widget_id)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${w.enabled ? 'bg-accent' : 'bg-muted border border-border'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${w.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>
            );
          })}
        </div>

        <button onClick={handleSave}
                className="bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 text-sm px-4 py-2 rounded-md">
          Save layout
        </button>
      </div>
    </div>
  );
}

export { WIDGET_META };
