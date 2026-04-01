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
    const fill = payload.bound === 'compute' ? '#E03E3E' : '#0B6E99';
    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill={fill} stroke="#ffffff" strokeWidth={1.5} />
        <text x={cx + 8} y={cy - 6} fill="#8c8c8c" fontSize={11}>{payload.name}</text>
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e9e5e3" />
        <XAxis
          dataKey="x"
          type="number"
          scale="log"
          domain={['auto', 'auto']}
          tickFormatter={(v) => v.toFixed(1)}
          stroke="#8c8c8c"
          tick={{ fontSize: 12, fill: '#8c8c8c' }}
          axisLine={{ stroke: '#e9e5e3' }}
          tickLine={false}
        >
          <Label value="Arithmetic Intensity (OPs/Byte)" position="bottom" offset={20} fill="#8c8c8c" fontSize={12} />
        </XAxis>
        <YAxis
          dataKey="y"
          type="number"
          scale="log"
          domain={['auto', 'auto']}
          tickFormatter={(v) => `${v}`}
          stroke="#8c8c8c"
          tick={{ fontSize: 12, fill: '#8c8c8c' }}
          axisLine={{ stroke: '#e9e5e3' }}
          tickLine={false}
        >
          <Label value="Performance (GOPs/s)" angle={-90} position="insideLeft" offset={-10} fill="#8c8c8c" fontSize={12} />
        </YAxis>
        <Tooltip
          cursor={{ strokeDasharray: '3 3', stroke: 'rgba(55, 53, 47, 0.16)' }}
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0].payload;
            if (d.name === "Roofline") return null;
            return (
              <div className="bg-[#ffffff] border border-[#e9e5e3] p-2.5 rounded shadow-[rgba(15,15,15,0.1)_0px_3px_6px] text-[13px] text-notion-textSecondary dark:text-notionDark-textSecondary">
                <p className="font-semibold text-notion-text dark:text-notionDark-text mb-1">{d.name}</p>
                <p>AI: <span className="text-notion-text dark:text-notionDark-text">{d.arithmeticIntensity?.toFixed(2)}</span> OPs/Byte</p>
                <p>Perf: <span className="text-notion-text dark:text-notionDark-text">{d.performance?.toFixed(1)}</span> GOPs/s</p>
                <p className={d.bound === 'compute' ? 'text-[#E03E3E] font-medium' : 'text-[#0B6E99] font-medium'}>
                  {d.bound === 'compute' ? 'Compute-bound' : 'Memory-bound'}
                </p>
              </div>
            );
          }}
        />
        <Scatter data={roofData} dataKey="y" line={{ stroke: '#D9730D', strokeWidth: 2, strokeDasharray: "4 4" }} shape={() => <g></g>} name="Roofline" fill="#D9730D" />
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
