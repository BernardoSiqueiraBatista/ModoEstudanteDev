import React from 'react';

interface FloatingActionsProps {
  onSearch?: () => void;
  onAdd?: () => void;
}

export default function FloatingActions({ onSearch, onAdd }: FloatingActionsProps) {
  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40">
      <button
        onClick={onSearch}
        className="h-11 px-5 bg-white rounded-full shadow-2xl shadow-black/5 flex items-center gap-2 text-elite-graphite border border-elite-border hover:translate-y-[-2px] transition-transform cursor-pointer"
      >
        <span className="material-symbols-outlined text-lg">search</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest">Buscar</span>
      </button>
      <button
        onClick={onAdd}
        className="size-11 bg-elite-graphite rounded-full shadow-2xl shadow-black/20 flex items-center justify-center text-white hover:scale-105 transition-transform cursor-pointer"
      >
        <span className="material-symbols-outlined text-base">add</span>
      </button>
    </div>
  );
}
