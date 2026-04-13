import React from 'react';

interface ClinicalReasoningHeaderProps {
  onClose: () => void;
  onMinimize: () => void;
  onExpand: () => void;
  isMinimized: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

export default function ClinicalReasoningHeader({
  onClose,
  onMinimize,
  onExpand,
  isMinimized,
  onMouseDown,
}: ClinicalReasoningHeaderProps) {
  return (
    <header
      className="px-5 py-4 flex items-center justify-between border-b border-gray-100 cursor-grab active:cursor-grabbing bg-white/80"
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <h1 className="text-sm font-semibold text-gray-800 tracking-tight">
          Chat de Raciocínio Clínico
        </h1>
        <span className="px-1.5 py-0.5 rounded bg-gray-900 text-[9px] font-bold text-white tracking-widest">
          AI
        </span>
      </div>
      <div className="flex items-center gap-1">
        {/* Botão Minimizar/Expandir */}
        {!isMinimized ? (
          <button
            onClick={onMinimize}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            title="Minimizar"
          >
            <svg
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="16"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onExpand}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            title="Expandir"
          >
            <svg
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="16"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          title="Fechar"
        >
          <svg
            fill="none"
            height="16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="16"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </header>
  );
}
