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
    <div className="bg-surface rounded-lg relative overflow-hidden flex" style={{ minHeight: '90px' }}>
      {editMode && (
        <button onClick={() => onDelete(widget)}
                className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/60 border border-danger/60 text-danger text-xs flex items-center justify-center hover:bg-danger/40 transition-colors">
          ×
        </button>
      )}
      <div className="flex-1">{renderWidget(widget)}</div>
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
    <div className="col-span-2 bg-surface rounded-lg relative overflow-hidden flex" style={{ minHeight: '90px' }}>
      {editMode && (
        <button onClick={() => onDelete(widget)}
                className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/60 border border-danger/60 text-danger text-xs flex items-center justify-center hover:bg-danger/40 transition-colors">
          ×
        </button>
      )}
      <div className="flex-1">{renderWidget(widget)}</div>
    </div>
  );
}

export default function Block({
  block, editMode, onAddWidget, onDeleteWidget, onDeleteBlock,
  renderWidget, isDragging, onDragStart, onDragEnter, onDragEnd,
}) {
  const slotMap = {};
  for (const sw of block.slots) slotMap[sw.slot] = sw;

  // Check for a quad widget (fills the whole block)
  const quadWidget = block.slots.find(w => WIDGET_REGISTRY[w.widget_id]?.span === 4);

  const rows = [
    { rowStart: 0, slots: [0, 1] },
    { rowStart: 2, slots: [2, 3] },
  ];

  const hasAnyContent = quadWidget || block.slots.length > 0;
  if (!editMode && !hasAnyContent) return null;

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

      {editMode && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[0.55rem] uppercase tracking-widest text-dim select-none">⠿ Block</span>
          <button onClick={onDeleteBlock}
                  className="text-[0.6rem] text-dim hover:text-danger transition-colors px-1">
            Remove block
          </button>
        </div>
      )}

      {/* Quad widget — fills entire block */}
      {quadWidget ? (
        <div className="bg-surface rounded-lg relative overflow-hidden flex-1" style={{ minHeight: '196px' }}>
          {editMode && (
            <button onClick={() => onDeleteWidget(quadWidget)}
                    className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/60 border border-danger/60 text-danger text-xs flex items-center justify-center hover:bg-danger/40 transition-colors">
              ×
            </button>
          )}
          <div className="h-full p-3">{renderWidget(quadWidget)}</div>
        </div>
      ) : editMode ? (
        /* Edit mode: show all 4 slots as 2 rows */
        rows.map(({ rowStart, slots }) => {
          const doubleWidget = slots.map(s => slotMap[s]).find(
            w => w && WIDGET_REGISTRY[w.widget_id]?.span === 2
          );
          if (doubleWidget) {
            return (
              <div key={rowStart} className="grid grid-cols-2 gap-2">
                <DoubleSlotCell rowStart={rowStart} widget={doubleWidget} editMode={editMode}
                  onAdd={onAddWidget} onDelete={onDeleteWidget} renderWidget={renderWidget} />
              </div>
            );
          }
          return (
            <div key={rowStart} className="grid grid-cols-2 gap-2 items-stretch">
              {slots.map(slotIndex => (
                <SlotCell key={slotIndex} slotIndex={slotIndex} widget={slotMap[slotIndex] || null}
                  editMode={editMode} onAdd={onAddWidget} onDelete={onDeleteWidget} renderWidget={renderWidget} />
              ))}
            </div>
          );
        })
      ) : (
        /* View mode: only show rows that have content */
        rows
          .filter(row => row.slots.some(s => slotMap[s]))
          .map(({ rowStart, slots }) => {
            const doubleWidget = slots.map(s => slotMap[s]).find(
              w => w && WIDGET_REGISTRY[w.widget_id]?.span === 2
            );
            if (doubleWidget) {
              return (
                <div key={rowStart} className="grid grid-cols-2 gap-2">
                  <DoubleSlotCell rowStart={rowStart} widget={doubleWidget} editMode={editMode}
                    onAdd={onAddWidget} onDelete={onDeleteWidget} renderWidget={renderWidget} />
                </div>
              );
            }
            return (
              <div key={rowStart} className="grid grid-cols-2 gap-2 items-stretch">
                {slots.map(slotIndex => (
                  <SlotCell key={slotIndex} slotIndex={slotIndex} widget={slotMap[slotIndex] || null}
                    editMode={editMode} onAdd={onAddWidget} onDelete={onDeleteWidget} renderWidget={renderWidget} />
                ))}
              </div>
            );
          })
      )}
    </div>
  );
}
