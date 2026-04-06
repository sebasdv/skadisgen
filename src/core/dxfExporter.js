function dxfHeader(width, height) {
  return `  0\nSECTION\n  2\nHEADER\n  9\n$ACADVER\n  1\nAC1009\n  9\n$EXTMIN\n  10\n0.0\n  20\n0.0\n  9\n$EXTMAX\n  10\n${width}\n  20\n${height}\n  0\nENDSEC\n`;
}

function dxfTables() {
  return `  0\nSECTION\n  2\nTABLES\n  0\nTABLE\n  2\nLAYER\n  70\n2\n  0\nLAYER\n  2\nCONTORNO\n  70\n0\n  62\n7\n  6\nCONTINUOUS\n  0\nLAYER\n  2\nRANURAS\n  70\n0\n  62\n7\n  6\nCONTINUOUS\n  0\nENDTAB\n  0\nENDSEC\n`;
}

const CORNER_R = 9; // mm — radio de esquina del tablero SKADIS

function dxfContorno(width, height) {
  // Rounded rectangle as LWPOLYLINE with bulge arcs at corners (R=9mm)
  // 8 vertices: 4 straight segments + 4 quarter-circle arcs (bulge = tan(90°/4) = tan(22.5°) ≈ 0.41421)
  // Tracing CCW from bottom-left corner arc start:
  const r = CORNER_R;
  const bulge = Math.tan(Math.PI / 8).toFixed(6); // tan(22.5°) ≈ 0.414214
  const fmt = (n) => Number(n).toFixed(6);

  // Bottom side: left → right (Y=0)
  // Right side: bottom → top (X=width)
  // Top side: right → left (Y=height)
  // Left side: top → bottom (X=0)
  return [
    '  0', 'LWPOLYLINE',
    '  8', 'CONTORNO',
    ' 90', '8',   // 8 vertices
    ' 70', '1',   // closed
    // bottom-left arc end → bottom-right arc start (bottom edge, going right)
    ' 10', fmt(r),       ' 20', fmt(0),        ' 42', '0.0',
    // bottom-right corner arc (CCW quarter circle)
    ' 10', fmt(width-r), ' 20', fmt(0),        ' 42', bulge,
    // right side going up
    ' 10', fmt(width),   ' 20', fmt(r),        ' 42', '0.0',
    // top-right corner arc
    ' 10', fmt(width),   ' 20', fmt(height-r), ' 42', bulge,
    // top edge going left
    ' 10', fmt(width-r), ' 20', fmt(height),   ' 42', '0.0',
    // top-left corner arc
    ' 10', fmt(r),       ' 20', fmt(height),   ' 42', bulge,
    // left side going down
    ' 10', fmt(0),       ' 20', fmt(height-r), ' 42', '0.0',
    // bottom-left corner arc (closes back to first vertex)
    ' 10', fmt(0),       ' 20', fmt(r),        ' 42', bulge,
  ].join('\n');
}

// Build a single slot as LWPOLYLINE with bulge arcs.
// The slot is a stadium (oblong) shape: the long axis is vertical.
// w = 5 (horizontal), h = 10 (vertical), rx = 2.5
// Center at (cx, cy) in mm, with DXF Y = height - y_top - h/2 flipping applied.
function dxfSlot(slot, boardHeight) {
  const { x, y, w, h, rx } = slot;
  const cx = x + w / 2;
  // Flip Y for DXF (origin bottom-left)
  const cy = boardHeight - (y + h / 2);

  const halfW = w / 2;   // 2.5
  const halfH = h / 2;   // 7.5
  const lineH = halfH - rx; // 5.0 — half-length of the straight segments

  // Vertices (CCW):
  // 1. Bottom-left of straight segment (left side, bottom)
  // 2. Bottom-right of straight segment (right side, bottom)  — after bottom arc
  // 3. Top-right of straight segment (right side, top)
  // 4. Top-left of straight segment (left side, top)          — after top arc
  //
  // Bulge = tan(theta/4); semicircle = 180°, bulge = tan(45°) = 1.0
  // Bottom arc (from bottom-left to bottom-right going CW around bottom = bulge -1)
  // Wait — in DXF, bulge > 0 = CCW arc from vertex[i] to vertex[i+1]
  // For a stadium with vertical long axis:
  //   Start at bottom-left corner of center rect, go right (bottom arc CCW = bulge -1 for downward bulge)
  //   Actually let's trace CCW from bottom-left of the rect:
  //   P1 = (cx - halfW, cy - lineH)  → bottom-left
  //   Arc CCW bottom: P1 → P2 = (cx + halfW, cy - lineH), bulge = -1 (CW = convex downward)
  //   P2 → P3 = (cx + halfW, cy + lineH), straight line
  //   Arc CCW top: P3 → P4 = (cx - halfW, cy + lineH), bulge = -1 (CW = convex upward)
  //   P4 → P1, straight line

  const p1x = cx - halfW;
  const p1y = cy - lineH;
  const p2x = cx + halfW;
  const p2y = cy - lineH;
  const p3x = cx + halfW;
  const p3y = cy + lineH;
  const p4x = cx - halfW;
  const p4y = cy + lineH;

  const fmt = (n) => n.toFixed(6);

  return [
    '  0', 'LWPOLYLINE',
    '  8', 'RANURAS',
    ' 90', '4',
    ' 70', '1',
    // P1 with bulge to P2 (bottom semicircle, CCW = +1, bulges downward)
    ' 10', fmt(p1x), ' 20', fmt(p1y), ' 42', '1.0',
    // P2, no bulge to P3
    ' 10', fmt(p2x), ' 20', fmt(p2y), ' 42', '0.0',
    // P3 with bulge to P4 (top semicircle, CCW = +1, bulges upward)
    ' 10', fmt(p3x), ' 20', fmt(p3y), ' 42', '1.0',
    // P4, no bulge to P1
    ' 10', fmt(p4x), ' 20', fmt(p4y), ' 42', '0.0',
  ].join('\n');
}

export function generateDXF(slots, boardWidth, boardHeight) {
  const entities = [
    dxfContorno(boardWidth, boardHeight),
    ...slots.map((s) => dxfSlot(s, boardHeight)),
  ].join('\n  0\n');

  const dxf =
    dxfHeader(boardWidth, boardHeight) +
    dxfTables() +
    '  0\nSECTION\n  2\nENTITIES\n' +
    '  0\n' +
    entities +
    '\n  0\nENDSEC\n  0\nEOF\n';

  return dxf;
}

export function downloadDXF(slots, boardWidth, boardHeight) {
  const content = generateDXF(slots, boardWidth, boardHeight);
  const blob = new Blob([content], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `skadis_${boardWidth}x${boardHeight}mm.dxf`;
  a.click();
  URL.revokeObjectURL(url);
}
