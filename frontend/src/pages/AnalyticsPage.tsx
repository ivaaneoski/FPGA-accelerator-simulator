import { useSimulatorStore } from '../store/useSimulatorStore';
import { RooflineChart } from '../components/analytics/RooflineChart';
import { EfficiencyScore } from '../components/analytics/EfficiencyScore';
import { LayerStatsTable } from '../components/analytics/LayerStatsTable';
import { FormulaProvenance } from '../components/analytics/FormulaProvenance';

export function AnalyticsPage() {
  const { result, selectedFPGA, clockMhz } = useSimulatorStore();

  const points = result?.layers.map(l => ({
    name: l.name,
    arithmeticIntensity: l.arithmetic_intensity,
    performance: (l.macs * 2) / (l.latency_us * 1000) || 0, // GOPs/s
    bound: l.roofline_bound as 'compute' | 'memory'
  })) || [];

  const computeRoof = (selectedFPGA.dsps * 2 * clockMhz) / 1000.0;
  const memoryRoof = 25.6;

  let score = 0;
  if (result) {
      const lutPct = result.fpga_utilization.lut_pct / 100;
      const dspPct = result.fpga_utilization.dsp_pct / 100;
      const tpNorm = Math.min(1, result.total.throughput_inf_per_sec / 10000);
      score = ((0.4 * (1 - lutPct)) + (0.3 * (1 - dspPct)) + (0.3 * tpNorm)) * 100;
      score = Math.max(0, Math.min(100, score));
  }

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] mx-auto w-full p-6 md:p-10 animate-fade-in">
      <div className="border-b border-notion-border dark:border-notionDark-border pb-4 mb-2">
         <h1 className="text-[28px] font-bold text-notion-text dark:text-notionDark-text tracking-tight">Analytics</h1>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-6 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
          <h3 className="text-[16px] font-semibold text-notion-text dark:text-notionDark-text mb-4">Roofline Model</h3>
          <div className="flex-1 w-full flex flex-col justify-end">
             <RooflineChart points={points} computeRoof={computeRoof} memoryRoof={memoryRoof} />
          </div>
        </div>
        <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
           <EfficiencyScore score={score} />
        </div>
      </div>

      <LayerStatsTable />

      <FormulaProvenance />
    </div>
  );
}
