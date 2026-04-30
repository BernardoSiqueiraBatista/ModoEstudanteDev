import type { RedFlag } from '../../../lib/flagMatcher';
import TranscriptWithFlags from './TranscriptWithFlags';

interface MessageBubbleProps {
  speaker: 'MD' | 'PT' | 'AI';
  text: string;
  isAI?: boolean;
  flags?: RedFlag[];
}

export default function MessageBubble({ speaker, text, isAI, flags = [] }: MessageBubbleProps) {
  const speakerLabel = speaker === 'MD' ? 'MD.' : speaker === 'PT' ? 'PT.' : 'AI.';
  const speakerColor =
    speaker === 'AI'
      ? 'text-accent-blue/40'
      : 'text-slate-300 dark:text-slate-600';

  const textClass = isAI
    ? 'text-spacing-intellectual text-lg font-light text-slate-300 dark:text-slate-600 italic'
    : speaker === 'MD'
      ? 'text-spacing-intellectual text-lg font-normal text-slate-800 dark:text-slate-200'
      : 'text-spacing-intellectual text-lg font-light text-slate-600 dark:text-slate-400';

  return (
    <div className="flex gap-12 group">
      <span
        className={`text-[9px] font-semibold uppercase w-12 mt-3 shrink-0 tracking-ultra ${speakerColor}`}
      >
        {speakerLabel}
      </span>
      <div className="flex-1">
        {flags.length > 0 ? (
          <TranscriptWithFlags text={text} flags={flags} className={textClass} />
        ) : (
          <p className={textClass}>{text}</p>
        )}
      </div>
    </div>
  );
}
