import React from 'react';

interface MessageBubbleProps {
  speaker: 'MD' | 'PT' | 'AI';
  text: string;
  isAI?: boolean;
}

export default function MessageBubble({ speaker, text, isAI }: MessageBubbleProps) {
  const getSpeakerLabel = () => {
    if (speaker === 'MD') return 'MD.';
    if (speaker === 'PT') return 'PT.';
    return 'AI.';
  };

  const getSpeakerColor = () => {
    if (speaker === 'MD') return 'text-slate-300 dark:text-slate-600';
    if (speaker === 'PT') return 'text-slate-300 dark:text-slate-600';
    return 'text-accent-blue/40';
  };

  const getTextStyle = () => {
    if (isAI) {
      return 'text-spacing-intellectual text-lg font-light text-slate-300 dark:text-slate-600 italic';
    }
    if (speaker === 'MD') {
      return 'text-spacing-intellectual text-lg font-normal text-slate-800 dark:text-slate-200';
    }
    return 'text-spacing-intellectual text-lg font-light text-slate-600 dark:text-slate-400';
  };

  return (
    <div className="flex gap-12 group">
      <span
        className={`text-[9px] font-semibold uppercase w-12 mt-3 shrink-0 tracking-ultra ${getSpeakerColor()}`}
      >
        {getSpeakerLabel()}
      </span>
      <div className="flex-1">
        <p className={getTextStyle()}>{text}</p>
      </div>
    </div>
  );
}
