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
    <div className="flex flex-col gap-8 max-w-[1200px] mx-auto w-full p-6 md:p-10 animate-fade-in">
      <div className="flex items-center justify-between border-b border-notion-border dark:border-notionDark-border pb-4">
         <h1 className="text-[28px] font-bold text-notion-text dark:text-notionDark-text tracking-tight">Simulator Dashboard</h1>
         <div className="text-notion-textSecondary dark:text-notionDark-textSecondary text-[13px]">
           Target: <span className="text-notion-text dark:text-notionDark-text font-medium">{selectedFPGA.name}</span>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <ResourceCard title="Total LUTs" value={totalLUTs} total={selectedFPGA.luts} unit="LUTs" isLoading={isLoading} />
        <ResourceCard title="Total DSP Blocks" value={totalDSPs} total={selectedFPGA.dsps} unit="DSPs" isLoading={isLoading} />
        <ResourceCard title="Total BRAMs" value={totalBRAMs} total={selectedFPGA.brams} unit="BRAMs" isBram isLoading={isLoading} />
        <ResourceCard title="Estimated Latency" value={latency} total={0} unit="µs" isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ResourceBreakdownChart />
        <LatencyWaterfall />
      </div>

      <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-6 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <h3 className="text-[16px] font-semibold text-notion-text dark:text-notionDark-text mb-6">FPGA Utilization</h3>
        <div className="flex flex-wrap justify-center sm:justify-evenly items-center gap-6">
          <UtilizationGauge value={result?.fpga_utilization?.lut_pct || 0} label="LUTs" color="" />
          <UtilizationGauge value={result?.fpga_utilization?.ff_pct || 0} label="FFs" color="#1F8274" />
          <UtilizationGauge value={result?.fpga_utilization?.dsp_pct || 0} label="DSPs" color="#6940A5" />
          <UtilizationGauge value={result?.fpga_utilization?.bram_pct || 0} label="BRAMs" color="#D9730D" />
        </div>
      </div>
    </div>
  );
}
