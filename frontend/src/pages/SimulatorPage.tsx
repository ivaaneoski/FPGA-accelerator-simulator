import { ResourceCard } from '../components/simulator/ResourceCard';
import { UtilizationGauge } from '../components/simulator/UtilizationGauge';
import { ResourceBreakdownChart } from '../components/simulator/ResourceBreakdownChart';
import { LatencyWaterfall } from '../components/simulator/LatencyWaterfall';
import { useSimulatorStore } from '../store/useSimulatorStore';

export function SimulatorPage() {
  const { result, selectedFPGA, isLoading } = useSimulatorStore();

  const totalLUTs = result?.total.luts || 0;
  const totalDSPs = result?.total.dsps || 0;
  const totalBRAMs = result?.total.brams || 0;
  const latency = result?.total.latency_us || 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
         <h1 className="text-[32px] font-bold text-slate-100">Simulator</h1>
         <div className="text-secondary text-sm">Target: <span className="text-primary font-semibold">{selectedFPGA.name}</span></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <ResourceCard title="Total LUTs" value={totalLUTs} total={selectedFPGA.luts} unit="LUTs" isLoading={isLoading} />
        <ResourceCard title="Total DSP Blocks" value={totalDSPs} total={selectedFPGA.dsps} unit="DSPs" isLoading={isLoading} />
        <ResourceCard title="Total BRAMs" value={totalBRAMs} total={selectedFPGA.brams} unit="BRAMs" isBram isLoading={isLoading} />
        <ResourceCard title="Estimated Latency" value={latency} total={0} unit="µs" isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
        <ResourceBreakdownChart />
        <LatencyWaterfall />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-100 mb-6">FPGA Utilization</h3>
        <div className="flex flex-wrap justify-center sm:justify-between items-center gap-6">
          <UtilizationGauge value={result?.fpga_utilization?.lut_pct || 0} label="LUTs" color="" />
          <UtilizationGauge value={result?.fpga_utilization?.ff_pct || 0} label="FFs" color="#22c55e" />
          <UtilizationGauge value={result?.fpga_utilization?.dsp_pct || 0} label="DSPs" color="#a855f7" />
          <UtilizationGauge value={result?.fpga_utilization?.bram_pct || 0} label="BRAMs" color="#f59e0b" />
        </div>
      </div>
    </div>
  );
}
