import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';

export interface RooflinePoint {
  arithmeticIntensity: number;  // x — OPs/Byte
  performance: number;          // y — GOPs/s
  name: string;
  bound: 'compute' | 'memory';
}

interface RooflineChartProps {
  points: RooflinePoint[];
  computeRoof: number;
  memoryRoof: number;
}

const FLOOR = 0.001; // prevent log(0)

export function RooflineChart({ points, computeRoof, memoryRoof }: RooflineChartProps) {
  // Sanitize inputs
  const safeComputeRoof = Math.max(computeRoof, FLOOR);
  const safeMemoryRoof = Math.max(memoryRoof, FLOOR);
  const ridgePoint = safeComputeRoof / safeMemoryRoof;

  const roofData = [
    { x: FLOOR, y: FLOOR * safeMemoryRoof },
    { x: ridgePoint, y: safeComputeRoof },
    { x: ridgePoint * 100, y: safeComputeRoof },
  ];

  // Filter out degenerate points that would crash log scale
  const validPoints = points
    .filter(p => p.arithmeticIntensity > 0 && p.performance > 0)
    .map(p => ({ ...p, x: p.arithmeticIntensity, y: p.performance }));

  const isEmpty = validPoints.length === 0;

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || isNaN(cx) || isNaN(cy)) return <g />;
    const fill = payload.bound === 'compute' ? '#E03E3E' : '#0B6E99';
    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill={fill} stroke="#ffffff" strokeWidth={1.5} />
        <text x={cx + 8} y={cy - 6} fill="#8c8c8c" fontSize={11}>{payload.name}</text>
      </g>
    );
  };

  if (isEmpty) {
    return (
      <div className="w-full h-[350px] flex flex-col items-center justify-center text-notion-textSecondary dark:text-notionDark-textSecondary text-[13px]">
        <p className="mb-1 font-medium">No data to display</p>
        <p className="text-[12px]">Add layers and run estimation to see the roofline model.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e9e5e3" />
        <XAxis
          dataKey="x"
          type="number"
          scale="log"
          domain={[FLOOR, 'auto']}
          tickFormatter={(v) => (isFinite(v) && v > 0 ? v.toFixed(1) : '')}
          stroke="#8c8c8c"
          tick={{ fontSize: 12, fill: '#8c8c8c' }}
          axisLine={{ stroke: '#e9e5e3' }}
          tickLine={false}
          allowDataOverflow
        >
          <Label value="Arithmetic Intensity (OPs/Byte)" position="bottom" offset={20} fill="#8c8c8c" fontSize={12} />
        </XAxis>
        <YAxis
          dataKey="y"
          type="number"
          scale="log"
          domain={[FLOOR, 'auto']}
          tickFormatter={(v) => (isFinite(v) && v > 0 ? `${v}` : '')}
          stroke="#8c8c8c"
          tick={{ fontSize: 12, fill: '#8c8c8c' }}
          axisLine={{ stroke: '#e9e5e3' }}
          tickLine={false}
          allowDataOverflow
        >
          <Label value="Performance (GOPs/s)" angle={-90} position="insideLeft" offset={-10} fill="#8c8c8c" fontSize={12} />
        </YAxis>
        <Tooltip
          cursor={{ strokeDasharray: '3 3', stroke: 'rgba(55, 53, 47, 0.16)' }}
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0].payload;
            if (d.name === 'Roofline') return null;
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
        <Scatter data={roofData} dataKey="y" line={{ stroke: '#D9730D', strokeWidth: 2, strokeDasharray: '4 4' }} shape={() => <g />} name="Roofline" fill="#D9730D" />
        <Scatter
          data={validPoints}
          dataKey="y"
          shape={<CustomDot />}
          name="Layers"
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
