import { useState } from 'react';
import { useLang } from '../LangContext';

function HelpModal({ onClose }) {
  const { t } = useLang();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{t.helpTitle}</div>
        <div className="modal-content">

          <h3>{t.helpPatternTitle}</h3>
          <table className="help-table">
            <tbody>
              <tr><td>Slot size</td><td>5 × 10 mm</td></tr>
              <tr><td>Corner radius</td><td>2.5 mm</td></tr>
              <tr><td>Grid step</td><td>40 mm</td></tr>
              <tr><td>Grid B offset</td><td>+20 mm (X and Y)</td></tr>
              <tr><td>First slot center</td><td>40 mm from edge</td></tr>
              <tr><td>Board corner radius</td><td>9 mm</td></tr>
            </tbody>
          </table>

          <h3>{t.helpTipsTitle}</h3>
          <ul className="help-tips">
            <li>{t.helpTip1}</li>
            <li>{t.helpTip2}</li>
            <li>{t.helpTip3}</li>
          </ul>

          <a
            className="help-github"
            href="https://github.com/sebasdv/skadisgen"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.helpGithub} →
          </a>
        </div>
        <button className="modal-close-btn" onClick={onClose}>{t.helpClose}</button>
      </div>
    </div>
  );
}

export default function Header() {
  const { lang, t, toggle } = useLang();
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <header className="app-header">
        <div className="header-brand">SKADIS<span>GEN</span></div>
        <div className="header-actions">
          <button className="lang-toggle" onClick={toggle} title="Toggle language">
            {lang === 'en' ? 'ES' : 'EN'}
          </button>
          <button className="help-btn" onClick={() => setHelpOpen(true)} title={t.helpTitle}>
            ?
          </button>
        </div>
      </header>
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </>
  );
}
