import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface GaugeProps {
  value: number;      // 0–100 (percentage)
  label: string;      // e.g. "LUTs"
  color?: string;      // e.g. "#6366f1"
}

export function UtilizationGauge({ value, label, color }: GaugeProps) {
  const clampedValue = Math.min(value, 100);
  let gaugeColor = '#0F7B6C'; // Notion tagGreenText
  if (label === 'BRAMs') {
      gaugeColor = '#D9730D';
  } else {
      if (clampedValue >= 80) gaugeColor = '#E03E3E'; // Red
      else if (clampedValue >= 60) gaugeColor = '#D9730D'; // Orange
  }

  return (
    <div className="relative flex flex-col items-center">
      <RadialBarChart
        width={140}
        height={80}
        cx={70}
        cy={75}
        innerRadius={50}
        outerRadius={70}
        startAngle={180}
        endAngle={0}
        data={[{ value: clampedValue, fill: color || gaugeColor }]}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar dataKey="value" cornerRadius={2} background={{ fill: '#e9e5e3' }} />
      </RadialBarChart>
      {/* Centered label absolutely positioned over the flat edge of the semicircle */}
      <div className="absolute bottom-0 text-center">
        <p className="text-[16px] font-bold tracking-tight leading-none" style={{ color: color || gaugeColor }}>
          {clampedValue.toFixed(1)}%
        </p>
        <p className="text-[12px] font-medium mt-1 text-notion-textSecondary dark:text-notionDark-textSecondary">{label}</p>
      </div>
    </div>
  );
}
