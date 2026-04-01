import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSimulatorStore } from '../../store/useSimulatorStore';

export function ResourceBreakdownChart() {
  const { result } = useSimulatorStore();

  const data = result?.layers.map(layer => ({
    name: layer.name,
    LUTs: layer.luts,
    DSPs: layer.dsps,
    BRAMs: layer.brams,
  })) || [];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm w-full h-[350px]">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">Resource Breakdown by Layer</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
          barGap={8}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px' }}
            itemStyle={{ fontSize: '14px' }}
            labelStyle={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}
            cursor={{ fill: 'transparent' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
          <Bar dataKey="LUTs" fill="#6366f1" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={600} />
          <Bar dataKey="DSPs" fill="#a855f7" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={600} />
          <Bar dataKey="BRAMs" fill="#f59e0b" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={600} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
