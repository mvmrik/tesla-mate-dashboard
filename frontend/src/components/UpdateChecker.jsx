import React, { useState, useEffect } from 'react';

const VERSION_URL = 'https://raw.githubusercontent.com/mvmrik/tesla-mate-dashboard/main/VERSION';
const BASE = import.meta.env.VITE_API_URL || '/api';

function semverGt(a, b) {
  const pa = a.trim().replace(/^v/, '').split('.').map(Number);
  const pb = b.trim().replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

const CMD = 'docker compose pull teslamate-dashboard && docker compose up -d teslamate-dashboard';

export default function UpdateChecker() {
  const [current,   setCurrent]   = useState(null);
  const [latest,    setLatest]    = useState(null);
  const [showCmd,   setShowCmd]   = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/health`)
      .then(r => r.json())
      .then(d => { if (d.version) setCurrent(d.version); })
      .catch(() => {});
    fetch(VERSION_URL)
      .then(r => r.text())
      .then(v => { if (v.trim()) setLatest(v.trim()); })
      .catch(() => {});
  }, []);

  if (!latest || !current || !semverGt(latest, current) || dismissed) return null;

  const copy = () => {
    navigator.clipboard.writeText(CMD).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-2.5 mb-4 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-300 flex-1">
          📦 New version <strong className="text-accent">{latest}</strong> available
        </span>
        <button onClick={() => setShowCmd(s => !s)}
                className="text-xs bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 px-3 py-1 rounded-md whitespace-nowrap">
          ⬆ Update
        </button>
        <button onClick={() => setDismissed(true)} className="text-dim hover:text-slate-300 text-sm">✕</button>
      </div>

      {showCmd && (
        <div className="flex items-center gap-2 bg-bg border border-border rounded-lg px-3 py-2">
          <code className="text-xs text-slate-300 font-mono flex-1 select-all">{CMD}</code>
          <button onClick={copy}
                  className={`text-xs px-2 py-1 rounded transition-colors flex-shrink-0 ${
                    copied ? 'text-success' : 'text-dim hover:text-slate-300'
                  }`}>
            {copied ? '✓' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
