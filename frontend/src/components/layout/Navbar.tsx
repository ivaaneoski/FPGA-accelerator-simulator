import { Link, useLocation } from 'react-router-dom';
import { Github, Menu } from 'lucide-react';
import { cn } from '../shared/Badge';
import { ThemeToggle } from './ThemeToggle';
import { FPGA_TARGETS } from '../../utils/constants';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { Select } from '../shared/Input';

const TABS = [
  { name: 'Simulator', path: '/' },
  { name: 'Layer Builder', path: '/builder' },
  { name: 'Comparison', path: '/comparison' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'About / References', path: '/about' },
];

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const location = useLocation();
  const { selectedFPGA, setFPGA } = useSimulatorStore();

  return (
    <header className="h-[45px] bg-notion-bg dark:bg-notionDark-bg border-b border-notion-border dark:border-notionDark-border flex items-center justify-between px-4 sticky top-0 z-40 transition-colors">
      <div className="flex items-center gap-4 h-full">
        {onMenuClick && (
          <button onClick={onMenuClick} className="notion-icon-btn hidden max-xl:flex">
            <Menu className="w-4 h-4" />
          </button>
        )}
        <h1 className="text-[14px] font-semibold text-notion-text dark:text-notionDark-text whitespace-nowrap hidden sm:block">FPGA-NN Simulator</h1>
        <h1 className="text-[14px] font-semibold text-notion-text dark:text-notionDark-text whitespace-nowrap block sm:hidden">FPGA-NN Sim</h1>
        
        <div className="h-4 w-[1px] bg-notion-border dark:bg-notionDark-border hidden sm:block mx-2" />

        <nav className="flex items-center gap-1 h-full overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  "text-[14px] h-[28px] px-2 flex items-center whitespace-nowrap rounded transition-colors focus:outline-none focus-visible:ring-2",
                  isActive 
                    ? "font-medium text-notion-text dark:text-notionDark-text bg-notion-bgHover dark:bg-notionDark-bgHover" 
                    : "text-notion-textSecondary dark:text-notionDark-textSecondary hover:bg-notion-bgHover dark:hover:bg-notionDark-bgHover"
                )}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:block w-[180px]">
          <Select
            value={selectedFPGA.id}
            onChange={(e) => {
              const t = FPGA_TARGETS.find((f) => f.id === e.target.value);
              if (t) setFPGA(t);
            }}
            className="py-1 text-[13px] h-[28px]"
          >
            {FPGA_TARGETS.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </div>
        
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <a
            href="https://github.com/yourusername/fpga-nn-simulator"
            target="_blank"
            rel="noreferrer"
            className="notion-icon-btn"
            aria-label="GitHub repository"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
