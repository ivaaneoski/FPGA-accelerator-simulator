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
    latencyNorm: (cfg.result.total.latency_us / maxLatency) * 100,
    throughputNorm: (cfg.result.total.throughput_inf_per_sec / maxTp) * 100,
  }));

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] mx-auto w-full p-6 md:p-10 animate-fade-in">
      <div className="border-b border-notion-border dark:border-notionDark-border pb-4 mb-2">
         <h1 className="text-[28px] font-bold text-notion-text dark:text-notionDark-text tracking-tight">Comparison</h1>
      </div>
      
      {radarConfigs.length > 0 && (
         <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-6 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] w-full max-w-[800px] mx-auto">
           <h3 className="text-[16px] font-semibold text-notion-text dark:text-notionDark-text mb-6 text-center">Config Radar (Recent 3)</h3>
           <ConfigRadarChart configs={radarConfigs} />
         </div>
      )}

      <div>
        <h3 className="text-[16px] font-semibold text-notion-text dark:text-notionDark-text mb-4">Saved Configurations</h3>
        <ComparisonTable />
      </div>
    </div>
  );
}
