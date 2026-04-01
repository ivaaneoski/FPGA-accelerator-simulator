import { useSimulatorStore } from '../../store/useSimulatorStore';
import { Badge } from '../shared/Badge';

export function LayerStatsTable() {
  const { result } = useSimulatorStore();
  
  if (!result || result.layers.length === 0) return null;

  return (
    <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-x-auto mb-6">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#f7f7f5] dark:bg-[#202020] border-b border-notion-border dark:border-notionDark-border">
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide pl-6">Layer</th>
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide">Type</th>
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide text-right">MACs</th>
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide text-right">Params</th>
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide text-right">LUTs</th>
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide text-right">DSPs</th>
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide text-right">BRAMs</th>
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide text-right">Lat (µs)</th>
            <th className="px-4 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide px-6 text-right">Bound</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-notion-border dark:divide-notionDark-border">
          {result.layers.map((l, i) => (
            <tr key={`${l.name}-${i}`} className="hover:bg-notion-bgHover dark:hover:bg-notionDark-bgHover transition-colors group">
              <td className="px-4 py-3 text-[13px] font-medium text-notion-text dark:text-notionDark-text pl-6 whitespace-nowrap">{l.name}</td>
              <td className="px-4 py-3"><Badge variant={l.type}>{l.type === 'conv2d' ? 'Conv2D' : 'Dense'}</Badge></td>
              <td className="px-4 py-3 text-[13px] text-right font-mono text-notion-text dark:text-notionDark-text">{l.macs.toLocaleString()}</td>
              <td className="px-4 py-3 text-[13px] text-right font-mono text-notion-text dark:text-notionDark-text">{l.parameters.toLocaleString()}</td>
              <td className="px-4 py-3 text-[13px] text-right font-mono text-notion-text dark:text-notionDark-text">{l.luts.toLocaleString()}</td>
              <td className="px-4 py-3 text-[13px] text-right font-mono text-notion-text dark:text-notionDark-text">{l.dsps.toLocaleString()}</td>
              <td className="px-4 py-3 text-[13px] text-right font-mono text-notion-text dark:text-notionDark-text">{l.brams.toLocaleString()}</td>
              <td className="px-4 py-3 text-[13px] text-right font-mono text-notion-text dark:text-notionDark-text">{l.latency_us.toFixed(2)}</td>
              <td className="px-4 py-3 pr-6 text-right font-mono"><Badge variant={l.roofline_bound === 'compute' ? 'compute_bound' : 'memory_bound'}>{l.roofline_bound}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
