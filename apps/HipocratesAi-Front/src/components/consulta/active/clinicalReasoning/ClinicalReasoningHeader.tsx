import React from 'react';

interface ClinicalReasoningHeaderProps {
  onClose: () => void;
  onMinimize: () => void;
  onExpand: () => void;
  onMaximize: () => void;
  isMinimized: boolean;
  isMaximized: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

export default function ClinicalReasoningHeader({
  onClose,
  onMinimize: _onMinimize,
  onExpand: _onExpand,
  onMaximize: _onMaximize,
  isMinimized: _isMinimized,
  isMaximized: _isMaximized,
  onMouseDown,
}: ClinicalReasoningHeaderProps) {
  return (
    <header
      className="px-6 py-5 flex items-center justify-between border-b border-slate-200/60 cursor-grab active:cursor-grabbing"
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center gap-3">
        <div className="size-2 rounded-full bg-accent-blue shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></div>
        <h1 className="text-[13px] font-semibold text-slate-900 tracking-wide">
          Hipócrates Intelligence
        </h1>
        <span className="px-1.5 py-0.5 rounded-md bg-slate-900/10 text-[8px] font-black text-slate-700 tracking-widest uppercase">
          AI
        </span>
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-700 transition-colors"
        title="Fechar"
      >
        <span className="material-symbols-outlined !text-[18px]">keyboard_arrow_down</span>
      </button>
    </header>
  );
}
