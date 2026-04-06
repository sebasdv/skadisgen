import { useState, useEffect, useRef } from 'react';
import ExportButton from './ExportButton';

export default function ControlPanel({ width, height, setWidth, setHeight, slots, stats }) {
  const [localWidth, setLocalWidth] = useState(String(width));
  const [localHeight, setLocalHeight] = useState(String(height));
  const widthInputRef = useRef(null);
  const heightInputRef = useRef(null);

  useEffect(() => {
    if (document.activeElement !== widthInputRef.current) setLocalWidth(String(width));
  }, [width]);

  useEffect(() => {
    if (document.activeElement !== heightInputRef.current) setLocalHeight(String(height));
  }, [height]);

  const commitWidth = () => setWidth(localWidth);
  const commitHeight = () => setHeight(localHeight);

  return (
    <aside className="control-panel">
      <div className="panel-logo">SKADIS<span>GEN</span></div>

      <section className="panel-section">
        <h2 className="section-title">Dimensiones</h2>
        <label className="field">
          <span className="field-label">Ancho (mm)</span>
          <input
            ref={widthInputRef}
            type="number"
            min={100}
            max={2000}
            value={localWidth}
            onChange={(e) => setLocalWidth(e.target.value)}
            onBlur={commitWidth}
            onKeyDown={(e) => { if (e.key === 'Enter') { commitWidth(); e.target.blur(); } }}
            className="field-input"
          />
        </label>
        <label className="field">
          <span className="field-label">Alto (mm)</span>
          <input
            ref={heightInputRef}
            type="number"
            min={100}
            max={2000}
            value={localHeight}
            onChange={(e) => setLocalHeight(e.target.value)}
            onBlur={commitHeight}
            onKeyDown={(e) => { if (e.key === 'Enter') { commitHeight(); e.target.blur(); } }}
            className="field-input"
          />
        </label>
      </section>

      <section className="panel-section">
        <h2 className="section-title">Información</h2>
        <div className="stat-row">
          <span className="stat-label">Total ranuras</span>
          <span className="stat-value">{stats.totalSlots}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Cols A / B</span>
          <span className="stat-value">{stats.colsA} / {stats.colsB}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Filas A / B</span>
          <span className="stat-value">{stats.rowsA} / {stats.rowsB}</span>
        </div>
      </section>

      <section className="panel-section">
        <h2 className="section-title">Exportar</h2>
        <ExportButton slots={slots} width={width} height={height} />
      </section>
    </aside>
  );
}
