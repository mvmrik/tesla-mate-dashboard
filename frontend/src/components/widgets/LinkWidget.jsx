import React from 'react';

export default function LinkWidget({ config = {} }) {
  const { url, title, favicon } = config;
  if (!url) return (
    <div className="flex items-center justify-center h-full text-dim text-xs">No URL</div>
  );
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
       className="flex flex-col items-center justify-center gap-2 h-full w-full group">
      {favicon ? (
        <img src={favicon} alt="" className="w-8 h-8 rounded object-contain" onError={e => { e.target.style.display = 'none'; }} />
      ) : (
        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-accent text-lg">⚡</div>
      )}
      <span className="text-xs text-center text-slate-300 group-hover:text-white transition-colors leading-tight line-clamp-2 px-1">
        {title || url}
      </span>
    </a>
  );
}
