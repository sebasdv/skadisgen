import { useState } from 'react';
import { downloadDXF } from '../core/dxfExporter';

export default function ExportButton({ slots, width, height }) {
  const [confirmed, setConfirmed] = useState(false);

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
      {confirmed ? 'Descargado ✓' : 'Exportar DXF'}
    </button>
  );
}
