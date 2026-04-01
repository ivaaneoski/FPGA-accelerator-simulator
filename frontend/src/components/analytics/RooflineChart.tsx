import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';

export interface RooflinePoint {
  arithmeticIntensity: number;  // x — OPs/Byte
  performance: number;          // y — GOPs/s
  name: string;
  bound: 'compute' | 'memory';
}

interface RooflineChartProps {
  points: RooflinePoint[];
  computeRoof: number;     // e.g. 500 GOPs/s — from fpga DSPs * 2 * clockMhz / 1000
  memoryRoof: number;      // e.g. 25.6 GB/s — fixed for DDR4 on Zynq
}

export function RooflineChart({ points, computeRoof, memoryRoof }: RooflineChartProps) {
  const ridgePoint = computeRoof / memoryRoof;

  const roofData = [
    { x: 0.1, y: 0.1 * memoryRoof },
    { x: ridgePoint, y: computeRoof },
    { x: ridgePoint * 100, y: computeRoof },
  ];

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const fill = payload.bound === 'compute' ? '#ef4444' : '#6366f1';
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill={fill} stroke="#fff" strokeWidth={1} />
        <text x={cx + 8} y={cy - 6} fill="#94a3b8" fontSize={11}>{payload.name}</text>
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="x"
          type="number"
          scale="log"
          domain={['auto', 'auto']}
          tickFormatter={(v) => v.toFixed(1)}
          stroke="#94a3b8"
        >
          <Label value="Arithmetic Intensity (OPs/Byte)" position="bottom" offset={20} fill="#94a3b8" />
        </XAxis>
        <YAxis
          dataKey="y"
          type="number"
          scale="log"
          domain={['auto', 'auto']}
          tickFormatter={(v) => `${v}`}
          stroke="#94a3b8"
        >
          <Label value="Performance (GOPs/s)" angle={-90} position="insideLeft" offset={-10} fill="#94a3b8" />
        </YAxis>
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0].payload;
            if (d.name === "Roofline") return null;
            return (
              <div className="bg-slate-800 border border-slate-700 p-2 rounded text-xs shadow-lg">
                <p className="font-bold text-slate-100">{d.name}</p>
                <p className="text-slate-400">AI: {d.arithmeticIntensity?.toFixed(2)} OPs/Byte</p>
                <p className="text-slate-400">Perf: {d.performance?.toFixed(1)} GOPs/s</p>
                <p className={d.bound === 'compute' ? 'text-red-400 font-semibold' : 'text-indigo-400 font-semibold'}>
                  {d.bound === 'compute' ? 'Compute-bound' : 'Memory-bound'}
                </p>
              </div>
            );
          }}
        />
        <Scatter data={roofData} dataKey="y" line={{ stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: "6 3" }} shape={() => <g></g>} name="Roofline" fill="#f59e0b" />
        <Scatter
          data={points.map(p => ({ ...p, x: p.arithmeticIntensity, y: p.performance }))}
          dataKey="y"
          shape={<CustomDot />}
          name="Layers"
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
