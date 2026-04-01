import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useSimulatorStore } from '../../store/useSimulatorStore';

export function FormulaProvenance() {
  const { result } = useSimulatorStore();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setOpen(p => ({ ...p, [key]: !p[key] }));

  // Pick the first layer to show formula examples
  const layer = result?.layers[0];

  const formulas = layer ? [
    { title: 'DSP Estimation', formula: layer.formula_used['dsps'], cite: "Sze et al., 2017 — Efficient Processing of Deep Neural Networks" },
    { title: 'LUT Overhead', formula: layer.formula_used['luts'], cite: "Xilinx (AMD). UltraScale Architecture DSP Slice User Guide (UG579)" },
    { title: 'Latency', formula: layer.formula_used['latency'], cite: "Empirical pipeline model based on layer dimensions and clock speed" },
  ] : [];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-sm p-6 mb-6">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">Formula Provenance</h3>
      <div className="flex flex-col gap-2">
        {formulas.map((f) => (
           <div key={f.title} className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900">
             <button
               onClick={() => toggle(f.title)}
               className="w-full flex items-center justify-between p-4 text-sm font-semibold text-slate-100 hover:bg-white/5 transition-colors focus:outline-none"
             >
               {f.title}
               {open[f.title] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
             </button>
             {open[f.title] && (
                <div className="p-4 pt-0 border-t border-slate-700">
                  <div className="font-mono text-[13px] text-indigo-400 bg-slate-800 p-3 rounded-md mb-3 overflow-x-auto">
                    {f.formula}
                  </div>
                  <p className="text-xs text-slate-400 font-light italic text-right">Source: {f.cite}</p>
                </div>
             )}
           </div>
        ))}
        {!formulas.length && <p className="text-sm text-slate-400 italic">Run estimation to view formula provenance.</p>}
      </div>
    </div>
  );
}
