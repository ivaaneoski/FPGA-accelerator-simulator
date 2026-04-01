import { useEffect, useState } from 'react';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { estimateLayers } from '../../api/estimator';
import type { EstimationResult } from '../../types';
import { cn } from '../shared/Badge';

export function PrecisionComparator() {
  const { layers, selectedFPGA, clockMhz } = useSimulatorStore();
  const [data, setData] = useState<{ fp32: EstimationResult | null, int8: EstimationResult | null, int4: EstimationResult | null }>({
    fp32: null, int8: null, int4: null
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchComparisons() {
      if (!layers.length) return;
      setIsLoading(true);
      
      const fetchPrec = async (prec: 'fp32' | 'int8' | 'int4') => {
         const newLayers = layers.map(l => ({...l, precision: prec}));
         return estimateLayers({ layers: newLayers, clock_mhz: clockMhz, fpga_target: selectedFPGA.id });
      };

      try {
        const [fp32, int8, int4] = await Promise.all([
           fetchPrec('fp32'), fetchPrec('int8'), fetchPrec('int4')
        ]);
        setData({ fp32, int8, int4 });
      } catch (err) {
        console.error(err);
      }
      setIsLoading(false);
    }
    fetchComparisons();
  }, [layers, clockMhz, selectedFPGA.id]);

  if (!layers.length) return null;

  const renderCell = (prec: 'fp32' | 'int8' | 'int4', renderFn: (res: EstimationResult) => string | number) => {
     const isCurrent = layers.some(l => l.precision === prec); // simple check
     const val = data[prec] ? renderFn(data[prec]) : 'N/A';
     return (
       <td className={cn("px-4 py-3 text-sm text-right font-mono border-b border-slate-700", isCurrent ? 'text-indigo-400 font-semibold' : 'text-slate-100')}>
         {val}
       </td>
     );
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm overflow-x-auto">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">Precision Comparator</h3>
      {isLoading ? (
         <div className="h-48 skeleton rounded-lg" />
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-indigo-500/10">
              <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left rounded-tl-lg">Metric</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">FP32</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">INT8</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right rounded-tr-lg">INT4</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-indigo-500/5 transition-colors">
              <td className="px-4 py-3 text-sm text-slate-100 border-b border-slate-700">LUTs</td>
              {renderCell('fp32', r => r.total.luts.toLocaleString())}
              {renderCell('int8', r => r.total.luts.toLocaleString())}
              {renderCell('int4', r => r.total.luts.toLocaleString())}
            </tr>
            <tr className="bg-white/5 hover:bg-indigo-500/5 transition-colors">
              <td className="px-4 py-3 text-sm text-slate-100 border-b border-slate-700">DSPs</td>
              {renderCell('fp32', r => r.total.dsps.toLocaleString())}
              {renderCell('int8', r => r.total.dsps.toLocaleString())}
              {renderCell('int4', r => r.total.dsps.toLocaleString())}
            </tr>
            <tr className="hover:bg-indigo-500/5 transition-colors">
              <td className="px-4 py-3 text-sm text-slate-100 border-b border-slate-700">BRAMs</td>
              {renderCell('fp32', r => r.total.brams.toLocaleString())}
              {renderCell('int8', r => r.total.brams.toLocaleString())}
              {renderCell('int4', r => r.total.brams.toLocaleString())}
            </tr>
            <tr className="bg-white/5 hover:bg-indigo-500/5 transition-colors">
              <td className="px-4 py-3 text-sm text-slate-100 border-b border-slate-700">Latency (µs)</td>
              {renderCell('fp32', r => r.total.latency_us.toFixed(2))}
              {renderCell('int8', r => r.total.latency_us.toFixed(2))}
              {renderCell('int4', r => r.total.latency_us.toFixed(2))}
            </tr>
            <tr className="hover:bg-indigo-500/5 transition-colors">
              <td className="px-4 py-3 text-sm text-slate-100 border-b border-slate-700">Throughput (inf/s)</td>
              {renderCell('fp32', r => r.total.throughput_inf_per_sec.toLocaleString())}
              {renderCell('int8', r => r.total.throughput_inf_per_sec.toLocaleString())}
              {renderCell('int4', r => r.total.throughput_inf_per_sec.toLocaleString())}
            </tr>
            <tr className="bg-white/5 hover:bg-indigo-500/5 transition-colors">
              <td className="px-4 py-3 text-sm text-slate-100 border-b border-slate-700">Estimated Accuracy Loss</td>
              <td className="px-4 py-3 text-sm text-right font-mono border-b border-slate-700 text-slate-100">0%</td>
              <td className="px-4 py-3 text-sm text-right font-mono border-b border-slate-700 text-slate-100">~0.5%</td>
              <td className="px-4 py-3 text-sm text-right font-mono border-b border-slate-700 text-slate-100">~2-4%</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
