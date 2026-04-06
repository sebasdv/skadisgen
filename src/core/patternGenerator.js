const SLOT_W    = 5;
const SLOT_H    = 10;
const SLOT_RX   = 2.5;
const GRID_STEP = 20;
const MARGIN    = 37.5; // first slot center at 40mm from edge → origin at 40 - w/2 = 37.5

export function generatePattern({ width, height }) {
  const slots = [];

  // First center at 40mm from each edge, step 20mm
  const startCX = 40;
  const startCY = 40;

  for (let cx = startCX; cx <= width - startCX + 0.001; cx += GRID_STEP) {
    for (let cy = startCY; cy <= height - startCY + 0.001; cy += GRID_STEP) {
      const x = cx - SLOT_W / 2;
      const y = cy - SLOT_H / 2;
      slots.push({ x, y, w: SLOT_W, h: SLOT_H, rx: SLOT_RX });
    }
  }

  return slots;
}

export function computeStats(slots, width, height) {
  const startCX = 40;
  const startCY = 40;

  let cols = 0, rows = 0;
  for (let cx = startCX; cx <= width  - startCX + 0.001; cx += GRID_STEP) cols++;
  for (let cy = startCY; cy <= height - startCY + 0.001; cy += GRID_STEP) rows++;

  return {
    totalSlots: slots.length,
    cols,
    rows,
  };
}
