import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchCarData, fetchHealth, fetchLayout,
  addBlock, deleteBlock, reorderBlocks,
  addSlotWidget, deleteSlotWidget,
} from './lib/api.js';
import { WIDGET_REGISTRY } from './lib/widgets.js';

import Block             from './components/Block.jsx';
import StatusBar         from './components/StatusBar.jsx';
import SettingsPage      from './pages/SettingsPage.jsx';
import UpdateChecker     from './components/UpdateChecker.jsx';
import AddWidgetModal    from './components/AddWidgetModal.jsx';

import BatteryWidget            from './components/widgets/BatteryWidget.jsx';
import TpmsWidget               from './components/widgets/TpmsWidget.jsx';
import ClimateWidget            from './components/widgets/ClimateWidget.jsx';
import MonthlyDrivingWidget     from './components/widgets/MonthlyDrivingWidget.jsx';
import MonthlyConsumptionWidget from './components/widgets/MonthlyConsumptionWidget.jsx';
import RecentDrivesWidget       from './components/widgets/RecentDrivesWidget.jsx';
import ChargeCostWidget         from './components/widgets/ChargeCostWidget.jsx';
import StatesWidget             from './components/widgets/StatesWidget.jsx';
import LinkWidget               from './components/widgets/LinkWidget.jsx';

const VERSION = '1.6.0';

function renderWidgetComponent(widget, carData) {
  const id = widget.widget_id;
  const cfg = widget.config || {};
  const size = 'medium';

  switch (id) {
    case 'battery':              return <BatteryWidget data={carData} size={size} />;
    case 'tpms':                 return <TpmsWidget data={carData} size={size} />;
    case 'climate':              return <ClimateWidget data={carData} size={size} />;
    case 'monthly_driving':      return <MonthlyDrivingWidget data={carData} size={size} />;
    case 'monthly_consumption':  return <MonthlyConsumptionWidget data={carData} size={size} />;
    case 'recent_drives':        return <RecentDrivesWidget data={carData} />;
    case 'charge_cost':          return <ChargeCostWidget />;
    case 'states_12h':           return <StatesWidget windowHours={12} />;
    case 'states_24h':           return <StatesWidget windowHours={24} />;
    case 'link':                 return <LinkWidget config={cfg} />;
    default:                     return <div className="text-dim text-xs">{id}</div>;
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
    if (meta.span === 2) {
      // double widget: fill both slots in the row with same widget
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
      // Remove both slots in the row
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

  const renderWidget = (widget) => renderWidgetComponent(widget, carData);

  return (
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
        <SettingsPage onClose={() => setShowSettings(false)} />
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
  );
}
