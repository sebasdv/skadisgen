// DXF R12 exporter using POLYLINE/VERTEX/SEQEND (native R12, compatible with Rhino & Illustrator)

const CORNER_R = 9;

function ln(code, value) {
  return `${String(code).padStart(3)}\n${value}\n`;
}

function dxfHeader(width, height) {
  return (
    ln(0, 'SECTION') + ln(2, 'HEADER') +
    ln(9, '$ACADVER') + ln(1, 'AC1009') +
    ln(9, '$EXTMIN') + ln(10, '0.0') + ln(20, '0.0') +
    ln(9, '$EXTMAX') + ln(10, width)  + ln(20, height) +
    ln(0, 'ENDSEC')
  );
}

function dxfTables() {
  return (
    ln(0, 'SECTION') + ln(2, 'TABLES') +
    ln(0, 'TABLE')   + ln(2, 'LAYER') + ln(70, '2') +
    ln(0, 'LAYER') + ln(2, 'CONTORNO') + ln(70, '0') + ln(62, '7') + ln(6, 'CONTINUOUS') +
    ln(0, 'LAYER') + ln(2, 'RANURAS')  + ln(70, '0') + ln(62, '7') + ln(6, 'CONTINUOUS') +
    ln(0, 'ENDTAB') +
    ln(0, 'ENDSEC')
  );
}

// POLYLINE entity with VERTEX nodes (R12 native)
function polyline(layer, closed, vertices) {
  // vertices: array of { x, y, bulge }
  const flag = closed ? '1' : '0';
  let s = ln(0, 'POLYLINE') + ln(8, layer) + ln(66, '1') + ln(70, flag) +
          ln(10, '0.0') + ln(20, '0.0') + ln(30, '0.0');
  for (const v of vertices) {
    s += ln(0, 'VERTEX') + ln(8, layer) +
         ln(10, v.x.toFixed(6)) + ln(20, v.y.toFixed(6)) + ln(30, '0.0');
    if (v.bulge !== 0) s += ln(42, v.bulge.toFixed(6));
  }
  s += ln(0, 'SEQEND') + ln(8, layer);
  return s;
}

function dxfContorno(width, height) {
  const r = CORNER_R;
  const b = Math.tan(Math.PI / 8); // tan(22.5°) ≈ 0.414214 — quarter-circle bulge
  return polyline('CONTORNO', true, [
    { x: r,         y: 0,          bulge: 0 },
    { x: width - r, y: 0,          bulge: b },
    { x: width,     y: r,          bulge: 0 },
    { x: width,     y: height - r, bulge: b },
    { x: width - r, y: height,     bulge: 0 },
    { x: r,         y: height,     bulge: b },
    { x: 0,         y: height - r, bulge: 0 },
    { x: 0,         y: r,          bulge: b },
  ]);
}

function dxfSlot(slot, boardHeight) {
  const { x, y, w, h, rx } = slot;
  const cx   = x + w / 2;
  const cy   = boardHeight - (y + h / 2); // flip Y for DXF origin
  const hw   = w / 2;
  const lineH = h / 2 - rx;
  return polyline('RANURAS', true, [
    { x: cx - hw, y: cy - lineH, bulge:  1 }, // bottom semicircle CCW
    { x: cx + hw, y: cy - lineH, bulge:  0 },
    { x: cx + hw, y: cy + lineH, bulge:  1 }, // top semicircle CCW
    { x: cx - hw, y: cy + lineH, bulge:  0 },
  ]);
}

export function generateDXF(slots, boardWidth, boardHeight) {
  let entities = dxfContorno(boardWidth, boardHeight);
  for (const s of slots) entities += dxfSlot(s, boardHeight);

  return (
    dxfHeader(boardWidth, boardHeight) +
    dxfTables() +
    ln(0, 'SECTION') + ln(2, 'ENTITIES') +
    entities +
    ln(0, 'ENDSEC') +
    ln(0, 'EOF')
  );
}

export function downloadDXF(slots, boardWidth, boardHeight) {
  const content = generateDXF(slots, boardWidth, boardHeight);
  const blob = new Blob([content], { type: 'application/dxf' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `skadis_${boardWidth}x${boardHeight}mm.dxf`;
  a.click();
  URL.revokeObjectURL(url);
}
