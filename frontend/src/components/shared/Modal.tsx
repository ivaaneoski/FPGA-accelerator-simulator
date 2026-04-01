import { useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from './Badge';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Dialog */}
      <div 
        ref={modalRef}
        className={cn(
          "relative bg-notion-bg dark:bg-notionDark-bg w-full max-w-lg rounded-lg notion-shadow notion-border flex flex-col",
          "scale-100 opacity-100 transition-all m-4 max-h-[90vh]"
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-notion-border dark:border-notionDark-border shrink-0">
          <h2 className="text-[16px] font-semibold text-notion-text dark:text-notionDark-text">{title}</h2>
          <button 
            onClick={onClose}
            className="notion-icon-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-notion-border dark:border-notionDark-border bg-notion-bgHover/50 dark:bg-notionDark-bgHover/50 rounded-b-lg flex justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
