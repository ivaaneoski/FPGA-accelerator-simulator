import { ResourceCard } from '../components/simulator/ResourceCard';
import { UtilizationGauge } from '../components/simulator/UtilizationGauge';
import { ResourceBreakdownChart } from '../components/simulator/ResourceBreakdownChart';
import { LatencyWaterfall } from '../components/simulator/LatencyWaterfall';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { Cpu, AlertTriangle, XCircle } from 'lucide-react';
import { fmtInt, fmtLatency } from '../utils/formatters';

export function SimulatorPage() {
  const { result, selectedFPGA, isLoading, error, layers } = useSimulatorStore();

  const totalLUTs = result?.total.luts || 0;
  const totalDSPs = result?.total.dsps || 0;
  const totalBRAMs = result?.total.brams || 0;
  const latency = result?.total.latency_us || 0;

  const lutPct = result?.fpga_utilization?.lut_pct || 0;
  const ffPct = result?.fpga_utilization?.ff_pct || 0;
  const dspPct = result?.fpga_utilization?.dsp_pct || 0;
  const bramPct = result?.fpga_utilization?.bram_pct || 0;

  const isOverCapacity = lutPct > 100 || ffPct > 100 || dspPct > 100 || bramPct > 100;

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between border-b border-notion-border dark:border-notionDark-border pb-4">
         <h1 className="text-[28px] font-bold text-notion-text dark:text-notionDark-text tracking-tight">Simulator Dashboard</h1>
         <div className="text-notion-textSecondary dark:text-notionDark-textSecondary text-[13px]">
           Target: <span className="text-notion-text dark:text-notionDark-text font-medium">{selectedFPGA.name}</span>
         </div>
      </div>

      {layers.length === 0 ? (
        <div className="flex flex-col items-center justify-center my-20 bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded-lg p-12 shadow-sm">
          <Cpu className="w-12 h-12 text-indigo-500 opacity-40 mb-4" />
          <h3 className="text-xl font-bold text-notion-text dark:text-notionDark-text mb-2">No layers configured</h3>
          <p className="text-notion-textSecondary dark:text-notionDark-textSecondary text-center max-w-sm mb-6">
            Add your first layer using the button in the sidebar to begin estimation.
          </p>
          {/* Note: In a full app, this button should ideally open the LayerForm modal right here or trigger the sidebar. */}
        </div>
      ) : (
        <>
          {error && (
            <div className="flex flex-row items-center gap-3 bg-[#FEF2F2] dark:bg-[rgba(224,62,62,0.1)] border-l-4 border-[#E03E3E] text-[#E03E3E] dark:text-[#DF5452] p-4 rounded text-sm mb-2 shadow-sm">
              <XCircle className="w-5 h-5" />
              <div className="font-semibold">{error}</div>
            </div>
          )}

          {isOverCapacity && !error && (
            <div className="flex flex-row items-center gap-3 bg-[#FFFBF0] dark:bg-[rgba(217,115,13,0.1)] border border-[#D9730D] text-[#D9730D] dark:text-[#C77D48] p-4 rounded text-sm mb-2 shadow-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <strong className="font-bold">Over Capacity Warning:</strong> The current model exceeds the available resources on the {selectedFPGA.name}. Consider quantizing to INT8/INT4 or selecting a larger FPGA target.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <ResourceCard 
              title="Total LUTs" 
              valueStr={`~${fmtInt(totalLUTs)}`} 
              totalStr={fmtInt(selectedFPGA.luts)} 
              unit="LUTs" 
              percentage={totalLUTs > 0 ? (totalLUTs / selectedFPGA.luts) * 100 : 0}
              isLoading={isLoading} 
            />
            <ResourceCard 
              title="Total DSP Blocks" 
              valueStr={`~${fmtInt(totalDSPs)}`} 
              totalStr={fmtInt(selectedFPGA.dsps)} 
              unit="DSPs" 
              percentage={totalDSPs > 0 ? (totalDSPs / selectedFPGA.dsps) * 100 : 0}
              isLoading={isLoading} 
            />
            <ResourceCard 
              title="Total BRAMs" 
              valueStr={`~${fmtInt(totalBRAMs)}`} 
              totalStr={fmtInt(selectedFPGA.brams)} 
              unit="BRAMs" 
              percentage={totalBRAMs > 0 ? (totalBRAMs / selectedFPGA.brams) * 100 : 0}
              isBram 
              isLoading={isLoading} 
            />
            <ResourceCard 
              title="Estimated Latency" 
              valueStr={`~${fmtLatency(latency)}`} 
              totalStr=""
              unit="" 
              percentage={0}
              isLoading={isLoading} 
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="h-[350px]">
              <ResourceBreakdownChart />
            </div>
            <div className="h-[350px]">
              <LatencyWaterfall />
            </div>
          </div>

          <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-6 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <h3 className="text-[16px] font-semibold text-notion-text dark:text-notionDark-text mb-6">FPGA Utilization</h3>
            <div className="flex flex-wrap justify-center sm:justify-evenly items-center gap-6">
              <UtilizationGauge value={lutPct} label="LUTs" color="" />
              <UtilizationGauge value={ffPct} label="FFs" color="#1F8274" />
              <UtilizationGauge value={dspPct} label="DSPs" color="#6940A5" />
              <UtilizationGauge value={bramPct} label="BRAMs" color="#D9730D" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
