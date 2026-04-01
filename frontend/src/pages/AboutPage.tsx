import { FPGA_TARGETS } from '../utils/constants';

export function AboutPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <h1 className="text-[32px] font-bold text-slate-100 mb-2">About & References</h1>
      
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-100 mb-3">Project Description</h2>
        <p className="text-base text-slate-100 leading-relaxed font-normal">
          The FPGA-Targeted Neural Network Accelerator Simulator is a comprehensive modeling tool designed to estimate hardware resource utilization (LUTs, DSPs, BRAMs), inference latency, and throughput when mapping modern deep learning layers onto various FPGA targets. 
        </p>
        <p className="text-base text-slate-100 pt-4 leading-relaxed font-normal">
          <strong>Note:</strong> This is a simulation tool only. It does not interface with real FPGA hardware or generate bitstreams. The estimates provided are derived from well-established academic literature and hardware vendor guidelines.
        </p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-100 mb-3">Academic References</h2>
        <ul className="list-decimal list-inside flex flex-col gap-3 text-sm text-slate-400 font-light pl-2">
          <li>Sze, V., Chen, Y., Yang, T., & Edeleman, J. (2017). <em>Efficient Processing of Deep Neural Networks: A Tutorial and Survey</em>. Proceedings of the IEEE.</li>
          <li>Xilinx (AMD). <em>UltraScale Architecture DSP Slice User Guide (UG579)</em>.</li>
          <li>Xilinx (AMD). <em>Vivado Design Suite User Guide: High-Level Synthesis (UG902)</em>.</li>
          <li>Umuroglu, Y. et al. (2017). <em>FINN: A Framework for Fast, Scalable Binarized Neural Network Inference</em>. FPGA '17.</li>
          <li>Blott, M. et al. (2018). <em>FINN-R: An End-to-End Deep-Learning Framework for Fast Exploration of Quantized Neural Networks</em>. ACM TRETS.</li>
        </ul>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-sm overflow-x-auto">
        <h2 className="text-2xl font-bold text-slate-100 p-6 pb-2">Supported FPGA Targets</h2>
        <table className="w-full text-left border-collapse mt-4">
          <thead>
            <tr className="bg-indigo-500/10 border-y border-slate-700">
              <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider pl-6">FPGA</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Family</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">LUTs</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">FFs</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">DSP Blocks</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right pr-6">BRAMs (36Kb)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {FPGA_TARGETS.map(t => (
               <tr key={t.id} className="hover:bg-indigo-500/5 transition-colors group">
                 <td className="px-6 py-4 text-sm font-semibold text-slate-100">{t.name}</td>
                 <td className="px-6 py-4 text-sm text-slate-400">{t.family}</td>
                 <td className="px-6 py-4 text-sm text-right font-mono text-slate-100">{t.luts.toLocaleString()}</td>
                 <td className="px-6 py-4 text-sm text-right font-mono text-slate-100">{t.ffs.toLocaleString()}</td>
                 <td className="px-6 py-4 text-sm text-right font-mono text-slate-100">{t.dsps.toLocaleString()}</td>
                 <td className="px-6 py-4 text-sm text-right font-mono text-slate-100 pr-6">{t.brams.toLocaleString()}</td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
