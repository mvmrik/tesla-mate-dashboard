import React, { useState, useEffect } from 'react';

const CURRENT = '1.6.0';
const VERSION_URL = 'https://raw.githubusercontent.com/mvmrik/tesla-mate-dashboard/main/VERSION';

function semverGt(a, b) {
  const pa = a.trim().replace(/^v/, '').split('.').map(Number);
  const pb = b.trim().replace(/^v/, '').split('.').map(Number);
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
    fetch(VERSION_URL)
      .then(r => r.text())
      .then(v => { if (v.trim()) setLatest(v.trim()); })
      .catch(() => {});
  }, []);

  if (!latest || !semverGt(latest, CURRENT) || dismissed) return null;

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await fetch('/api/update', { method: 'POST' });
      setDone(true);
      setTimeout(() => window.location.reload(), 8000);
    } catch {
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
        </>
      )}
      <button onClick={() => setDismiss(true)} className="text-dim hover:text-slate-300 text-sm">✕</button>
    </div>
  );
}
