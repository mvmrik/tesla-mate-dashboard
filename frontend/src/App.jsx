import React, { useState, useEffect, useCallback } from 'react';
import { fetchCarData, fetchHealth, fetchWidgetLayout, fetchSettings } from './lib/api.js';

import WidgetCard      from './components/WidgetCard.jsx';
import StatusBar       from './components/StatusBar.jsx';
import SettingsPage    from './pages/SettingsPage.jsx';
import UpdateChecker   from './components/UpdateChecker.jsx';

import BatteryWidget            from './components/widgets/BatteryWidget.jsx';
import TpmsWidget               from './components/widgets/TpmsWidget.jsx';
import ClimateWidget            from './components/widgets/ClimateWidget.jsx';
import MonthlyDrivingWidget     from './components/widgets/MonthlyDrivingWidget.jsx';
import MonthlyConsumptionWidget from './components/widgets/MonthlyConsumptionWidget.jsx';
import RecentDrivesWidget       from './components/widgets/RecentDrivesWidget.jsx';
import ChargeCostWidget         from './components/widgets/ChargeCostWidget.jsx';
import LinksWidget              from './components/widgets/LinksWidget.jsx';

const VERSION = '1.4.0';

const WIDGETS = {
  battery:              { component: BatteryWidget,            title: 'Battery & Range'      },
  tpms:                 { component: TpmsWidget,               title: 'Tyre Pressures', subtitle: 'bar' },
  climate:              { component: ClimateWidget,            title: 'Temperature'          },
  monthly_driving:      { component: MonthlyDrivingWidget,     title: 'Monthly Driving',     wide: true },
  monthly_consumption:  { component: MonthlyConsumptionWidget, title: 'Monthly Consumption', wide: true },
  recent_drives:        { component: RecentDrivesWidget,       title: 'Today & Yesterday',   wide: true },
  charge_cost:          { component: ChargeCostWidget,         title: 'Charging Cost',       wide: true, noData: true },
  links:                { component: LinksWidget,              title: 'Quick Links',         noData: true },
};

export default function App() {
  const [carData, setCarData]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [dbOk, setDbOk]             = useState(true);
  const [layout, setLayout]         = useState([]);
  const [showSettings, setSettings] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [data, health] = await Promise.all([fetchCarData(1), fetchHealth()]);
      setCarData(data);
      setDbOk(health.postgres === 'connected');
    } catch {
      setDbOk(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLayout = useCallback(() => {
    fetchWidgetLayout(1).then(rows => {
      const saved = rows.length ? rows : [];
      const savedIds = new Set(saved.map(w => w.widget_id));
      const maxPos = saved.reduce((m, w) => Math.max(m, w.position), saved.length - 1);
      // Any widget in code but missing from saved layout → append it enabled by default
      const missing = Object.keys(WIDGETS)
        .filter(id => !savedIds.has(id))
        .map((id, i) => ({ widget_id: id, position: maxPos + 1 + i, enabled: 1, size: 'medium' }));
      setLayout([...saved, ...missing]);
    });
  }, []);

  useEffect(() => {
    loadLayout();
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh, loadLayout]);

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
          <button onClick={() => setSettings(true)}
                  className="text-xs text-dim hover:text-slate-300 border border-border rounded-md px-3 py-1.5 hover:border-faint transition-colors">
            ⚙ Settings
          </button>
        </div>

        <StatusBar data={carData} loading={loading} onRefresh={refresh} dbOk={dbOk} />
        <UpdateChecker />

        {/* Widget grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleWidgets.map(({ widget_id, meta, size }) => {
            const Component = meta.component;
            const wide = meta.wide || false;
            return (
              <WidgetCard key={widget_id} title={meta.title} subtitle={meta.subtitle} wide={wide}>
                <Component data={meta.noData ? undefined : carData} size={size || 'medium'} />
              </WidgetCard>
            );
          })}
        </div>

        {!dbOk && !loading && (
          <div className="mt-6 bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
            Cannot connect to TeslaMate database. Check your <code className="font-mono">DATABASE_URL</code> environment variable.
          </div>
        )}

        <footer className="mt-10 text-center flex flex-col gap-1">
          <span className="text-xs text-[#2d2d3d]">v{VERSION}</span>
          <span className="text-xs text-dim">
            Made with ♥ by{' '}
            <a href="https://github.com/mvmrik" target="_blank" rel="noopener"
               className="text-accent hover:text-hi transition-colors">mvmrik</a>
            {' · '}
            <a href="https://github.com/mvmrik/tesla-mate-dashboard" target="_blank" rel="noopener"
               className="hover:text-slate-300 transition-colors">GitHub</a>
          </span>
        </footer>
      </div>

      {showSettings && (
        <SettingsPage
          onClose={() => { setSettings(false); loadLayout(); }}
        />
      )}
    </div>
  );
}
