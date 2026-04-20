import React from 'react';
import Cell, { CellRow, CellGrid2x2, tpmsColor, tpmsBar } from '../Cell.jsx';

function avg(...vals) {
  const valid = vals.filter(v => v != null);
  if (!valid.length) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length * 10) / 10;
}

export default function TpmsWidget({ data, size = 'medium' }) {
  if (!data) return <SkeletonCells size={size} />;

  const fl = data.tpms_pressure_fl != null ? parseFloat(data.tpms_pressure_fl) : null;
  const fr = data.tpms_pressure_fr != null ? parseFloat(data.tpms_pressure_fr) : null;
  const rl = data.tpms_pressure_rl != null ? parseFloat(data.tpms_pressure_rl) : null;
  const rr = data.tpms_pressure_rr != null ? parseFloat(data.tpms_pressure_rr) : null;

  const allAvg   = avg(fl, fr, rl, rr);
  const frontAvg = avg(fl, fr);
  const rearAvg  = avg(rl, rr);

  if (size === 'small') return (
    <Cell label="Tyres avg" value={allAvg != null ? allAvg.toFixed(1) : null} unit="bar"
          bar={tpmsBar(allAvg)} barColor={tpmsColor(allAvg)} />
  );

  if (size === 'medium') return (
    <CellRow>
      <Cell label="Front avg" value={frontAvg != null ? frontAvg.toFixed(1) : null} unit="bar"
            bar={tpmsBar(frontAvg)} barColor={tpmsColor(frontAvg)} />
      <Cell label="Rear avg"  value={rearAvg  != null ? rearAvg.toFixed(1)  : null} unit="bar"
            bar={tpmsBar(rearAvg)}  barColor={tpmsColor(rearAvg)} />
    </CellRow>
  );

  return (
    <CellGrid2x2>
      <Cell label="FL" value={fl != null ? fl.toFixed(1) : null} unit="bar" bar={tpmsBar(fl)} barColor={tpmsColor(fl)} />
      <Cell label="FR" value={fr != null ? fr.toFixed(1) : null} unit="bar" bar={tpmsBar(fr)} barColor={tpmsColor(fr)} />
      <Cell label="RL" value={rl != null ? rl.toFixed(1) : null} unit="bar" bar={tpmsBar(rl)} barColor={tpmsColor(rl)} />
      <Cell label="RR" value={rr != null ? rr.toFixed(1) : null} unit="bar" bar={tpmsBar(rr)} barColor={tpmsColor(rr)} />
    </CellGrid2x2>
  );
}

function SkeletonCells({ size }) {
  const n = size === 'small' ? 1 : size === 'large' ? 4 : 2;
  return (
    <div className={`grid gap-2 ${n > 1 ? 'grid-cols-2' : ''}`}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="bg-muted rounded-lg min-h-[80px] animate-pulse" />
      ))}
    </div>
  );
}
