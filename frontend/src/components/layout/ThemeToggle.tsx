import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useSimulatorStore } from '../../store/useSimulatorStore';

export function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useSimulatorStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <button
      onClick={toggleDarkMode}
      className="p-1 text-slate-400 hover:text-slate-100 transition-colors bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded"
      aria-label="Toggle dark mode"
    >
      {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
