import React from 'react';
import Cell, { CellRow, CellGrid2x2, tempColor, tempBar } from '../Cell.jsx';

export default function ClimateWidget({ data, size = 'medium' }) {
  if (!data) return <SkeletonCells size={size} />;

  const out       = data.outside_temp;
  const inn       = data.inside_temp;
  const climateOn = data.is_climate_on;
  const tMin      = data.outside_temp_min;
  const tMax      = data.outside_temp_max;

  const fmt = v => v != null ? v + '°' : null;

  if (size === 'small') return (
    <Cell label="Outside" value={fmt(out)} bar={tempBar(out)} barColor={tempColor(out)} />
  );

  if (size === 'medium') return (
    <CellRow>
      <Cell label="Outside"                  value={fmt(out)} bar={tempBar(out)} barColor={tempColor(out)} />
      <Cell label={climateOn ? 'Inside ❄' : 'Inside'} value={fmt(inn)} bar={tempBar(inn)} barColor={tempColor(inn)} />
    </CellRow>
  );

  return (
    <CellGrid2x2>
      <Cell label="Outside"                  value={fmt(out)} bar={tempBar(out)} barColor={tempColor(out)} />
      <Cell label={climateOn ? 'Inside ❄' : 'Inside'} value={fmt(inn)} bar={tempBar(inn)} barColor={tempColor(inn)} />
      <Cell label="Min today"  value={fmt(tMin)} bar={tempBar(tMin)} barColor={tempColor(tMin)} />
      <Cell label="Max today"  value={fmt(tMax)} bar={tempBar(tMax)} barColor={tempColor(tMax)} />
    </CellGrid2x2>
  );
}

function SkeletonCells({ size }) {
  const n = size === 'small' ? 1 : 2;
  return (
    <div className={`grid gap-2 ${n > 1 ? 'grid-cols-2' : ''}`}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="bg-muted rounded-lg min-h-[80px] animate-pulse" />
      ))}
    </div>
  );
}
