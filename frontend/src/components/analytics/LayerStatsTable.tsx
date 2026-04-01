import { useSimulatorStore } from '../../store/useSimulatorStore';
import { Badge } from '../shared/Badge';

export function LayerStatsTable() {
  const { result } = useSimulatorStore();
  
  if (!result || result.layers.length === 0) return null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-sm overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-indigo-500/10">
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider pl-6">Layer</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">MACs</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Params</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">LUTs</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">DSPs</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">BRAMs</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Lat (µs)</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 text-right">Bound</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {result.layers.map((l, i) => (
            <tr key={`${l.name}-${i}`} className="hover:bg-indigo-500/5 transition-colors">
              <td className="px-4 py-4 text-sm font-semibold text-slate-100 pl-6 whitespace-nowrap">{l.name}</td>
              <td className="px-4 py-4"><Badge variant={l.type}>{l.type}</Badge></td>
              <td className="px-4 py-4 text-sm text-right font-mono text-slate-100">{l.macs.toLocaleString()}</td>
              <td className="px-4 py-4 text-sm text-right font-mono text-slate-100">{l.parameters.toLocaleString()}</td>
              <td className="px-4 py-4 text-sm text-right font-mono text-slate-100">{l.luts.toLocaleString()}</td>
              <td className="px-4 py-4 text-sm text-right font-mono text-slate-100">{l.dsps.toLocaleString()}</td>
              <td className="px-4 py-4 text-sm text-right font-mono text-slate-100">{l.brams.toLocaleString()}</td>
              <td className="px-4 py-4 text-sm text-right font-mono text-slate-100">{l.latency_us.toFixed(2)}</td>
              <td className="px-4 py-4 pr-6 text-right font-mono"><Badge variant={l.roofline_bound === 'compute' ? 'compute_bound' : 'memory_bound'}>{l.roofline_bound}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
