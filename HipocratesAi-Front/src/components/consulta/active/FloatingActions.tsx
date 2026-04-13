import React from 'react';

interface FloatingActionsProps {
  onEndSession?: () => void;
}

export default function FloatingActions({ onEndSession }: FloatingActionsProps) {
  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30">
      <div className="action-blur px-2 py-2 rounded-full flex items-center gap-1 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
        <button className="flex items-center justify-center size-11 text-slate-500 hover:text-black dark:hover:text-white rounded-full transition-all hover:bg-white/50 dark:hover:bg-white/5">
          <span className="material-symbols-outlined">pause</span>
        </button>
        <button className="flex items-center justify-center size-11 text-slate-500 hover:text-black dark:hover:text-white rounded-full transition-all hover:bg-white/50 dark:hover:bg-white/5">
          <span className="material-symbols-outlined">stylus_note</span>
        </button>
        <button className="flex items-center justify-center size-11 text-slate-500 hover:text-black dark:hover:text-white rounded-full transition-all hover:bg-white/50 dark:hover:bg-white/5">
          <span className="material-symbols-outlined">history</span>
        </button>
        <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-2"></div>
        <button
          onClick={onEndSession}
          className="flex items-center gap-3 px-6 py-2.5 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-all text-xs font-semibold tracking-wide"
        >
          <span className="material-symbols-outlined !text-[18px]">call_end</span>
          <span>End Session</span>
        </button>
      </div>
    </div>
  );
}
