import { Link, useLocation } from 'react-router-dom';
import { Github } from 'lucide-react';
import { cn } from '../shared/Badge';
import { ThemeToggle } from './ThemeToggle';
import { FPGA_TARGETS } from '../../utils/constants';
import { useSimulatorStore } from '../../store/useSimulatorStore';

const TABS = [
  { name: 'Simulator', path: '/' },
  { name: 'Layer Builder', path: '/builder' },
  { name: 'Comparison', path: '/comparison' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'About / References', path: '/about' },
];

export function Navbar() {
  const location = useLocation();
  const { selectedFPGA, setFPGA } = useSimulatorStore();

  return (
    <header className="h-[60px] bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-8 h-full">
        <h1 className="text-xl font-bold text-slate-100 whitespace-nowrap hidden sm:block">FPGA-NN Simulator</h1>
        <h1 className="text-xl font-bold text-slate-100 whitespace-nowrap block sm:hidden">FPGA-NN Sim</h1>
        
        <nav className="flex items-center gap-6 h-full overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  "text-sm font-semibold h-full flex items-center whitespace-nowrap hover:text-slate-100 transition-colors border-b-2",
                  isActive 
                    ? "text-slate-100 border-indigo-500" 
                    : "text-slate-400 border-transparent focus:outline-none focus:border-slate-500"
                )}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4 py-2">
        <select
          value={selectedFPGA.id}
          onChange={(e) => {
            const t = FPGA_TARGETS.find((f) => f.id === e.target.value);
            if (t) setFPGA(t);
          }}
          className="hidden md:block bg-slate-900 border border-slate-700 rounded text-sm text-slate-100 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.2)]"
        >
          {FPGA_TARGETS.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        
        <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
          <ThemeToggle />
          <a
            href="https://github.com/yourusername/fpga-nn-simulator"
            target="_blank"
            rel="noreferrer"
            className="p-1 text-slate-400 hover:text-slate-100 transition-colors focus:ring-2 focus:ring-indigo-500 rounded"
            aria-label="GitHub repository"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </header>
  );
}
