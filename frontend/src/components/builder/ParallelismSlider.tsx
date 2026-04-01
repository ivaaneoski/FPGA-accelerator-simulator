import { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useSimulatorStore } from '../../store/useSimulatorStore';

export function ParallelismSlider({ layerId }: { layerId: string | null }) {
  const { layers, updateLayer, result } = useSimulatorStore();
  const layer = layers.find(l => l.id === layerId);
  
  const [value, setValue] = useState(layer?.parallelismFactor || 1);
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
     if (layer && layer.parallelismFactor !== value) {
         setValue(layer.parallelismFactor);
     }
  }, [layer]);

  useEffect(() => {
    if (layerId && debouncedValue && layer && debouncedValue !== layer.parallelismFactor) {
      updateLayer(layerId, { parallelismFactor: debouncedValue });
    }
  }, [debouncedValue, layerId, updateLayer]);

  if (!layer) return null;
  const metrics = result?.layers.find(l => l.name === layer.name);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm mb-6">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">Parallelism Tradeoff</h3>
      
      <div className="flex flex-col gap-6">
         <div className="flex justify-between items-center bg-slate-900 border border-slate-700 rounded-lg p-4">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-400">Latency</span>
              <span className="text-2xl font-bold text-slate-100">{metrics?.latency_us.toFixed(2) || 0} µs</span>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-400">LUTs Used</span>
              <span className="text-2xl font-bold text-slate-100">{metrics?.luts || 0}</span>
            </div>
         </div>

         <div className="relative pt-6 pb-2">
            <span className="absolute text-[10px] text-slate-100 bg-slate-700 rounded px-2 py-0.5" style={{ left: `calc(${Math.log2(value)/4 * 100}% - 14px)`, top: 0 }}>
              {value}x
            </span>
            <input 
              type="range" 
              min="0" 
              max="4" 
              step="1" 
              value={Math.log2(value)} 
              onChange={(e) => setValue(Math.pow(2, parseInt(e.target.value)))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2 px-1">
              <span>1x</span>
              <span>2x</span>
              <span>4x</span>
              <span>8x</span>
              <span>16x</span>
            </div>
         </div>
      </div>
    </div>
  );
}
