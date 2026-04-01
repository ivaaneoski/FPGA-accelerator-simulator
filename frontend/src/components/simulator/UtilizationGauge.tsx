import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface GaugeProps {
  value: number;      // 0–100 (percentage)
  label: string;      // e.g. "LUTs"
  color: string;      // e.g. "#6366f1"
}

export function UtilizationGauge({ value, label, color }: GaugeProps) {
  const clampedValue = Math.min(value, 100);
  let gaugeColor = '#22c55e'; // green
  if (label === 'BRAMs') {
      gaugeColor = '#f59e0b';
  } else {
      if (clampedValue >= 80) gaugeColor = '#ef4444'; // red
      else if (clampedValue >= 60) gaugeColor = '#f59e0b'; // amber
  }

  return (
    <div className="relative flex flex-col items-center">
      <RadialBarChart
        width={140}
        height={80}
        cx={70}
        cy={80}
        innerRadius={50}
        outerRadius={70}
        startAngle={180}
        endAngle={0}
        data={[{ value: clampedValue, fill: color || gaugeColor }]}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#334155' }} />
      </RadialBarChart>
      {/* Centered label absolutely positioned over the flat edge of the semicircle */}
      <div className="absolute bottom-0 text-center">
        <p className="text-xl font-bold" style={{ color: color || gaugeColor }}>
          {clampedValue.toFixed(1)}%
        </p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}
