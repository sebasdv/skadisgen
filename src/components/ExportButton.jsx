import { useState } from 'react';
import { downloadDXF } from '../core/dxfExporter';
import { useLang } from '../LangContext';

export default function ExportButton({ slots, width, height }) {
  const [confirmed, setConfirmed] = useState(false);
  const { t } = useLang();

  const handleClick = () => {
    downloadDXF(slots, width, height);
    setConfirmed(true);
    setTimeout(() => setConfirmed(false), 2000);
  };

  return (
    <button
      className="export-btn"
      onClick={handleClick}
      disabled={slots.length === 0}
    >
      {confirmed ? t.downloaded : t.exportBtn}
    </button>
  );
}
