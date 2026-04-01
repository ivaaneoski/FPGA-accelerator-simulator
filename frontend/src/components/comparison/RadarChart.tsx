import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ResponsiveContainer, Tooltip } from 'recharts';

const RADAR_COLORS = ['#6366f1', '#14b8a6', '#f59e0b'];

export interface RadarConfig {
  name: string;
  lutPct: number;
  dspPct: number;
  bramPct: number;
  latencyNorm: number;
  throughputNorm: number;
}

export function ConfigRadarChart({ configs }: { configs: RadarConfig[] }) {
  if (!configs.length) return null;

  const axes = ['LUT %', 'DSP %', 'BRAM %', 'Latency', 'Throughput'];
  const dataKeys: (keyof RadarConfig)[] = ['lutPct', 'dspPct', 'bramPct', 'latencyNorm', 'throughputNorm'];

  const chartData = axes.map((axis, i) => {
    const entry: Record<string, any> = { axis };
    configs.forEach(cfg => { entry[cfg.name] = cfg[dataKeys[i]]; });
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
        {configs.map((cfg, i) => (
          <Radar
            key={cfg.name}
            name={cfg.name}
            dataKey={cfg.name}
            stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
            fill={RADAR_COLORS[i % RADAR_COLORS.length]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
        <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#f1f5f9' }}
          itemStyle={{ color: '#94a3b8' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
