import { AlertTriangle, Gauge, Lightbulb, MemoryStick, Zap } from 'lucide-react';
import type { EstimationResult, FPGATarget, Layer } from '../../types';
import { fmtLatency, fmtPct } from '../../utils/formatters';

interface DesignRecommendationsProps {
  result: EstimationResult;
  selectedFPGA: FPGATarget;
  layers: Layer[];
}

interface Recommendation {
  title: string;
  detail: string;
  tone: 'warning' | 'info' | 'success';
  icon: typeof AlertTriangle;
}

const toneClasses = {
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300',
};

function topUtilization(result: EstimationResult) {
  const utilization = result.fpga_utilization;
  return [
    { name: 'LUT', value: utilization.lut_pct },
    { name: 'FF', value: utilization.ff_pct },
    { name: 'DSP', value: utilization.dsp_pct },
    { name: 'BRAM', value: utilization.bram_pct },
  ].sort((a, b) => b.value - a.value);
}

function getLayerPrecision(layers: Layer[], name: string) {
  return layers.find((layer) => layer.name === name)?.precision;
}

function buildRecommendations(result: EstimationResult, selectedFPGA: FPGATarget, layers: Layer[]): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const [mostUsed] = topUtilization(result);
  const slowestLayer = [...result.layers].sort((a, b) => b.latency_us - a.latency_us)[0];
  const memoryBoundCount = result.layers.filter((layer) => layer.roofline_bound === 'memory').length;
  const fp32Layer = result.layers.find((layer) => getLayerPrecision(layers, layer.name) === 'fp32');

  if (mostUsed.value > 100) {
    recommendations.push({
      title: `${mostUsed.name} capacity exceeded`,
      detail: `${selectedFPGA.name} is at ${fmtPct(mostUsed.value)} ${mostUsed.name} utilization. Try INT8/INT4 precision, lower parallelism on the largest layers, or move to a larger target.`,
      tone: 'warning',
      icon: AlertTriangle,
    });
  } else if (mostUsed.value > 85) {
    recommendations.push({
      title: `${mostUsed.name} headroom is tight`,
      detail: `${mostUsed.name} utilization is ${fmtPct(mostUsed.value)}. Keep some margin for routing, control logic, and implementation overhead before treating this design as comfortable.`,
      tone: 'warning',
      icon: Gauge,
    });
  }

  if (memoryBoundCount > 0) {
    recommendations.push({
      title: `${memoryBoundCount} memory-bound layer${memoryBoundCount === 1 ? '' : 's'}`,
      detail: 'Increasing parallelism may give limited speedup on memory-bound layers. Prioritize tiling, activation reuse, or smaller precision before adding more compute lanes.',
      tone: 'info',
      icon: MemoryStick,
    });
  }

  if (slowestLayer && result.total.latency_us > 0) {
    const share = (slowestLayer.latency_us / result.total.latency_us) * 100;
    if (share >= 35) {
      recommendations.push({
        title: `${slowestLayer.name} dominates latency`,
        detail: `${slowestLayer.name} contributes ${fmtPct(share)} of total latency (${fmtLatency(slowestLayer.latency_us)}). Tune this layer first for the biggest performance gain.`,
        tone: 'info',
        icon: Zap,
      });
    }
  }

  if (fp32Layer) {
    recommendations.push({
      title: 'FP32 layer found',
      detail: `${fp32Layer.name} is using FP32. Switching suitable layers to INT8 or INT4 usually reduces DSP and BRAM pressure significantly.`,
      tone: 'info',
      icon: Lightbulb,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Design looks balanced',
      detail: 'No obvious capacity or bottleneck warnings were found. This configuration is a good candidate for comparison against a higher-parallelism or lower-precision variant.',
      tone: 'success',
      icon: Lightbulb,
    });
  }

  return recommendations.slice(0, 4);
}

export function DesignRecommendations({ result, selectedFPGA, layers }: DesignRecommendationsProps) {
  const recommendations = buildRecommendations(result, selectedFPGA, layers);

  return (
    <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-6 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-[16px] font-semibold text-notion-text dark:text-notionDark-text">Design Recommendations</h3>
        <span className="text-[12px] text-notion-textSecondary dark:text-notionDark-textSecondary">{selectedFPGA.name}</span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {recommendations.map((recommendation) => {
          const Icon = recommendation.icon;
          return (
            <div
              key={recommendation.title}
              className={`flex items-start gap-3 rounded border px-3 py-3 ${toneClasses[recommendation.tone]}`}
            >
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold">{recommendation.title}</p>
                <p className="text-[12px] leading-relaxed opacity-90">{recommendation.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
