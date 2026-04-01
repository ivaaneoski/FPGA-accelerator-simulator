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
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-[32px] font-bold text-slate-100">Analytics</h1>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-100 mb-4">Roofline Model</h3>
          <RooflineChart points={points} computeRoof={computeRoof} memoryRoof={memoryRoof} />
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-sm">
           <EfficiencyScore score={score} />
        </div>
      </div>

      <LayerStatsTable />

      <FormulaProvenance />
    </div>
  );
}
