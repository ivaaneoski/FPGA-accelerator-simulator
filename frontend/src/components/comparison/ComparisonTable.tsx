import { Trash2, Play } from 'lucide-react';
import { isValidSavedConfig, useSimulatorStore } from '../../store/useSimulatorStore';
import { cn } from '../shared/Badge';
import { fmtInt, fmtLatency, fmtThroughput } from '../../utils/formatters';

export function ComparisonTable() {
  const { savedConfigs, loadConfig, deleteConfig } = useSimulatorStore();
  const validConfigs = savedConfigs.filter(isValidSavedConfig);

  if (!validConfigs.length) {
    return (
      <div className="bg-[#f7f7f5] dark:bg-[#202020] border border-notion-border dark:border-notionDark-border rounded p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
        <p className="text-[13px] text-notion-textSecondary dark:text-notionDark-textSecondary">No saved configurations. Save a configuration from the Simulator page to compare.</p>
      </div>
    );
  }

  // Find best values for highlighting
  const minLUTs = Math.min(...validConfigs.map(c => c.result.total.luts));
  const minDSPs = Math.min(...validConfigs.map(c => c.result.total.dsps));
  const minBRAMs = Math.min(...validConfigs.map(c => c.result.total.brams));
  const minLat = Math.min(...validConfigs.map(c => c.result.total.latency_us));
  const maxTp = Math.max(...validConfigs.map(c => c.result.total.throughput_inf_per_sec));

  return (
    <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-x-auto hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#f7f7f5] dark:bg-[#202020] border-b border-notion-border dark:border-notionDark-border">
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide pl-6">Config Name</th>
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide text-right">Layers</th>
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide text-right">LUTs</th>
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide text-right">DSPs</th>
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide text-right">BRAMs</th>
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide text-right">Lat (µs)</th>
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide text-right">TP (inf/s)</th>
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide pr-6 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-notion-border dark:divide-notionDark-border">
          {validConfigs.map((cfg) => {
            const r = cfg.result.total;
            return (
              <tr key={cfg.id} className="hover:bg-notion-bgHover dark:hover:bg-notionDark-bgHover transition-colors">
                <td className="px-4 py-3 text-[13px] font-medium text-notion-text dark:text-notionDark-text pl-6">{cfg.name}</td>
                <td className="px-4 py-3 text-[13px] text-notion-textSecondary dark:text-notionDark-textSecondary text-right">{cfg.layers.length}</td>
                <td className={cn("px-4 py-3 text-[13px] text-right font-mono", r.luts === minLUTs ? 'text-[#0F7B6C] font-semibold' : 'text-notion-text dark:text-notionDark-text')}>~{fmtInt(r.luts)}</td>
                <td className={cn("px-4 py-3 text-[13px] text-right font-mono", r.dsps === minDSPs ? 'text-[#0F7B6C] font-semibold' : 'text-notion-text dark:text-notionDark-text')}>~{fmtInt(r.dsps)}</td>
                <td className={cn("px-4 py-3 text-[13px] text-right font-mono", r.brams === minBRAMs ? 'text-[#0F7B6C] font-semibold' : 'text-notion-text dark:text-notionDark-text')}>~{fmtInt(r.brams)}</td>
                <td className={cn("px-4 py-3 text-[13px] text-right font-mono", r.latency_us === minLat ? 'text-[#0F7B6C] font-semibold' : 'text-notion-text dark:text-notionDark-text')}>~{fmtLatency(r.latency_us)}</td>
                <td className={cn("px-4 py-3 text-[13px] text-right font-mono", r.throughput_inf_per_sec === maxTp ? 'text-[#0F7B6C] font-semibold' : 'text-notion-text dark:text-notionDark-text')}>~{fmtThroughput(r.throughput_inf_per_sec)}</td>
                <td className="px-4 py-3 pr-6">
                  <div className="flex items-center justify-center gap-1.5">
                    <button onClick={() => loadConfig(cfg.id)} className="notion-icon-btn text-[#0B6E99] hover:bg-blue-500/10" title="Load Configuration">
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteConfig(cfg.id)} className="notion-icon-btn text-[#E03E3E] dark:text-[#DF5452] hover:bg-red-500/10" title="Delete Configuration">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
