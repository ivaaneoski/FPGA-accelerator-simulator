import { useSimulatorStore } from '../store/useSimulatorStore';
import { ComparisonTable } from '../components/comparison/ComparisonTable';
import { ConfigRadarChart } from '../components/comparison/RadarChart';
import type { RadarConfig } from '../components/comparison/RadarChart';

export function ComparisonPage() {
  const { savedConfigs } = useSimulatorStore();

  const maxLatency = Math.max(...savedConfigs.map(c => c.result.total.latency_us), 1);
  const maxTp = Math.max(...savedConfigs.map(c => c.result.total.throughput_inf_per_sec), 1);

  const radarConfigs: RadarConfig[] = savedConfigs.slice(-3).map(cfg => ({
    name: cfg.name,
    lutPct: cfg.result.fpga_utilization.lut_pct,
    dspPct: cfg.result.fpga_utilization.dsp_pct,
    bramPct: cfg.result.fpga_utilization.bram_pct,
    latencyNorm: (cfg.result.total.latency_us / maxLatency) * 100, // lower latency is better, but this normalizes 0-100
    throughputNorm: (cfg.result.total.throughput_inf_per_sec / maxTp) * 100, // higher is better
  }));

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-[32px] font-bold text-slate-100">Comparison</h1>
      
      {radarConfigs.length > 0 && (
         <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
           <h3 className="text-xl font-semibold text-slate-100 mb-6 text-center">Config Radar (Recent 3)</h3>
           <ConfigRadarChart configs={radarConfigs} />
         </div>
      )}

      <div>
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Saved Configurations</h3>
        <ComparisonTable />
      </div>
    </div>
  );
}
