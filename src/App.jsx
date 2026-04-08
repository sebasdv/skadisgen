import { useState } from 'react';
import './App.css';
import ControlPanel from './components/ControlPanel';
import BoardPreview from './components/BoardPreview';
import { useBoardState } from './hooks/useBoardState';

export default function App() {
  const { width, height, setWidth, setHeight, slots, stats } = useBoardState();
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="app">
      <ControlPanel
        width={width}
        height={height}
        setWidth={setWidth}
        setHeight={setHeight}
        slots={slots}
        stats={stats}
        panelOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
      />
      <BoardPreview width={width} height={height} slots={slots} />

      {/* Mobile FAB */}
      <button
        className="mobile-fab"
        onClick={() => setPanelOpen(o => !o)}
        aria-label="Settings"
      >
        ⚙
      </button>

      {/* Backdrop */}
      {panelOpen && (
        <div className="mobile-backdrop" onClick={() => setPanelOpen(false)} />
      )}
    </div>
  );
}
