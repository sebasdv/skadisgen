import { useState, useMemo } from 'react';
import { generatePattern, computeStats } from '../core/patternGenerator';

const MIN = 100;
const MAX = 2000;
const GRID = 40;

const snapAndClamp = (v) => {
  const n = Number(v);
  if (isNaN(n)) return null;
  const snapped = Math.round(n / GRID) * GRID;
  return Math.min(MAX, Math.max(MIN, snapped));
};

export function useBoardState() {
  const [width, setWidthRaw] = useState(360);
  const [height, setHeightRaw] = useState(560);

  const setWidth = (v) => {
    const result = snapAndClamp(v);
    if (result !== null) setWidthRaw(result);
  };

  const setHeight = (v) => {
    const result = snapAndClamp(v);
    if (result !== null) setHeightRaw(result);
  };

  const slots = useMemo(() => generatePattern({ width, height }), [width, height]);
  const stats = useMemo(() => computeStats(slots, width, height), [slots, width, height]);

  return { width, height, setWidth, setHeight, slots, stats };
}
