import React, { useState, useEffect, useRef } from 'react';
import { fetchLinks, addLink, deleteLink, fetchFavicon, reorderLinks } from '../../lib/api.js';

function FaviconImg({ src, title }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div className="w-5 h-5 rounded bg-[#0f172a] flex items-center justify-center text-[0.6rem] text-dim flex-shrink-0">
      {(title || '?')[0].toUpperCase()}
    </div>
  );
  return <img src={src} alt="" onError={() => setErr(true)}
              className="w-5 h-5 rounded flex-shrink-0 object-contain" />;
}

export default function LinksWidget() {
  const [links,   setLinks]   = useState([]);
  const [adding,  setAdding]  = useState(false);
  const [url,     setUrl]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const dragIdx  = useRef(null);
  const dragOver = useRef(null);

  const load = () => fetchLinks().then(rows =>
    setLinks([...rows].sort((a, b) => a.position - b.position))
  );

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!url.trim()) return;
    setLoading(true); setError('');
    try {
      let fullUrl = url.trim();
      if (!/^https?:\/\//i.test(fullUrl)) fullUrl = 'https://' + fullUrl;
      const meta = await fetchFavicon(fullUrl);
      await addLink({ url: fullUrl, title: meta.title || fullUrl, favicon: meta.favicon || '' });
      setUrl(''); setAdding(false);
      await load();
    } catch {
      setError('Could not add link.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteLink(id);
    await load();
  };

  const onDragStart = (i) => { dragIdx.current = i; };
  const onDragEnter = (i) => { dragOver.current = i; };
  const onDragEnd   = async () => {
    if (dragIdx.current === null || dragOver.current === null) return;
    if (dragIdx.current === dragOver.current) { dragIdx.current = dragOver.current = null; return; }
    const next = [...links];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(dragOver.current, 0, moved);
    dragIdx.current = dragOver.current = null;
    const ordered = next.map((l, i) => ({ ...l, position: i }));
    setLinks(ordered);
    await reorderLinks(ordered.map(l => ({ id: l.id, position: l.position })));
  };

  return (
    <div className="flex flex-col gap-3">
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map((link, i) => (
            <div key={link.id} className="group relative"
                 draggable
                 onDragStart={() => onDragStart(i)}
                 onDragEnter={() => onDragEnter(i)}
                 onDragEnd={onDragEnd}
                 onDragOver={e => e.preventDefault()}>
              <a href={link.url} target="_blank" rel="noopener"
                 onClick={e => dragIdx.current !== null && e.preventDefault()}
                 className="flex items-center gap-2 bg-muted hover:bg-[#263245] border border-border hover:border-faint rounded-lg px-3 py-2 transition-colors text-sm text-slate-200 max-w-[200px] cursor-grab active:cursor-grabbing select-none">
                <span className="text-dim text-xs flex-shrink-0">⠿</span>
                <FaviconImg src={link.favicon} title={link.title} />
                <span className="truncate">{link.title || link.url}</span>
              </a>
              <button onClick={() => handleDelete(link.id)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-danger text-white text-[0.6rem] leading-none hidden group-hover:flex items-center justify-center z-10">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="flex gap-2 items-center flex-wrap">
          <input autoFocus value={url} onChange={e => setUrl(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleAdd()}
                 placeholder="https://example.com"
                 className="flex-1 min-w-0 bg-bg border border-border rounded-lg text-slate-200 text-sm px-3 py-1.5 outline-none focus:border-accent" />
          <button onClick={handleAdd} disabled={loading}
                  className="bg-accent/20 border border-accent/40 text-accent text-sm px-3 py-1.5 rounded-lg hover:bg-accent/30 disabled:opacity-50 whitespace-nowrap">
            {loading ? '...' : 'Add'}
          </button>
          <button onClick={() => { setAdding(false); setUrl(''); setError(''); }}
                  className="text-dim hover:text-slate-300 text-sm px-2">Cancel</button>
          {error && <p className="text-xs text-danger w-full">{error}</p>}
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
                className="text-xs text-dim hover:text-accent transition-colors self-start">
          + Add link
        </button>
      )}

      {links.length === 0 && !adding && (
        <p className="text-xs text-dim">No links yet. Click + Add link to get started.</p>
      )}
    </div>
  );
}
