import { useState, useEffect, useRef } from 'react';
import ExportButton from './ExportButton';
import { useLang } from '../LangContext';

export default function ControlPanel({ width, height, setWidth, setHeight, slots, stats, panelOpen, onClose }) {
  const [localWidth, setLocalWidth] = useState(String(width));
  const [localHeight, setLocalHeight] = useState(String(height));
  const widthInputRef = useRef(null);
  const heightInputRef = useRef(null);
  const { t } = useLang();

  useEffect(() => {
    if (document.activeElement !== widthInputRef.current) setLocalWidth(String(width));
  }, [width]);

  useEffect(() => {
    if (document.activeElement !== heightInputRef.current) setLocalHeight(String(height));
  }, [height]);

  const commitWidth = () => setWidth(localWidth);
  const commitHeight = () => setHeight(localHeight);

  return (
    <aside className={`control-panel${panelOpen ? ' is-open' : ''}`}>
      <section className="panel-section">
        <h2 className="section-title">{t.dimensions}</h2>
        <label className="field">
          <span className="field-label">{t.width}</span>
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
          <span className="field-label">{t.height}</span>
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
        <h2 className="section-title">{t.info}</h2>
        <div className="stat-row">
          <span className="stat-label">{t.totalSlots}</span>
          <span className="stat-value">{stats.totalSlots}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">{t.cols}</span>
          <span className="stat-value">{stats.colsA} / {stats.colsB}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">{t.rows}</span>
          <span className="stat-value">{stats.rowsA} / {stats.rowsB}</span>
        </div>
      </section>

      <section className="panel-section">
        <h2 className="section-title">{t.export}</h2>
        <ExportButton slots={slots} width={width} height={height} />
      </section>
    </aside>
  );
}
