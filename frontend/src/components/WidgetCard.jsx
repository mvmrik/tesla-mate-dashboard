import React from 'react';

export default function WidgetCard({ title, subtitle, wide, children, actions }) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 ${wide ? 'col-span-full' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[0.6rem] uppercase tracking-[0.1em] text-accent font-semibold">{title}</h2>
          {subtitle && <p className="text-[0.55rem] text-dim mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-1 flex-shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
