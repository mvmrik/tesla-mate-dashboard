import React from 'react';
import Cell, { CellRow, CellGrid2x2 } from '../Cell.jsx';

export default function MonthlyConsumptionWidget({ data, size = 'medium' }) {
  if (!data) return <SkeletonCells size={size} />;

  const ms = data.month_stats;
  if (!ms || (!ms.avg_kwh_per_100km && !ms.total_kwh))
    return <p className="text-sm text-dim">No data this month yet</p>;

  if (size === 'small') return (
    <Cell label="Consumption" value={ms.avg_kwh_per_100km} unit="kWh/100" />
  );

  if (size === 'medium') return (
    <CellRow>
      <Cell label="kWh / 100km"    value={ms.avg_kwh_per_100km} unit="kWh" />
      <Cell label="Total charged"  value={ms.total_kwh}         unit="kWh" />
    </CellRow>
  );

  return (
    <CellGrid2x2>
      <Cell label="kWh / 100km"    value={ms.avg_kwh_per_100km} unit="kWh"  />
      <Cell label="Total charged"  value={ms.total_kwh}         unit="kWh"  />
      <Cell label="Charges"        value={ms.charge_count}                  />
      <Cell label="Avg charge"     value={ms.avg_charge_kw}     unit="kW"   />
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
