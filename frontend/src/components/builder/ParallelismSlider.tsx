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
    <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-6 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col gap-6">
      <h3 className="text-[16px] font-semibold text-notion-text dark:text-notionDark-text">Parallelism Tradeoff</h3>
      
      <div className="flex flex-col gap-5">
         <div className="flex justify-between items-center bg-[#f7f7f5] dark:bg-[#202020] border border-notion-border dark:border-notionDark-border rounded p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide">Latency</span>
              <span className="text-[20px] font-bold text-notion-text dark:text-notionDark-text mt-1">{metrics?.latency_us.toFixed(2) || 0} µs</span>
            </div>
            <div className="h-8 w-px bg-notion-border dark:bg-notionDark-border"></div>
            <div className="flex flex-col text-right">
              <span className="text-[12px] font-semibold text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide">LUTs Used</span>
              <span className="text-[20px] font-bold text-notion-text dark:text-notionDark-text mt-1">{metrics?.luts || 0}</span>
            </div>
         </div>

         <div className="relative pt-6 pb-2">
            <span className="absolute text-[11px] font-semibold text-notion-text dark:text-notionDark-text bg-white dark:bg-[#2f2f2f] border border-notion-border dark:border-notionDark-border shadow-sm rounded px-1.5 py-0.5 pointer-events-none" style={{ left: `calc(${Math.log2(value)/4 * 100}% - 14px)`, top: 0 }}>
              {value}x
            </span>
            <input 
              type="range" 
              min="0" 
              max="4" 
              step="1" 
              value={Math.log2(value)} 
              onChange={(e) => setValue(Math.pow(2, parseInt(e.target.value)))}
              className="w-full h-[6px] bg-notion-border dark:bg-notionDark-border rounded appearance-none cursor-pointer accent-[#2eaadc]" 
            />
            <div className="flex justify-between text-[12px] text-notion-textSecondary dark:text-notionDark-textSecondary mt-2 px-1">
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
