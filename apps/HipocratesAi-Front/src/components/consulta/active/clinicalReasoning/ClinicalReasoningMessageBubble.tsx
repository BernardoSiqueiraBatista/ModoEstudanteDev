import { useEffect, useMemo, useState } from 'react';
import ClinicalReasoningImage, {
  type ImageSource,
} from './ClinicalReasoningImage';

export interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
  streaming?: boolean;
  image?: { src: string; alt: string; source: ImageSource };
}

interface ClinicalReasoningMessageBubbleProps {
  message: Message;
  onStreamEnd?: (id: string) => void;
}

// Reveal palavra-a-palavra estilo ChatGPT: cada token monta com fade-in (CSS),
// o intervalo controla a cadência e a animação se sobrepõe entre tokens
// próximos para criar o fluxo contínuo em vez de pop staccato.
function useChatGPTReveal(text: string, enabled: boolean, intervalMs = 65) {
  const tokens = useMemo(() => text.match(/\S+\s*/g) ?? [], [text]);
  const [count, setCount] = useState(enabled ? 0 : tokens.length);

  useEffect(() => {
    if (!enabled) {
      setCount(tokens.length);
      return;
    }
    setCount(0);
    if (tokens.length === 0) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= tokens.length) window.clearInterval(id);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [tokens, enabled, intervalMs]);

  return { tokens, revealedCount: count, done: count >= tokens.length };
}

export default function ClinicalReasoningMessageBubble({
  message,
  onStreamEnd,
}: ClinicalReasoningMessageBubbleProps) {
  const isAI = message.sender === 'ai';
  const animate = !!message.streaming && isAI;
  const { tokens, revealedCount, done } = useChatGPTReveal(message.text, animate);

  // Avisa o pai exatamente uma vez para "consumir" o flag de streaming —
  // assim re-renders/reabertura do popup não fazem a animação tocar de novo.
  useEffect(() => {
    if (animate && done) onStreamEnd?.(message.id);
  }, [animate, done, message.id, onStreamEnd]);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[14px] leading-relaxed text-slate-700 font-light">
        {animate
          ? tokens.slice(0, revealedCount).map((tok, i) => (
              <span key={i} className="hipo-token">
                {tok}
              </span>
            ))
          : message.text}
      </p>
      {done && message.image && (
        <ClinicalReasoningImage
          src={message.image.src}
          alt={message.image.alt}
          source={message.image.source}
        />
      )}
      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
        {isAI ? 'Assistente Clínico' : 'Dr. Hipócrates'}
      </span>
    </div>
  );
}
