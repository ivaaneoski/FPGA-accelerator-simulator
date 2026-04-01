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
    <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-6 mb-6">
      <h3 className="text-[16px] font-semibold text-notion-text dark:text-notionDark-text mb-4">Formula Provenance</h3>
      <div className="flex flex-col border-t border-notion-border dark:border-notionDark-border">
        {formulas.map((f) => (
           <div key={f.title} className="border-b border-notion-border dark:border-notionDark-border overflow-hidden">
             <button
               onClick={() => toggle(f.title)}
               className="w-full flex items-center p-3 text-[14px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary hover:bg-notion-bgHover dark:hover:bg-notionDark-bgHover transition-colors focus:outline-none focus-visible:bg-notion-bgHover"
             >
               {open[f.title] ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
               {f.title}
             </button>
             {open[f.title] && (
                <div className="px-9 pb-4">
                  <div className="font-mono text-[13px] text-[#EB5757] dark:text-[#ff7b72] bg-[#f7f7f5] dark:bg-[#202020] p-2.5 rounded mb-2 overflow-x-auto whitespace-nowrap">
                    {f.formula}
                  </div>
                  <p className="text-[12px] text-notion-textSecondary dark:text-notionDark-textSecondary italic">Source: {f.cite}</p>
                </div>
             )}
           </div>
        ))}
        {!formulas.length && <div className="pt-4"><p className="text-[13px] text-notion-textSecondary dark:text-notionDark-textSecondary italic">Run estimation to view formula provenance.</p></div>}
      </div>
    </div>
  );
}
