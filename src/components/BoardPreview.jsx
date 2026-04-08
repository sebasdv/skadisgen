import { useRef, useState, useCallback, useEffect, memo } from 'react';
import BoardISOView from './BoardISOView';

const PADDING = 24;
const SCALE_BAR_MM = 40;

const Slot = memo(function Slot({ x, y, w, h, rx, scale }) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const lineH = h / 2 - rx;
  const path = [
    `M ${cx} ${cy - h / 2}`,
    `A ${rx} ${rx} 0 0 1 ${cx + rx} ${cy - lineH}`,
    `L ${cx + rx} ${cy + lineH}`,
    `A ${rx} ${rx} 0 0 1 ${cx} ${cy + h / 2}`,
    `A ${rx} ${rx} 0 0 1 ${cx - rx} ${cy + lineH}`,
    `L ${cx - rx} ${cy - lineH}`,
    `A ${rx} ${rx} 0 0 1 ${cx} ${cy - h / 2}`,
    'Z',
  ].join(' ');

  return (
    <path
      d={path}
      fill="#ffffff"
      stroke="#999"
      strokeWidth={1 / scale}
    />
  );
});

function BoardPreviewSVG({ width, height, slots }) {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      setContainerSize({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fitScale = Math.min(
    (containerSize.w - PADDING * 2) / width,
    (containerSize.h - PADDING * 2) / height
  );
  const scale = fitScale * zoom;
  const boardX = (containerSize.w - width * scale) / 2 + pan.x;
  const boardY = (containerSize.h - height * scale) / 2 + pan.y;

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    setZoom((z) => Math.min(10, Math.max(0.1, z * factor)));
  }, []);

  const handleMouseDown = useCallback((e) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  const handleMouseUp = useCallback(() => { dragging.current = false; }, []);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const scaleBarPx = SCALE_BAR_MM * scale;

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative', cursor: dragging.current ? 'grabbing' : 'grab' }}
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg width={containerSize.w} height={containerSize.h} style={{ display: 'block' }}>
        <rect x={boardX} y={boardY} width={width * scale} height={height * scale} rx={9 * scale} ry={9 * scale} fill="#e8e8e8" />
        <g transform={`translate(${boardX}, ${boardY}) scale(${scale})`}>
          {slots.map((slot, i) => <Slot key={i} {...slot} scale={scale} />)}
        </g>
        <g transform={`translate(${containerSize.w - scaleBarPx - 16}, ${containerSize.h - 28})`}>
          <line x1={0} y1={8} x2={scaleBarPx} y2={8} stroke="#aaa" strokeWidth={1.5} />
          <line x1={0} y1={4} x2={0} y2={12} stroke="#aaa" strokeWidth={1.5} />
          <line x1={scaleBarPx} y1={4} x2={scaleBarPx} y2={12} stroke="#aaa" strokeWidth={1.5} />
          <text x={scaleBarPx / 2} y={6} textAnchor="middle" fill="#aaa" fontSize={10} fontFamily="monospace">40 mm</text>
        </g>
      </svg>
      <button className="reset-btn" onClick={resetView} title="Reset zoom/pan">⊡ Reset</button>
    </div>
  );
}

export default function BoardPreview({ width, height, slots }) {
  const [mode, setMode] = useState('3d');

  return (
    <div className="board-preview">
      <div className="view-toggle">
        <button className={`view-toggle-btn ${mode === '2d' ? 'active' : ''}`} onClick={() => setMode('2d')}>2D</button>
        <button className={`view-toggle-btn ${mode === '3d' ? 'active' : ''}`} onClick={() => setMode('3d')}>3D</button>
      </div>
      {mode === '3d'
        ? <BoardISOView width={width} height={height} slots={slots} />
        : <BoardPreviewSVG width={width} height={height} slots={slots} />
      }
      <div className="dim-overlay">
        <span className="dim-label">Board</span>
        <div className="dim-row">
          <div className="dim-item">
            <span className="dim-label">Width</span>
            <span className="dim-value">{width} mm</span>
          </div>
          <div className="dim-item">
            <span className="dim-label">Height</span>
            <span className="dim-value">{height} mm</span>
          </div>
          <div className="dim-item">
            <span className="dim-label">Thickness</span>
            <span className="dim-value">5 mm</span>
          </div>
        </div>
      </div>
    </div>
  );
}
