import { Trash2, Play } from 'lucide-react';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { cn } from '../shared/Badge';

export function ComparisonTable() {
  const { savedConfigs, loadConfig, deleteConfig } = useSimulatorStore();

  if (!savedConfigs.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center shadow-sm">
        <p className="text-slate-400">No saved configurations. Save a configuration from the Simulator page to compare.</p>
      </div>
    );
  }

  // Find best values for highlighting
  const minLUTs = Math.min(...savedConfigs.map(c => c.result.total.luts));
  const minDSPs = Math.min(...savedConfigs.map(c => c.result.total.dsps));
  const minBRAMs = Math.min(...savedConfigs.map(c => c.result.total.brams));
  const minLat = Math.min(...savedConfigs.map(c => c.result.total.latency_us));
  const maxTp = Math.max(...savedConfigs.map(c => c.result.total.throughput_inf_per_sec));

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-sm overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-indigo-500/10">
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider pl-6">Config Name</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Layers</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">LUTs</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">DSPs</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">BRAMs</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Lat (µs)</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">TP (inf/s)</th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider pr-6 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {savedConfigs.map((cfg) => {
            const r = cfg.result.total;
            return (
              <tr key={cfg.id} className="hover:bg-indigo-500/5 transition-colors">
                <td className="px-4 py-4 text-sm font-semibold text-slate-100 pl-6">{cfg.name}</td>
                <td className="px-4 py-4 text-sm text-slate-100 text-right">{cfg.layers.length}</td>
                <td className={cn("px-4 py-4 text-sm text-right font-mono", r.luts === minLUTs ? 'text-green-500 font-bold' : 'text-slate-100')}>{r.luts.toLocaleString()}</td>
                <td className={cn("px-4 py-4 text-sm text-right font-mono", r.dsps === minDSPs ? 'text-green-500 font-bold' : 'text-slate-100')}>{r.dsps.toLocaleString()}</td>
                <td className={cn("px-4 py-4 text-sm text-right font-mono", r.brams === minBRAMs ? 'text-green-500 font-bold' : 'text-slate-100')}>{r.brams.toLocaleString()}</td>
                <td className={cn("px-4 py-4 text-sm text-right font-mono", r.latency_us === minLat ? 'text-green-500 font-bold' : 'text-slate-100')}>{r.latency_us.toFixed(2)}</td>
                <td className={cn("px-4 py-4 text-sm text-right font-mono", r.throughput_inf_per_sec === maxTp ? 'text-green-500 font-bold' : 'text-slate-100')}>{r.throughput_inf_per_sec.toLocaleString()}</td>
                <td className="px-4 py-4 pr-6">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => loadConfig(cfg.id)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded transition-colors" title="Load Configuration">
                      <Play className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteConfig(cfg.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded transition-colors" title="Delete Configuration">
                      <Trash2 className="w-4 h-4" />
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
