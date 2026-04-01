import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from './Badge';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-[4px]" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
        className={cn("relative bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-[540px] shadow-xl flex flex-col max-h-[90vh] overflow-hidden sm:rounded-2xl rounded-none sm:w-auto", className)}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 id="modal-title" className="text-xl font-semibold text-slate-100">{title}</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
        
        {footer && (
          <div className="p-4 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
