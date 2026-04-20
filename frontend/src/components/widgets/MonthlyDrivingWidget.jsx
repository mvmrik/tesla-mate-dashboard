import React from 'react';
import Cell, { CellRow, CellGrid2x2 } from '../Cell.jsx';

export default function MonthlyDrivingWidget({ data, size = 'medium' }) {
  if (!data) return <SkeletonCells size={size} />;

  const ms = data.month_stats;
  if (!ms || !ms.total_km) return <p className="text-sm text-dim">No drives this month yet</p>;

  const totalMin = parseInt(ms.total_min || 0);
  const timeStr  = totalMin >= 60
    ? Math.floor(totalMin / 60) + 'h ' + (totalMin % 60) + 'min'
    : totalMin + 'min';

  if (size === 'small') return (
    <Cell label="Distance" value={ms.total_km} unit="km" />
  );

  if (size === 'medium') return (
    <CellRow>
      <Cell label="Distance"  value={ms.total_km}      unit="km"   />
      <Cell label="Avg speed" value={ms.avg_speed_kmh} unit="km/h" />
    </CellRow>
  );

  return (
    <CellGrid2x2>
      <Cell label="Distance"   value={ms.total_km}      unit="km"   />
      <Cell label="Avg speed"  value={ms.avg_speed_kmh} unit="km/h" />
      <Cell label="Drives"     value={ms.drives_count}              />
      <Cell label="Drive time" value={timeStr}                      />
    </CellGrid2x2>
  );
}

function SkeletonCells({ size }) {
  const n = size === 'small' ? 1 : size === 'medium' ? 2 : 4;
  return (
    <div className={`grid gap-2 ${n > 1 ? 'grid-cols-2' : ''}`}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="bg-muted rounded-lg min-h-[80px] animate-pulse" />
      ))}
    </div>
  );
}
