const SLOT_W = 5;
const SLOT_H = 15;
const SLOT_RX = 2.5;
const GRID_STEP = 40;
const OFFSET = 20;
const MARGIN = 20;

function gridOrigin(width, height) {
  const usableW = width - 2 * MARGIN;
  const usableH = height - 2 * MARGIN;

  const colsA = Math.floor((usableW - SLOT_W) / GRID_STEP) + 1;
  const rowsA = Math.floor((usableH - SLOT_H) / GRID_STEP) + 1;

  const spanAx = (colsA - 1) * GRID_STEP + SLOT_W;
  const spanAy = (rowsA - 1) * GRID_STEP + SLOT_H;

  // Center grid A within usable area
  const ox = MARGIN + (usableW - spanAx) / 2;
  const oy = MARGIN + (usableH - spanAy) / 2;

  return { ox, oy, colsA, rowsA };
}

export function generatePattern({ width, height }) {
  const slots = [];
  const { ox, oy, colsA, rowsA } = gridOrigin(width, height);

  // Grid A
  for (let c = 0; c < colsA; c++) {
    for (let r = 0; r < rowsA; r++) {
      slots.push({ x: ox + c * GRID_STEP, y: oy + r * GRID_STEP, w: SLOT_W, h: SLOT_H, rx: SLOT_RX });
    }
  }

  // Grid B: origin = A + (OFFSET, OFFSET), include only slots fully within board
  const oxB = ox + OFFSET;
  const oyB = oy + OFFSET;
  const usableRight = width - MARGIN;
  const usableBottom = height - MARGIN;

  for (let x = oxB; x + SLOT_W <= usableRight; x += GRID_STEP) {
    for (let y = oyB; y + SLOT_H <= usableBottom; y += GRID_STEP) {
      slots.push({ x, y, w: SLOT_W, h: SLOT_H, rx: SLOT_RX });
    }
  }

  return slots;
}

export function computeStats(slots, width, height) {
  const { ox, oy, colsA, rowsA } = gridOrigin(width, height);
  const oxB = ox + OFFSET;
  const oyB = oy + OFFSET;
  const usableRight = width - MARGIN;
  const usableBottom = height - MARGIN;

  let colsB = 0, rowsB = 0;
  for (let x = oxB; x + SLOT_W <= usableRight; x += GRID_STEP) colsB++;
  for (let y = oyB; y + SLOT_H <= usableBottom; y += GRID_STEP) rowsB++;

  return {
    totalSlots: slots.length,
    colsA,
    colsB,
    rowsA,
    rowsB,
  };
}
