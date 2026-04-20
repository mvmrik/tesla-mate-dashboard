import React, { useState, useEffect, useCallback } from 'react';
import { fetchCarData, fetchHealth, fetchWidgetLayout } from './lib/api.js';

import WidgetCard     from './components/WidgetCard.jsx';
import StatusBar      from './components/StatusBar.jsx';
import WidgetManager, { WIDGET_META } from './components/WidgetManager.jsx';

import BatteryWidget     from './components/widgets/BatteryWidget.jsx';
import TpmsWidget        from './components/widgets/TpmsWidget.jsx';
import ClimateWidget     from './components/widgets/ClimateWidget.jsx';
import LastChargeWidget  from './components/widgets/LastChargeWidget.jsx';
import MonthStatsWidget  from './components/widgets/MonthStatsWidget.jsx';
import RecentDrivesWidget from './components/widgets/RecentDrivesWidget.jsx';
import ChargeCostWidget  from './components/widgets/ChargeCostWidget.jsx';

const WIDGETS = {
  battery:       { component: BatteryWidget,      title: 'Battery & Range' },
  tpms:          { component: TpmsWidget,          title: 'Tyre Pressures', subtitle: 'bar' },
  climate:       { component: ClimateWidget,       title: 'Temperature' },
  last_charge:   { component: LastChargeWidget,    title: 'Last Charge' },
  month_stats:   { component: MonthStatsWidget,    title: 'Monthly Stats',   wide: true },
  recent_drives: { component: RecentDrivesWidget,  title: 'Today & Yesterday', wide: true },
  charge_cost:   { component: ChargeCostWidget,    title: 'Charging Cost',   wide: true, noData: true },
};

export default function App() {
  const [carData, setCarData]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [dbOk, setDbOk]           = useState(true);
  const [layout, setLayout]       = useState([]);
  const [showManager, setShowMgr] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [data, health] = await Promise.all([
        fetchCarData(1),
        fetchHealth(),
      ]);
      setCarData(data);
      setDbOk(health.postgres === 'connected');
    } catch {
      setDbOk(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWidgetLayout(1).then(rows => {
      if (rows.length) setLayout(rows);
      else {
        // Default order
        setLayout(Object.keys(WIDGETS).map((id, i) => ({ widget_id: id, position: i, enabled: 1 })));
      }
    });
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const visibleWidgets = layout
    .filter(w => w.enabled)
    .sort((a, b) => a.position - b.position)
    .map(w => ({ ...w, meta: WIDGETS[w.widget_id] }))
    .filter(w => w.meta);

  return (
    <div className="min-h-screen bg-bg text-slate-200">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-accent text-xl">⚡</span>
            <span className="text-sm font-semibold tracking-widest uppercase text-dim">TeslaMate Dashboard</span>
          </div>
          <button onClick={() => setShowMgr(true)}
                  className="text-xs text-dim hover:text-slate-300 border border-border rounded-md px-3 py-1.5 hover:border-faint transition-colors">
            ⊞ Widgets
          </button>
        </div>

        <StatusBar data={carData} loading={loading} onRefresh={refresh} dbOk={dbOk} />

        {/* Widget grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleWidgets.map(({ widget_id, meta }) => {
            const Component = meta.component;
            const wide      = meta.wide || WIDGET_META[widget_id]?.wide || false;
            return (
              <WidgetCard
                key={widget_id}
                title={meta.title}
                subtitle={meta.subtitle}
                wide={wide}
              >
                <Component data={meta.noData ? undefined : carData} />
              </WidgetCard>
            );
          })}
        </div>

        {/* DB disconnected notice */}
        {!dbOk && !loading && (
          <div className="mt-6 bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
            Cannot connect to TeslaMate database. Check your <code className="font-mono">DATABASE_URL</code> environment variable.
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-dim">
          TeslaMate Dashboard — Open Source
        </footer>
      </div>

      {showManager && (
        <WidgetManager
          layout={layout.length ? layout : Object.keys(WIDGETS).map((id,i)=>({widget_id:id,position:i,enabled:1}))}
          onSave={setLayout}
          onClose={() => setShowMgr(false)}
        />
      )}
    </div>
  );
}
