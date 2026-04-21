import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchCarData, fetchHealth, fetchLayout, fetchSettings,
  addBlock, deleteBlock, reorderBlocks,
  addSlotWidget, deleteSlotWidget,
} from './lib/api.js';
import { WIDGET_REGISTRY } from './lib/widgets.js';
import { SettingsContext } from './lib/SettingsContext.js';
import {
  fmtDist, distLabel, fmtSpeed, speedLabel,
  fmtTemp, tempLabel, fmtConsumption, consumptionLabel,
} from './lib/units.js';

import Block             from './components/Block.jsx';
import StatusBar         from './components/StatusBar.jsx';
import SettingsPage      from './pages/SettingsPage.jsx';
import UpdateChecker     from './components/UpdateChecker.jsx';
import AddWidgetModal    from './components/AddWidgetModal.jsx';

import RecentDrivesWidget from './components/widgets/RecentDrivesWidget.jsx';
import TripsWidget        from './components/widgets/TripsWidget.jsx';
import ChargeCostWidget   from './components/widgets/ChargeCostWidget.jsx';
import StatesWidget       from './components/widgets/StatesWidget.jsx';
import LinkWidget         from './components/widgets/LinkWidget.jsx';
import Cell               from './components/Cell.jsx';
import { batteryColor, tpmsColor, tpmsBar, tempColor, tempBar } from './components/Cell.jsx';

const VERSION = '1.7.0';

function tpmsAvg(...vals) {
  const v = vals.filter(x => x != null).map(Number);
  if (!v.length) return null;
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10;
}

function renderWidgetComponent(widget, carData, settings = {}) {
  const id  = widget.widget_id;
  const cfg = widget.config || {};
  const d   = carData;

  const ms = d?.month_stats;
  const ts = d?.today_stats;

  const du = settings.distanceUnit || 'km';
  const tu = settings.tempUnit     || 'C';

  // Shared drive time formatter
  const fmtDriveTime = (totalMin) => {
    if (totalMin == null) return null;
    const min = parseInt(totalMin);
    const h = Math.floor(min / 60), m = min % 60;
    const dim = s => <span className="text-sm font-normal text-dim ml-0.5">{s}</span>;
    return min < 60 ? <>{min}{dim('min')}</> : <>{h}{dim('h')}{m > 0 && <>{m}{dim('m')}</>}</>;
  };

  switch (id) {

    // ── Battery & Charging ───────────────────────────────────────────────────
    case 'battery_health': {
      const km = d?.rated_range_km_full ?? null;
      return <Cell label="Battery Health" value={fmtDist(km, du)} unit={distLabel(du)} sub="Est. range at 100%" subBottom />;
    }
    case 'battery_level': {
      const pct = d?.battery_level ?? null;
      return <Cell label="Battery %" value={pct} unit="%" bar={pct} barColor={batteryColor(pct)} />;
    }
    case 'battery_range': {
      const km = d?.rated_range_km ?? null;
      const maxKm = d?.rated_range_km_full ?? null;
      const bar = km != null && maxKm != null && maxKm > 0
        ? Math.min(100, km / maxKm * 100) : undefined;
      return <Cell label="Battery Range" value={fmtDist(km, du)} unit={distLabel(du)} bar={bar} barColor={batteryColor(d?.battery_level)} />;
    }
    case 'last_charge':
      return <Cell label="Last Charge" value={d?.last_charge_end_pct} unit="%"
                   sub={d?.last_charge_kwh != null ? `+${d.last_charge_kwh} kWh` : null} subBottom />;
    case 'monthly_kwh_charged':
      return <Cell label="Monthly kWh Charged" value={ms?.total_kwh} unit="kWh" />;

    // ── Driving — Monthly ────────────────────────────────────────────────────
    case 'monthly_avg_speed':
      return <Cell label="Monthly Avg Speed" value={fmtSpeed(ms?.avg_speed_kmh, du)} unit={speedLabel(du)} />;
    case 'monthly_distance':
      return <Cell label="Monthly Distance" value={fmtDist(ms?.total_km, du)} unit={distLabel(du)} />;
    case 'monthly_drive_time':
      return <Cell label="Monthly Drive Time" value={fmtDriveTime(ms?.total_min)} />;
    case 'monthly_drives':
      return <Cell label="Monthly Drives" value={ms?.drives_count} />;
    case 'monthly_kwh_per_100':
      return <Cell label={`Monthly ${consumptionLabel(du)}`} value={fmtConsumption(ms?.avg_kwh_per_100km, du)} unit="kWh/100" />;
    case 'monthly_max_speed':
      return <Cell label="Monthly Max Speed" value={fmtSpeed(ms?.speed_max, du)} unit={speedLabel(du)} />;
    case 'odometer':
      return <Cell label="Odometer" value={fmtDist(d?.odometer_km, du)} unit={distLabel(du)} />;

    // ── Driving — Today ──────────────────────────────────────────────────────
    case 'today_avg_speed':
      return <Cell label="Today Avg Speed" value={fmtSpeed(ts?.avg_speed_kmh, du)} unit={speedLabel(du)} />;
    case 'today_distance':
      return <Cell label="Today Distance" value={fmtDist(ts?.total_km, du)} unit={distLabel(du)} />;
    case 'today_drive_time':
      return <Cell label="Today Drive Time" value={fmtDriveTime(ts?.total_min)} />;
    case 'today_drives':
      return <Cell label="Today Drives" value={ts?.drives_count} />;
    case 'today_kwh_per_100':
      return <Cell label={`Today ${consumptionLabel(du)}`} value={fmtConsumption(ts?.avg_kwh_per_100km, du)} unit="kWh/100" />;
    case 'today_max_speed':
      return <Cell label="Today Max Speed" value={fmtSpeed(ts?.speed_max, du)} unit={speedLabel(du)} />;

    // ── Sensors ──────────────────────────────────────────────────────────────
    case 'temp_inside': {
      const v = d?.inside_temp;
      const fv = fmtTemp(v, tu);
      return <Cell label={d?.is_climate_on ? 'Inside Temp ❄' : 'Inside Temp'}
                   value={fv != null ? fv + '°' : null} bar={tempBar(v)} barColor={tempColor(v)} />;
    }
    case 'temp_minmax': {
      const mn = fmtTemp(d?.outside_temp_min, tu), mx = fmtTemp(d?.outside_temp_max, tu);
      return <Cell label="Outside Temp Min/Max"
                   value={mn != null && mx != null ? `${mn}° / ${mx}°` : null} smallValue />;
    }
    case 'temp_outside': {
      const v = d?.outside_temp;
      const fv = fmtTemp(v, tu);
      return <Cell label="Outside Temp" value={fv != null ? fv + '°' : null} bar={tempBar(v)} barColor={tempColor(v)} />;
    }
    case 'tpms_avg': {
      const v = tpmsAvg(d?.tpms_pressure_fl, d?.tpms_pressure_fr, d?.tpms_pressure_rl, d?.tpms_pressure_rr);
      return <Cell label="Tyre Pressure Avg" value={v?.toFixed(1)} unit="bar" bar={tpmsBar(v)} barColor={tpmsColor(v)} />;
    }
    case 'tpms_fl': {
      const v = d?.tpms_pressure_fl != null ? parseFloat(d.tpms_pressure_fl) : null;
      return <Cell label="Tyre Pressure FL" value={v?.toFixed(1)} unit="bar" bar={tpmsBar(v)} barColor={tpmsColor(v)} />;
    }
    case 'tpms_fr': {
      const v = d?.tpms_pressure_fr != null ? parseFloat(d.tpms_pressure_fr) : null;
      return <Cell label="Tyre Pressure FR" value={v?.toFixed(1)} unit="bar" bar={tpmsBar(v)} barColor={tpmsColor(v)} />;
    }
    case 'tpms_front': {
      const v = tpmsAvg(d?.tpms_pressure_fl, d?.tpms_pressure_fr);
      return <Cell label="Tyre Pressure Front" value={v?.toFixed(1)} unit="bar" bar={tpmsBar(v)} barColor={tpmsColor(v)} />;
    }
    case 'tpms_rear': {
      const v = tpmsAvg(d?.tpms_pressure_rl, d?.tpms_pressure_rr);
      return <Cell label="Tyre Pressure Rear" value={v?.toFixed(1)} unit="bar" bar={tpmsBar(v)} barColor={tpmsColor(v)} />;
    }
    case 'tpms_rl': {
      const v = d?.tpms_pressure_rl != null ? parseFloat(d.tpms_pressure_rl) : null;
      return <Cell label="Tyre Pressure RL" value={v?.toFixed(1)} unit="bar" bar={tpmsBar(v)} barColor={tpmsColor(v)} />;
    }
    case 'tpms_rr': {
      const v = d?.tpms_pressure_rr != null ? parseFloat(d.tpms_pressure_rr) : null;
      return <Cell label="Tyre Pressure RR" value={v?.toFixed(1)} unit="bar" bar={tpmsBar(v)} barColor={tpmsColor(v)} />;
    }

    // ── Activity / Wide ───────────────────────────────────────────────────────
    case 'trips':          return <TripsWidget />;
    case 'recent_drives':  return <RecentDrivesWidget data={d} />;
    case 'charge_cost':    return <ChargeCostWidget />;
    case 'states_12h':     return <StatesWidget windowHours={12} />;
    case 'states_24h':     return <StatesWidget windowHours={24} />;

    // ── Links ─────────────────────────────────────────────────────────────────
    case 'link': return <LinkWidget config={cfg} />;

    default: return <div className="text-dim text-xs">{id}</div>;
  }
}

export default function App() {
  const [carData,       setCarData]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [dbOk,          setDbOk]          = useState(true);
  const [blocks,        setBlocks]        = useState([]);
  const [editMode,      setEditMode]      = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);
  const [addModal,      setAddModal]      = useState(null); // { block, slot }
  const [settings,      setSettings]      = useState({ timeFormat: '24h', distanceUnit: 'km', tempUnit: 'C' });
  const dragIdx   = useRef(null);
  const dragOver  = useRef(null);

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
    fetchLayout(1).then(setBlocks).catch(() => setBlocks([]));
  }, []);

  useEffect(() => {
    loadLayout();
    refresh();
    fetchSettings().then(s => setSettings(s)).catch(() => {});
    const iv = setInterval(refresh, 60000);
    return () => clearInterval(iv);
  }, [refresh, loadLayout]);

  // Block drag handlers
  const onDragStart = (i) => { dragIdx.current = i; };
  const onDragEnter = (i) => { dragOver.current = i; };
  const onDragEnd   = async () => {
    if (dragIdx.current === null || dragOver.current === null) return;
    if (dragIdx.current === dragOver.current) { dragIdx.current = dragOver.current = null; return; }
    const next = [...blocks];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(dragOver.current, 0, moved);
    dragIdx.current = dragOver.current = null;
    setBlocks(next);
    await reorderBlocks(1, next.map(b => b.id));
  };

  const handleAddBlock = async () => {
    const block = await addBlock(1);
    setBlocks(prev => [...prev, block]);
  };

  const handleDeleteBlock = async (blockId) => {
    await deleteBlock(blockId);
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  };

  const handleAddWidget = async (blockId, widgetId, slot, config = {}) => {
    const meta = WIDGET_REGISTRY[widgetId];
    if (meta.span === 4) {
      // quad: just one record in slot 0
      await addSlotWidget(blockId, 0, widgetId, config);
    } else if (meta.span === 2) {
      const row = slot < 2 ? [0, 1] : [2, 3];
      await addSlotWidget(blockId, row[0], widgetId, config);
      await addSlotWidget(blockId, row[1], widgetId, config);
    } else {
      await addSlotWidget(blockId, slot, widgetId, config);
    }
    loadLayout();
  };

  const handleDeleteWidget = async (widget) => {
    const meta = WIDGET_REGISTRY[widget.widget_id];
    if (meta?.span === 2) {
      const block = blocks.find(b => b.id === widget.block_id);
      if (block) {
        const row = widget.slot < 2 ? [0, 1] : [2, 3];
        const toDelete = block.slots.filter(s => row.includes(s.slot));
        await Promise.all(toDelete.map(s => deleteSlotWidget(s.id)));
      }
    } else {
      await deleteSlotWidget(widget.id);
    }
    loadLayout();
  };

  // Collect all unique widget_ids used across all blocks (for "already added" check)
  const usedWidgetIds = new Set(
    blocks.flatMap(b => b.slots.map(s => s.widget_id))
  );

  const renderWidget = (widget) => renderWidgetComponent(widget, carData, settings);

  return (
    <SettingsContext.Provider value={settings}>
    <div className="min-h-screen bg-bg text-slate-200">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-accent text-xl">⚡</span>
            <span className="text-sm font-semibold tracking-widest uppercase text-dim">TeslaMate Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditMode(e => !e)}
                    className={`text-xs border rounded-md px-3 py-1.5 transition-colors ${
                      editMode
                        ? 'bg-accent/20 border-accent/50 text-accent'
                        : 'text-dim hover:text-slate-300 border-border hover:border-faint'
                    }`}>
              {editMode ? '✓ Done' : '✎ Edit'}
            </button>
            <button onClick={() => setShowSettings(true)}
                    className="text-xs text-dim hover:text-slate-300 border border-border rounded-md px-3 py-1.5 hover:border-faint transition-colors">
              ⚙ Settings
            </button>
          </div>
        </div>

        <StatusBar data={carData} loading={loading} onRefresh={refresh} dbOk={dbOk} />
        <UpdateChecker />

        {/* Block grid — blocks side by side, each block is 2×2 */}
        <div className="flex flex-wrap gap-4 items-start">
          {blocks.map((block, i) => (
            <div key={block.id} className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]">
              <Block
                block={block}
                editMode={editMode}
                onAddWidget={(slot) => setAddModal({ block, slot })}
                onDeleteWidget={handleDeleteWidget}
                onDeleteBlock={() => handleDeleteBlock(block.id)}
                renderWidget={renderWidget}
                isDragging={dragIdx.current === i}
                onDragStart={() => onDragStart(i)}
                onDragEnter={() => onDragEnter(i)}
                onDragEnd={onDragEnd}
              />
            </div>
          ))}

          {/* Add block button in edit mode */}
          {editMode && (
            <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]">
              <button onClick={handleAddBlock}
                      className="w-full border-2 border-dashed border-border/50 rounded-xl py-8 flex items-center justify-center gap-2 text-dim hover:border-accent/60 hover:text-accent transition-colors">
                <span className="text-2xl">+</span>
                <span className="text-sm">Add block</span>
              </button>
            </div>
          )}
        </div>

        {blocks.length === 0 && !editMode && (
          <div className="text-center py-16 text-dim">
            <p className="text-4xl mb-4">✎</p>
            <p className="text-sm mb-2">No widgets yet</p>
            <p className="text-xs">Click <strong className="text-slate-400">Edit</strong> to add blocks and widgets</p>
          </div>
        )}

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
        <SettingsPage onClose={() => {
          setShowSettings(false);
          fetchSettings().then(s => setSettings(s)).catch(() => {});
        }} />
      )}

      {addModal && (
        <AddWidgetModal
          block={addModal.block}
          targetSlot={addModal.slot}
          usedWidgetIds={usedWidgetIds}
          onAdd={(widgetId, slot, config) => handleAddWidget(addModal.block.id, widgetId, slot, config)}
          onClose={() => setAddModal(null)}
        />
      )}
    </div>
    </SettingsContext.Provider>
  );
}
