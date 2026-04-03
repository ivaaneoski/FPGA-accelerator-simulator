import { useEffect, useState, useRef } from 'react';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { estimateLayers } from '../../api/estimator';
import type { EstimationResult } from '../../types';
import { cn } from '../shared/Badge';
import { fmtInt, fmtLatency, fmtThroughput } from '../../utils/formatters';

export function PrecisionComparator() {
  const { layers, selectedFPGA, clockMhz } = useSimulatorStore();
  const [data, setData] = useState<{ fp32: EstimationResult | null, int8: EstimationResult | null, int4: EstimationResult | null }>({
    fp32: null, int8: null, int4: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Abort previous precision comparison requests
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    async function fetchComparisons() {
      if (!layers.length) return;
      setIsLoading(true);
      
      const fetchPrec = async (prec: 'fp32' | 'int8' | 'int4') => {
         const newLayers = layers.map(l => ({...l, precision: prec}));
         return estimateLayers(
           { layers: newLayers, clock_mhz: clockMhz, fpga_target: selectedFPGA.id },
           controller.signal
         );
      };

      try {
        const [fp32, int8, int4] = await Promise.all([
           fetchPrec('fp32'), fetchPrec('int8'), fetchPrec('int4')
        ]);
        if (!controller.signal.aborted) {
          setData({ fp32, int8, int4 });
        }
      } catch (err: any) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        console.error(err);
      }
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
    fetchComparisons();

    return () => { controller.abort(); };
  }, [layers, clockMhz, selectedFPGA.id]);

  if (!layers.length) return null;

  const renderCell = (prec: 'fp32' | 'int8' | 'int4', renderFn: (res: EstimationResult) => string | number) => {
     const isCurrent = layers.some(l => l.precision === prec);
     const val = data[prec] ? renderFn(data[prec]) : 'N/A';
     return (
       <td className={cn("px-4 py-3 text-[13px] text-right font-mono border-b border-notion-border dark:border-notionDark-border", isCurrent ? 'text-notion-tagBlueText dark:text-notionDark-tagBlueText font-semibold' : 'text-notion-text dark:text-notionDark-text')}>
         {val}
       </td>
     );
  };

  return (
    <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-6 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-x-auto hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <h3 className="text-[16px] font-semibold text-notion-text dark:text-notionDark-text mb-4">Precision Analysis</h3>
      {isLoading ? (
         <div className="h-48 skeleton rounded-lg" />
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f7f7f5] dark:bg-[#202020] border-y border-notion-border dark:border-notionDark-border">
              <th className="px-4 py-2.5 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary text-left">Metric</th>
              <th className="px-4 py-2.5 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary text-right">FP32</th>
              <th className="px-4 py-2.5 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary text-right">INT8</th>
              <th className="px-4 py-2.5 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary text-right">INT4</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-notion-bgHover dark:hover:bg-notionDark-bgHover transition-colors border-b border-notion-border dark:border-notionDark-border">
              <td className="px-4 py-3 text-[13px] text-notion-text dark:text-notionDark-text">LUTs</td>
              {renderCell('fp32', r => `~${fmtInt(r.total.luts)}`)}
              {renderCell('int8', r => `~${fmtInt(r.total.luts)}`)}
              {renderCell('int4', r => `~${fmtInt(r.total.luts)}`)}
            </tr>
            <tr className="bg-[rgba(55,53,47,0.01)] dark:bg-[rgba(255,255,255,0.01)] hover:bg-notion-bgHover dark:hover:bg-notionDark-bgHover transition-colors border-b border-notion-border dark:border-notionDark-border">
              <td className="px-4 py-3 text-[13px] text-notion-text dark:text-notionDark-text">DSPs</td>
              {renderCell('fp32', r => `~${fmtInt(r.total.dsps)}`)}
              {renderCell('int8', r => `~${fmtInt(r.total.dsps)}`)}
              {renderCell('int4', r => `~${fmtInt(r.total.dsps)}`)}
            </tr>
            <tr className="hover:bg-notion-bgHover dark:hover:bg-notionDark-bgHover transition-colors border-b border-notion-border dark:border-notionDark-border">
              <td className="px-4 py-3 text-[13px] text-notion-text dark:text-notionDark-text">BRAMs</td>
              {renderCell('fp32', r => `~${fmtInt(r.total.brams)}`)}
              {renderCell('int8', r => `~${fmtInt(r.total.brams)}`)}
              {renderCell('int4', r => `~${fmtInt(r.total.brams)}`)}
            </tr>
            <tr className="bg-[rgba(55,53,47,0.01)] dark:bg-[rgba(255,255,255,0.01)] hover:bg-notion-bgHover dark:hover:bg-notionDark-bgHover transition-colors border-b border-notion-border dark:border-notionDark-border">
              <td className="px-4 py-3 text-[13px] text-notion-text dark:text-notionDark-text">Latency</td>
              {renderCell('fp32', r => `~${fmtLatency(r.total.latency_us)}`)}
              {renderCell('int8', r => `~${fmtLatency(r.total.latency_us)}`)}
              {renderCell('int4', r => `~${fmtLatency(r.total.latency_us)}`)}
            </tr>
            <tr className="hover:bg-notion-bgHover dark:hover:bg-notionDark-bgHover transition-colors border-b border-notion-border dark:border-notionDark-border">
              <td className="px-4 py-3 text-[13px] text-notion-text dark:text-notionDark-text">Throughput</td>
              {renderCell('fp32', r => `~${fmtThroughput(r.total.throughput_inf_per_sec)}`)}
              {renderCell('int8', r => `~${fmtThroughput(r.total.throughput_inf_per_sec)}`)}
              {renderCell('int4', r => `~${fmtThroughput(r.total.throughput_inf_per_sec)}`)}
            </tr>
            <tr className="bg-[rgba(55,53,47,0.01)] dark:bg-[rgba(255,255,255,0.01)] hover:bg-notion-bgHover dark:hover:bg-notionDark-bgHover transition-colors border-b border-notion-border dark:border-notionDark-border">
              <td className="px-4 py-3 text-[13px] text-notion-text dark:text-notionDark-text">Estimated Accuracy Loss</td>
              <td className="px-4 py-3 text-[13px] text-right font-mono text-notion-text dark:text-notionDark-text">0%</td>
              <td className="px-4 py-3 text-[13px] text-right font-mono text-notion-text dark:text-notionDark-text">~0.5%</td>
              <td className="px-4 py-3 text-[13px] text-right font-mono text-notion-text dark:text-notionDark-text">~2-4%</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
