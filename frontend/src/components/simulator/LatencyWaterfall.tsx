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
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm w-full h-[350px]">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">Latency Waterfall</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 30, left: 40, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis 
            type="number"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis 
            dataKey="name"
            type="category"
            tick={{ fill: '#94a3b8', fontSize: 13 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px' }}
            itemStyle={{ fontSize: '14px', color: '#94a3b8' }}
            labelStyle={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            formatter={(value: number, name: string, props: any) => {
               if (name === 'latency') return [`${value.toFixed(2)} µs (${props.payload.cycles} cycles)`, 'Latency'];
               return [value, name];
            }}
          />
          <Bar dataKey="latency" barSize={28} isAnimationActive={true} animationDuration={600}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.type === 'conv2d' ? '#6366f1' : '#14b8a6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
