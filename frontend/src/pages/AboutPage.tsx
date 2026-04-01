import { FPGA_TARGETS } from '../utils/constants';

export function AboutPage() {
  return (
    <div className="flex flex-col gap-8 max-w-[1000px] mx-auto w-full p-6 md:p-10 animate-fade-in">
      <div className="border-b border-notion-border dark:border-notionDark-border pb-4 mb-2">
         <h1 className="text-[28px] font-bold text-notion-text dark:text-notionDark-text tracking-tight">About & References</h1>
      </div>
      
      <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-8 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <h2 className="text-[18px] font-semibold text-notion-text dark:text-notionDark-text mb-4">Project Description</h2>
        <p className="text-[15px] text-notion-text dark:text-notionDark-text leading-relaxed font-normal">
          The FPGA-Targeted Neural Network Accelerator Simulator is a comprehensive modeling tool designed to estimate hardware resource utilization (LUTs, DSPs, BRAMs), inference latency, and throughput when mapping modern deep learning layers onto various FPGA targets. 
        </p>
        <p className="text-[15px] text-notion-text dark:text-notionDark-text pt-4 leading-relaxed font-normal">
          <strong className="font-semibold px-2 py-0.5 rounded bg-notion-bgHover dark:bg-notionDark-bgHover border border-notion-border dark:border-notionDark-border">Note:</strong> This is a simulation tool only. It does not interface with real FPGA hardware or generate bitstreams. The estimates provided are derived from well-established academic literature and hardware vendor guidelines.
        </p>
      </div>

      <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded px-8 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <h2 className="text-[18px] font-semibold text-notion-text dark:text-notionDark-text mb-4">Academic References</h2>
        <ul className="list-decimal list-outside flex flex-col gap-3 text-[14px] text-notion-textSecondary dark:text-notionDark-textSecondary font-medium pl-6 marker:text-notion-textSecondary">
          <li className="pl-1">Sze, V., Chen, Y., Yang, T., & Edeleman, J. (2017). <em className="italic">Efficient Processing of Deep Neural Networks: A Tutorial and Survey</em>. Proceedings of the IEEE.</li>
          <li className="pl-1">Xilinx (AMD). <em className="italic">UltraScale Architecture DSP Slice User Guide (UG579)</em>.</li>
          <li className="pl-1">Xilinx (AMD). <em className="italic">Vivado Design Suite User Guide: High-Level Synthesis (UG902)</em>.</li>
          <li className="pl-1">Umuroglu, Y. et al. (2017). <em className="italic">FINN: A Framework for Fast, Scalable Binarized Neural Network Inference</em>. FPGA '17.</li>
          <li className="pl-1">Blott, M. et al. (2018). <em className="italic">FINN-R: An End-to-End Deep-Learning Framework for Fast Exploration of Quantized Neural Networks</em>. ACM TRETS.</li>
        </ul>
      </div>

      <div className="bg-notion-bg dark:bg-notionDark-bg border border-notion-border dark:border-notionDark-border rounded shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-x-auto">
        <h2 className="text-[18px] font-semibold text-notion-text dark:text-notionDark-text p-6 pb-4 border-b border-notion-border dark:border-notionDark-border bg-[#f7f7f5] dark:bg-[#202020] m-0">Supported FPGA Targets</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f7f7f5] dark:bg-[#202020] border-b border-notion-border dark:border-notionDark-border">
              <th className="px-6 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide pl-6">FPGA</th>
              <th className="px-6 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide">Family</th>
              <th className="px-6 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide text-right">LUTs</th>
              <th className="px-6 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide text-right">FFs</th>
              <th className="px-6 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide text-right">DSP Blocks</th>
              <th className="px-6 py-3 text-[12px] font-medium text-notion-textSecondary dark:text-notionDark-textSecondary uppercase tracking-wide text-right pr-6">BRAMs (36Kb)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-notion-border dark:divide-notionDark-border">
            {FPGA_TARGETS.map(t => (
               <tr key={t.id} className="hover:bg-notion-bgHover dark:hover:bg-notionDark-bgHover transition-colors group">
                 <td className="px-6 py-4 text-[13px] font-medium text-notion-text dark:text-notionDark-text">{t.name}</td>
                 <td className="px-6 py-4 text-[13px] text-notion-textSecondary dark:text-notionDark-textSecondary">{t.family}</td>
                 <td className="px-6 py-4 text-[13px] text-right font-mono text-notion-text dark:text-notionDark-text">{t.luts.toLocaleString()}</td>
                 <td className="px-6 py-4 text-[13px] text-right font-mono text-notion-text dark:text-notionDark-text">{t.ffs.toLocaleString()}</td>
                 <td className="px-6 py-4 text-[13px] text-right font-mono text-notion-text dark:text-notionDark-text">{t.dsps.toLocaleString()}</td>
                 <td className="px-6 py-4 text-[13px] text-right font-mono text-notion-text dark:text-notionDark-text pr-6">{t.brams.toLocaleString()}</td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
