import React from 'react';
import { WIDGET_REGISTRY } from '../lib/widgets.js';

// Render a single slot cell
function SlotCell({ slotIndex, widget, editMode, onAdd, onDelete, renderWidget }) {
  if (!widget) {
    return (
      <div className={`bg-[#0f1929] rounded-lg flex items-center justify-center min-h-[90px] ${
        editMode ? 'border-2 border-dashed border-border/50 cursor-pointer hover:border-accent/60 transition-colors' : 'hidden sm:flex opacity-0 pointer-events-none'
      }`}
           onClick={editMode ? () => onAdd(slotIndex) : undefined}>
        {editMode && <span className="text-2xl text-dim hover:text-accent transition-colors">+</span>}
      </div>
    );
  }

  const meta = WIDGET_REGISTRY[widget.widget_id];

  return (
    <div className="bg-surface rounded-lg min-h-[90px] relative overflow-hidden">
      {editMode && (
        <button onClick={() => onDelete(widget)}
                className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/60 border border-danger/60 text-danger text-xs flex items-center justify-center hover:bg-danger/40 transition-colors">
          ×
        </button>
      )}
      {renderWidget(widget)}
    </div>
  );
}

// Double-width slot (spans 2 columns)
function DoubleSlotCell({ rowStart, widget, editMode, onAdd, onDelete, renderWidget }) {
  if (!widget) {
    return (
      <div className={`col-span-2 bg-[#0f1929] rounded-lg flex items-center justify-center min-h-[90px] ${
        editMode ? 'border-2 border-dashed border-border/50 cursor-pointer hover:border-accent/60 transition-colors' : 'hidden sm:flex opacity-0 pointer-events-none'
      }`}
           onClick={editMode ? () => onAdd(rowStart) : undefined}>
        {editMode && <span className="text-2xl text-dim hover:text-accent transition-colors">+</span>}
      </div>
    );
  }

  return (
    <div className="col-span-2 bg-surface rounded-lg min-h-[90px] relative overflow-hidden">
      {editMode && (
        <button onClick={() => onDelete(widget)}
                className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/60 border border-danger/60 text-danger text-xs flex items-center justify-center hover:bg-danger/40 transition-colors">
          ×
        </button>
      )}
      {renderWidget(widget)}
    </div>
  );
}

export default function Block({
  block, editMode, onAddWidget, onDeleteWidget, onDeleteBlock,
  renderWidget, isDragging, onDragStart, onDragEnter, onDragEnd,
}) {
  // Build slot map
  const slotMap = {};
  for (const sw of block.slots) slotMap[sw.slot] = sw;

  // Determine rows: each row is 2 slots (row0: slots 0,1; row1: slots 2,3)
  // A double widget occupies slot 0-1 or 2-3
  const rows = [
    { rowStart: 0, slots: [0, 1] },
    { rowStart: 2, slots: [2, 3] },
  ];

  // In non-edit mode, skip empty rows entirely
  const visibleRows = editMode
    ? rows
    : rows.filter(row => row.slots.some(s => slotMap[s]));

  if (!editMode && visibleRows.length === 0) return null;

  return (
    <div
      draggable={editMode}
      onDragStart={editMode ? onDragStart : undefined}
      onDragEnter={editMode ? onDragEnter : undefined}
      onDragEnd={editMode ? onDragEnd : undefined}
      onDragOver={editMode ? e => e.preventDefault() : undefined}
      className={`bg-bg border rounded-xl p-3 flex flex-col gap-2 transition-all ${
        editMode
          ? 'border-border cursor-grab active:cursor-grabbing'
          : 'border-transparent'
      } ${isDragging ? 'opacity-40' : ''}`}>

      {/* Block header in edit mode */}
      {editMode && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[0.55rem] uppercase tracking-widest text-dim select-none">⠿ Block</span>
          <button onClick={onDeleteBlock}
                  className="text-[0.6rem] text-dim hover:text-danger transition-colors px-1">
            Remove block
          </button>
        </div>
      )}

      {/* Rows */}
      {visibleRows.map(({ rowStart, slots }) => {
        // Check for double-span widget occupying this row
        const doubleWidget = slots.map(s => slotMap[s]).find(
          w => w && WIDGET_REGISTRY[w.widget_id]?.span === 2
        );

        if (doubleWidget) {
          return (
            <div key={rowStart} className="grid grid-cols-2 gap-2">
              <DoubleSlotCell
                rowStart={rowStart}
                widget={doubleWidget}
                editMode={editMode}
                onAdd={onAddWidget}
                onDelete={onDeleteWidget}
                renderWidget={renderWidget}
              />
            </div>
          );
        }

        return (
          <div key={rowStart} className="grid grid-cols-2 gap-2">
            {slots.map(slotIndex => (
              <SlotCell
                key={slotIndex}
                slotIndex={slotIndex}
                widget={slotMap[slotIndex] || null}
                editMode={editMode}
                onAdd={onAddWidget}
                onDelete={onDeleteWidget}
                renderWidget={renderWidget}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
