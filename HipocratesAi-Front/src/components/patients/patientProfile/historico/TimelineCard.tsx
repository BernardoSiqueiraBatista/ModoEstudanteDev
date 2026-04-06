import React, { useState } from 'react';
import type { TimelineEvent } from '../../../../types/PatientTypes';

interface TimelineCardProps {
  event: TimelineEvent;
  index: number;
}

export default function TimelineCard({ event, index }: TimelineCardProps) {
  const [isExpanded, setIsExpanded] = useState(event.isExpanded || false);
  const isLatest = index === 0;
  const opacityClass = index === 0 ? 'opacity-100' : index === 1 ? 'opacity-60' : 'opacity-40';

  return (
    <div className={`relative flex flex-col items-center ${opacityClass} hover:opacity-100 transition-opacity duration-500`}>
      <div className="absolute top-0 -translate-y-1/2 bg-white px-5 py-1.5 rounded-full border border-elite-border text-[9px] font-semibold text-elite-gray uppercase tracking-[0.2em]">
        {event.date}
      </div>

      <div className="liquid-glass w-full max-w-2xl rounded-[2rem] p-8 mt-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-[10px] font-semibold text-elite-gray mb-2 uppercase tracking-widest">
              {event.specialty} • {event.doctor}
            </div>
            <h2 className="text-lg font-medium text-elite-graphite leading-tight">{event.title}</h2>
          </div>
          <button onClick={() => setIsExpanded(!isExpanded)} className="cursor-pointer">
            <span className="material-symbols-outlined text-elite-silver">
              {isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            </span>
          </button>
        </div>

        {isExpanded && (
          <>
            {event.hypotheses && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {event.hypotheses.map((hyp, idx) => (
                  <div key={hyp.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="size-1.5 bg-elite-graphite rounded-full opacity-20" />
                      <span className="text-[10px] font-bold text-elite-gray uppercase tracking-widest">
                        {idx === 0 ? 'Hipótese Ativa' : 'Hipótese em Investigação'}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium">{hyp.title}</h4>
                    <p className="text-[13px] text-elite-gray leading-relaxed font-light">
                      {hyp.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {event.tags && (
              <div className="flex flex-wrap gap-2 mt-5">
                {event.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] text-elite-gray border border-elite-border px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {event.quote && (
              <p className="text-[13px] text-elite-gray mt-4 italic font-light">{event.quote}</p>
            )}

            {isLatest && event.confidence && (
              <div className="mt-6 pt-5 border-t border-black/[0.03] flex justify-between items-center">
                <button className="text-[9px] font-bold text-elite-graphite/40 hover:text-elite-graphite transition-colors uppercase tracking-[0.2em] flex items-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined text-sm">subject</span>
                  Racional AI
                </button>
                <span className="text-[10px] text-elite-silver font-light italic">
                  Confiança: {event.confidence}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}