import React, { useState } from 'react';
import { WIDGET_REGISTRY, CATEGORIES } from '../lib/widgets.js';
import { fetchFavicon } from '../lib/api.js';

export default function AddWidgetModal({ block, targetSlot, usedWidgetIds, onAdd, onClose }) {
  const [cat, setCat]         = useState('all');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkFetching, setLinkFetching] = useState(false);
  const [linkMeta, setLinkMeta]         = useState(null);

  // Determine availability
  const doubleRow = targetSlot != null ? (targetSlot < 2 ? [0, 1] : [2, 3]) : null;
  const doubleAvailable = doubleRow
    ? !block.slots.some(s => doubleRow.includes(s.slot))
    : false;
  const blockIsEmpty = block.slots.length === 0;

  const filtered = Object.entries(WIDGET_REGISTRY).filter(([id, meta]) => {
    if (cat !== 'all' && meta.category !== cat) return false;
    if (meta.span === 4 && !blockIsEmpty) return false; // quad only in empty block
    if (meta.span === 2 && !doubleAvailable) return false;
    if (!meta.multi && usedWidgetIds.has(id)) return false;
    if (id === 'link') return false; // handled separately
    return true;
  });

  const handleAdd = (widgetId, config = {}) => {
    const meta = WIDGET_REGISTRY[widgetId];
    if (meta.span === 4) {
      onAdd(widgetId, 0, config); // quad always goes in slot 0
    } else if (meta.span === 2) {
      onAdd(widgetId, doubleRow[0], config);
    } else {
      onAdd(widgetId, targetSlot, config);
    }
    onClose();
  };

  const fetchLink = async () => {
    if (!linkUrl.trim()) return;
    setLinkFetching(true);
    try {
      const meta = await fetchFavicon(linkUrl.trim());
      setLinkMeta(meta);
    } catch {
      setLinkMeta({ title: '', favicon: '' });
    } finally {
      setLinkFetching(false);
    }
  };

  const confirmLink = () => {
    onAdd('link', targetSlot, {
      url: linkUrl.trim(),
      title: linkMeta?.title || linkUrl.trim(),
      favicon: linkMeta?.favicon || '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl w-full max-w-sm flex flex-col max-h-[85vh]"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-border flex-shrink-0">
          <span className="font-semibold text-slate-100">Add Widget</span>
          <button onClick={onClose} className="text-dim hover:text-slate-300 text-lg leading-none">✕</button>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap px-4 pt-3 pb-1 flex-shrink-0">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)}
                    className={`text-[0.65rem] px-2 py-0.5 rounded-full border transition-colors ${
                      cat === c.id
                        ? 'bg-accent/20 border-accent/50 text-accent'
                        : 'border-border text-dim hover:text-slate-300'
                    }`}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Widget list */}
        <div className="overflow-y-auto flex-1 px-3 pb-3">
          <div className="flex flex-col gap-1 mt-2">
            {filtered.map(([id, meta]) => (
              <button key={id} onClick={() => handleAdd(id)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 text-left transition-colors w-full">
                <span className="text-slate-200 text-sm flex-1">{meta.label}</span>
                {meta.span === 4 && (
                  <span className="text-[0.6rem] text-dim border border-border rounded px-1">Full block</span>
                )}
                {meta.span === 2 && (
                  <span className="text-[0.6rem] text-dim border border-border rounded px-1">Wide</span>
                )}
              </button>
            ))}

            {/* Link entry — always show if slot is single */}
            {(cat === 'all' || cat === 'links') && targetSlot != null && (
              <div className="mt-2 border-t border-border pt-3">
                <p className="text-[0.6rem] uppercase tracking-widest text-accent font-semibold mb-2 px-1">Quick Link</p>
                <div className="flex flex-col gap-2 px-1">
                  <div className="flex gap-2">
                    <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && fetchLink()}
                           placeholder="https://..."
                           className="flex-1 bg-bg border border-border rounded-lg text-slate-200 text-sm px-3 py-2 outline-none focus:border-accent" />
                    <button onClick={fetchLink} disabled={linkFetching || !linkUrl.trim()}
                            className="text-xs px-3 py-2 rounded-lg bg-muted text-dim hover:text-slate-300 disabled:opacity-40">
                      {linkFetching ? '…' : 'Fetch'}
                    </button>
                  </div>
                  {linkMeta && (
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                      {linkMeta.favicon && <img src={linkMeta.favicon} alt="" className="w-5 h-5 rounded" />}
                      <span className="text-sm text-slate-200 flex-1 truncate">{linkMeta.title || linkUrl}</span>
                      <button onClick={confirmLink}
                              className="text-xs px-3 py-1.5 rounded-lg bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30">
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {filtered.length === 0 && cat !== 'links' && (
              <p className="text-center text-dim text-sm py-6">No widgets available for this slot</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
