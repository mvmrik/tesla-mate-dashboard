import React from 'react';
import Cell, { CellRow, tempColor, tempBar } from '../Cell.jsx';

export default function ClimateWidget({ data, size = 'medium' }) {
  if (!data) return <SkeletonCells size={size} />;

  const out       = data.outside_temp;
  const inn       = data.inside_temp;
  const climateOn = data.is_climate_on;

  if (size === 'small') return (
    <Cell label="Outside" value={out != null ? out + '°' : null}
          bar={tempBar(out)} barColor={tempColor(out)} />
  );

  // medium and large both show outside + inside
  return (
    <CellRow>
      <Cell label="Outside" value={out != null ? out + '°' : null}
            bar={tempBar(out)} barColor={tempColor(out)} />
      <Cell label={climateOn ? 'Inside ❄' : 'Inside'} value={inn != null ? inn + '°' : null}
            bar={tempBar(inn)} barColor={tempColor(inn)} />
    </CellRow>
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
