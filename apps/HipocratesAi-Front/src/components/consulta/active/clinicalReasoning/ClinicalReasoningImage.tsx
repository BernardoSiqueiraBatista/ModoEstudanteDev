import { useEffect, useState } from 'react';

export interface ImageSource {
  title: string;
  url?: string;
}

interface ClinicalReasoningImageProps {
  src: string;
  alt: string;
  source: ImageSource;
  duration?: number;
  startDelay?: number;
}

const STATE_LABEL: Record<'starting' | 'generating' | 'completed', string> = {
  starting: 'Iniciando geração de imagem.',
  generating: 'Gerando imagem. Pode levar alguns instantes.',
  completed: 'Imagem gerada.',
};

export default function ClinicalReasoningImage({
  src,
  alt,
  source,
  duration = 4000,
  startDelay = 800,
}: ClinicalReasoningImageProps) {
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<'starting' | 'generating' | 'completed'>('starting');

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setState('generating');
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, (elapsed / duration) * 100);
        setProgress(pct);
        if (pct >= 100) {
          clearInterval(interval);
          setState('completed');
        }
      }, 16);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(startTimeout);
  }, [duration, startDelay]);

  const maskImage =
    progress === 0
      ? 'linear-gradient(to bottom, black -5%, black 100%)'
      : `linear-gradient(to bottom, transparent ${Math.max(0, progress - 5)}%, transparent ${progress}%, black ${Math.min(100, progress + 5)}%)`;

  return (
    <div className="flex flex-col gap-2 mt-3">
      <span
        className="shimmer-text text-[11px] font-medium tracking-wide bg-clip-text text-transparent"
        style={{
          backgroundImage:
            'linear-gradient(110deg, #94a3b8 35%, #0f172a 50%, #94a3b8 75%)',
        }}
      >
        {STATE_LABEL[state]}
      </span>
      <div className="relative rounded-2xl border border-slate-200/70 bg-white/40 max-w-full overflow-hidden">
        <img src={src} alt={alt} className="block w-full h-auto" />
        <div
          className="absolute inset-x-0 pointer-events-none backdrop-blur-3xl bg-white/30 transition-opacity duration-500"
          style={{
            top: 0,
            height: '125%',
            opacity: state === 'completed' ? 0 : 1,
            clipPath: `polygon(0 ${progress}%, 100% ${progress}%, 100% 100%, 0 100%)`,
            WebkitMaskImage: maskImage,
            maskImage,
          }}
        />
      </div>
      {state === 'completed' && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="material-symbols-outlined !text-[12px] text-slate-400">link</span>
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-slate-500 hover:text-accent-blue uppercase tracking-widest underline decoration-dotted"
            >
              Fonte: {source.title}
            </a>
          ) : (
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">
              Fonte: {source.title}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
