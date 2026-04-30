import { useMemo, useState, useRef, useEffect } from 'react';
import type { RedFlag } from '../../../lib/flagMatcher';

interface TranscriptWithFlagsProps {
  text: string;
  flags: RedFlag[];
  className?: string;
}

interface Segment {
  type: 'plain' | 'flagged';
  text: string;
  flag?: RedFlag;
}

/**
 * Quebra o texto do transcript nos pontos onde existem `flag.phrase`,
 * preservando o conteúdo restante. Cada flag aparece no máximo uma vez
 * por ocorrência da phrase no texto.
 */
function segmentText(text: string, flags: RedFlag[]): Segment[] {
  if (flags.length === 0) return [{ type: 'plain', text }];

  // Para evitar sobreposição entre flags com phrases que se contêm,
  // ordenamos por comprimento descendente e marcamos as posições já cobertas.
  const sorted = [...flags].sort((a, b) => b.phrase.length - a.phrase.length);

  // Localizamos todas as ocorrências (case/diacritic-insensitive) e guardamos
  // os índices originais.
  const normText = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  interface Hit {
    start: number;
    end: number;
    flag: RedFlag;
  }
  const hits: Hit[] = [];
  for (const flag of sorted) {
    const target = flag.phrase
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
    if (!target) continue;
    let from = 0;
    while (true) {
      const idx = normText.indexOf(target, from);
      if (idx === -1) break;
      const end = idx + target.length;
      // Rejeita se já houver hit cobrindo este intervalo
      const overlaps = hits.some(h => !(end <= h.start || idx >= h.end));
      if (!overlaps) hits.push({ start: idx, end, flag });
      from = end;
    }
  }

  hits.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const hit of hits) {
    if (hit.start > cursor) {
      segments.push({ type: 'plain', text: text.slice(cursor, hit.start) });
    }
    segments.push({
      type: 'flagged',
      text: text.slice(hit.start, hit.end),
      flag: hit.flag,
    });
    cursor = hit.end;
  }
  if (cursor < text.length) {
    segments.push({ type: 'plain', text: text.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ type: 'plain', text }];
}

interface FlagPopoverProps {
  flag: RedFlag;
}

function severityClasses(severity: RedFlag['severity']) {
  if (severity === 'critical') {
    return {
      underline: 'decoration-red-500',
      dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
      badge: 'text-red-500/90 bg-red-50/80 border-red-100/70',
      icon: 'text-red-500',
    };
  }
  if (severity === 'warning') {
    return {
      underline: 'decoration-rose-500',
      dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
      badge: 'text-rose-500/90 bg-rose-50/80 border-rose-100/70',
      icon: 'text-rose-500',
    };
  }
  return {
    underline: 'decoration-amber-500',
    dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    badge: 'text-amber-600/90 bg-amber-50/80 border-amber-100/70',
    icon: 'text-amber-500',
  };
}

function severityLabel(severity: RedFlag['severity']): string {
  if (severity === 'critical') return 'Risco Crítico';
  if (severity === 'warning') return 'Atenção Clínica';
  return 'Observação';
}

function FlagPopover({ flag }: FlagPopoverProps) {
  const tones = severityClasses(flag.severity);
  return (
    <div
      role="tooltip"
      className="absolute left-1/2 -translate-x-1/2 -top-3 -translate-y-full z-50 w-80 origin-bottom"
    >
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/70 dark:border-white/10 shadow-[0_18px_60px_rgba(15,23,42,0.18)] p-5 text-left">
        <div className="flex items-center gap-2 mb-3">
          <span className={`size-1.5 rounded-full ${tones.dot}`}></span>
          <p
            className={`text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border ${tones.badge}`}
          >
            {severityLabel(flag.severity)}
          </p>
        </div>
        <h5 className="text-[13px] font-semibold text-slate-900 dark:text-white leading-snug mb-2">
          {flag.title}
        </h5>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-light leading-relaxed mb-4">
          {flag.reason}
        </p>
        {flag.theory && (
          <div className="border-t border-slate-100/80 dark:border-white/10 pt-3">
            <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-1.5">
              Base Teórica
            </p>
            <p className="text-[11px] italic text-slate-500 dark:text-slate-400 font-light leading-relaxed">
              {flag.theory}
            </p>
          </div>
        )}
      </div>
      {/* Setinha apontando para a phrase */}
      <div className="flex justify-center -mt-1">
        <div className="size-2 rotate-45 bg-white/95 dark:bg-slate-900/95 border-r border-b border-white/70 dark:border-white/10 shadow-sm" />
      </div>
    </div>
  );
}

interface FlaggedSpanProps {
  segment: Segment & { type: 'flagged'; flag: RedFlag };
}

function FlaggedSpan({ segment }: FlaggedSpanProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const tones = severityClasses(segment.flag.severity);

  const show = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  };

  const hide = () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <span
      className="relative inline"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span
        tabIndex={0}
        aria-describedby={`flag-${segment.flag.insightId}`}
        className={`relative cursor-help underline decoration-solid decoration-2 underline-offset-[5px] ${tones.underline} text-slate-800 dark:text-slate-100 transition-colors`}
      >
        {segment.text}
      </span>
      {open && <FlagPopover flag={segment.flag} />}
    </span>
  );
}

export default function TranscriptWithFlags({
  text,
  flags,
  className,
}: TranscriptWithFlagsProps) {
  const segments = useMemo(() => segmentText(text, flags), [text, flags]);

  return (
    <p className={className}>
      {segments.map((seg, idx) =>
        seg.type === 'flagged' && seg.flag ? (
          <FlaggedSpan key={idx} segment={seg as Segment & { type: 'flagged'; flag: RedFlag }} />
        ) : (
          <span key={idx}>{seg.text}</span>
        ),
      )}
    </p>
  );
}
