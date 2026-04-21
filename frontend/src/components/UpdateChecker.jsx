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
  const [latest,    setLatest]    = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch(VERSION_URL)
      .then(r => r.text())
      .then(v => { if (v.trim()) setLatest(v.trim()); })
      .catch(() => {});
  }, []);

  if (!latest || !semverGt(latest, CURRENT) || dismissed) return null;

  return (
    <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-3 mb-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-300">
          📦 New version <strong className="text-accent">{latest}</strong> available
        </span>
        <button onClick={() => setDismissed(true)} className="text-dim hover:text-slate-300 text-sm flex-shrink-0">✕</button>
      </div>
      <p className="text-xs text-dim">Run on your server to update:</p>
      <code className="text-xs bg-bg border border-border rounded px-3 py-2 text-slate-300 font-mono select-all">
        docker compose pull && docker compose up -d
      </code>
    </div>
  );
}
