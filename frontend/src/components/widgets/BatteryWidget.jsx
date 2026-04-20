import React from 'react';
import Cell, { CellRow, CellGrid2x2, batteryColor } from '../Cell.jsx';

export default function BatteryWidget({ data, size = 'medium' }) {
  if (!data) return <SkeletonCells size={size} />;

  const pct   = data.battery_level ?? 0;
  const color = batteryColor(pct);
  const bar   = pct;

  if (size === 'small') return (
    <Cell label="Battery" value={pct} unit="%" bar={bar} barColor={color} />
  );

  if (size === 'medium') return (
    <CellRow>
      <Cell label="Battery" value={pct} unit="%" bar={bar} barColor={color} />
      <Cell label="Range"   value={data.rated_range_km} unit="km" />
    </CellRow>
  );

  // large — M top row + last charge bottom row
  return (
    <CellGrid2x2>
      <Cell label="Battery" value={pct} unit="%" bar={bar} barColor={color} />
      <Cell label="Range"   value={data.rated_range_km} unit="km" />
      <Cell label="Last charge" value={data.last_charge_end_pct} unit="%" />
      <Cell label="Last added"  value={data.last_charge_kwh}     unit="kWh" />
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
