import './App.css';
import ControlPanel from './components/ControlPanel';
import BoardPreview from './components/BoardPreview';
import { useBoardState } from './hooks/useBoardState';

export default function App() {
  const { width, height, setWidth, setHeight, slots, stats } = useBoardState();

  return (
    <div className="app">
      <ControlPanel
        width={width}
        height={height}
        setWidth={setWidth}
        setHeight={setHeight}
        slots={slots}
        stats={stats}
      />
      <BoardPreview width={width} height={height} slots={slots} />
    </div>
  );
}
