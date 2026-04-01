import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useSimulatorStore } from '../../store/useSimulatorStore';

export function LatencyWaterfall() {
  const { result } = useSimulatorStore();

  const data = result?.layers.map(layer => ({
    name: layer.name,
    type: layer.type,
    latency: layer.latency_us,
    cycles: layer.latency_cycles,
  })) || [];

  return (
    <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-6 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] w-full h-[350px]">
      <h3 className="text-[16px] font-semibold text-notion-text dark:text-notionDark-text mb-4">Latency Waterfall</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 30, left: 40, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e9e5e3" horizontal={false} />
          <XAxis 
            type="number"
            tick={{ fill: '#8c8c8c', fontSize: 12 }}
            axisLine={{ stroke: '#e9e5e3' }}
            tickLine={false}
          />
          <YAxis 
            dataKey="name"
            type="category"
            tick={{ fill: '#8c8c8c', fontSize: 13 }}
            axisLine={{ stroke: '#e9e5e3' }}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e9e5e3', borderRadius: '4px', padding: '8px 12px', boxShadow: 'rgba(15, 15, 15, 0.1) 0px 3px 6px' }}
            itemStyle={{ fontSize: '13px', color: '#8c8c8c' }}
            labelStyle={{ color: '#37352f', fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}
            cursor={{ fill: 'rgba(55, 53, 47, 0.04)' }}
            formatter={(value: number, name: string, props: any) => {
               if (name === 'latency') return [`${value.toFixed(2)} µs (${props.payload.cycles} cycles)`, 'Latency'];
               return [value, name];
            }}
          />
          <Bar dataKey="latency" barSize={20} isAnimationActive={true} animationDuration={400} radius={[0, 2, 2, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.type === 'conv2d' ? '#0B6E99' : '#AD1A72'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
