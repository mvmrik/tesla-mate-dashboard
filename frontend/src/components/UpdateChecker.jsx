import React, { useState, useEffect } from 'react';

const CURRENT = '1.4.0';
const REPO    = 'mvmrik/tesla-mate-dashboard';

function semverGt(a, b) {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

export default function UpdateChecker() {
  const [latest, setLatest]     = useState(null);
  const [updating, setUpdating] = useState(false);
  const [done, setDone]         = useState(false);
  const [dismissed, setDismiss] = useState(false);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' }
    })
      .then(r => r.json())
      .then(d => { if (d.tag_name) setLatest(d.tag_name); })
      .catch(() => {});
  }, []);

  if (!latest || !semverGt(latest, CURRENT) || dismissed) return null;

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await fetch('/api/update', { method: 'POST' });
      setDone(true);
      // Page will reload when container restarts
      setTimeout(() => window.location.reload(), 8000);
    } catch {
      // Auto-update not supported — just show instructions
      setDone('manual');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-2.5 mb-4 flex items-center gap-3 flex-wrap">
      <span className="text-accent text-sm">📦</span>
      <span className="text-sm text-slate-300 flex-1">
        New version <strong className="text-accent">{latest}</strong> is available
        {done === true && <span className="text-success ml-2">— updating, page will reload shortly...</span>}
        {done === 'manual' && (
          <span className="text-dim ml-2">
            — run: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">docker compose pull && docker compose up -d</code>
          </span>
        )}
      </span>
      {!done && (
        <>
          <button onClick={handleUpdate} disabled={updating}
                  className="text-xs bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 px-3 py-1 rounded-md disabled:opacity-50 whitespace-nowrap">
            {updating ? 'Updating...' : '⬆ Update now'}
          </button>
          <a href={`https://github.com/${REPO}/releases/latest`} target="_blank" rel="noopener"
             className="text-xs text-dim hover:text-slate-300 whitespace-nowrap">
            Release notes →
          </a>
        </>
      )}
      <button onClick={() => setDismiss(true)} className="text-dim hover:text-slate-300 text-sm">✕</button>
    </div>
  );
}
