// components/clinicalReasoning/ClinicalReasoningPopup.tsx
import { useState, useRef, useEffect } from 'react';
import ClinicalReasoningHeader from './clinicalReasoning/ClinicalReasoningHeader';
import ClinicalReasoningMessageList from './clinicalReasoning/ClinicalReasoningMessageList';
import ClinicalReasoningFooter from './clinicalReasoning/ClinicalReasoningFooter';
import type { Message } from './clinicalReasoning/ClinicalReasoningMessageBubble';

// Hook para o RAG existente que já alimenta as outras features. Quando o
// backend expor um endpoint de raciocínio com imagem, plugamos aqui.
// Por enquanto detectamos a intenção de imagem por palavras-chave e
// devolvemos um payload mock pronto para ser substituído pelo retorno real
// do RAG (image_url + source_title + source_url).
const IMAGE_TRIGGERS = [
  'imagem',
  'figura',
  'raio-x',
  'raio x',
  'rx',
  'tomografia',
  'tc ',
  'ressonância',
  'ressonancia',
  'ecg',
  'eletrocardiograma',
  'ultrassom',
  'usg',
  'mostre',
  'mostrar',
];

function shouldGenerateImage(prompt: string) {
  const lower = prompt.toLowerCase();
  return IMAGE_TRIGGERS.some(t => lower.includes(t));
}

function buildImageResponse(prompt: string): {
  text: string;
  image: NonNullable<Message['image']>;
} {
  const lower = prompt.toLowerCase();
  if (lower.includes('ecg') || lower.includes('eletrocardiograma')) {
    return {
      text: 'Aqui está um traçado de eletrocardiograma de 12 derivações compatível com o quadro descrito. Observe o padrão de onda ST e ritmo sinusal.',
      image: {
        src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/12leadECG.jpg/640px-12leadECG.jpg',
        alt: 'Eletrocardiograma de 12 derivações',
        source: {
          title: 'UpToDate — ECG Interpretation',
          url: 'https://www.uptodate.com/contents/ecg-tutorial-basic-principles-of-ecg-analysis',
        },
      },
    };
  }
  if (lower.includes('tomografia') || lower.includes('tc ') || lower.includes('rx') || lower.includes('raio')) {
    return {
      text: 'Imagem radiológica de referência para o achado discutido. A correlação com os sintomas relatados deve guiar a próxima conduta.',
      image: {
        src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Chest_Xray_PA_3-8-2010.png/640px-Chest_Xray_PA_3-8-2010.png',
        alt: 'Radiografia de tórax PA',
        source: {
          title: 'Radiopaedia — Chest X-ray Atlas',
          url: 'https://radiopaedia.org/articles/chest-radiograph',
        },
      },
    };
  }
  return {
    text: 'Recuperei uma imagem clínica de referência no nosso acervo. Confira abaixo com a citação da fonte.',
    image: {
      src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Chest_Xray_PA_3-8-2010.png/640px-Chest_Xray_PA_3-8-2010.png',
      alt: 'Imagem clínica de referência',
      source: {
        title: 'Hipócrates RAG — Knowledge Base',
      },
    },
  };
}

interface ClinicalReasoningPopupProps {
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  patientName?: string;
  duration?: string;
  onClose: () => void;
  onMinimize: () => void;
  onExpand: () => void;
  onMaximize: () => void;
  onBack?: () => void;
}

export default function ClinicalReasoningPopup({
  isOpen,
  isMinimized,
  isMaximized: _isMaximized,
  patientName: _patientName = '',
  duration: _duration = '',
  onClose,
  onMinimize,
  onExpand,
  onMaximize,
  onBack: _onBack,
}: ClinicalReasoningPopupProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Estou analisando o contexto atual. Como posso auxiliar seu raciocínio?',
      sender: 'ai',
      timestamp: new Date(),
      streaming: true,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const popupRef = useRef<HTMLDivElement>(null);

  const getParentRect = () => {
    const parent = popupRef.current?.offsetParent as HTMLElement | null;
    return parent?.getBoundingClientRect() ?? null;
  };

  const clampPosition = (x: number, y: number) => {
    const parent = popupRef.current?.offsetParent as HTMLElement | null;
    const popup = popupRef.current;
    if (!parent || !popup) return { x: Math.max(0, x), y: Math.max(0, y) };
    const maxX = Math.max(0, parent.clientWidth - popup.offsetWidth);
    const maxY = Math.max(0, parent.clientHeight - popup.offsetHeight);
    return {
      x: Math.min(Math.max(0, x), maxX),
      y: Math.min(Math.max(0, y), maxY),
    };
  };

  // Posição inicial: ancorada bottom-right da tela de transcrição (bottom-32 right-12 do teste.html).
  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      const parent = popupRef.current?.offsetParent as HTMLElement | null;
      const popup = popupRef.current;
      if (!parent || !popup) return;
      const saved = localStorage.getItem('clinicalReasoningPosition');
      if (saved) {
        const { x, y } = JSON.parse(saved);
        setPosition(clampPosition(x, y));
      } else {
        setPosition(
          clampPosition(
            parent.clientWidth - popup.offsetWidth - 48,
            parent.clientHeight - popup.offsetHeight - 128,
          ),
        );
      }
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen, isMinimized]);

  const savePosition = (x: number, y: number) => {
    localStorage.setItem('clinicalReasoningPosition', JSON.stringify({ x, y }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = popupRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !popupRef.current) return;
    const parentRect = getParentRect();
    if (!parentRect) return;
    const next = clampPosition(
      e.clientX - parentRect.left - dragOffset.x,
      e.clientY - parentRect.top - dragOffset.y,
    );
    setPosition(next);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      savePosition(position.x, position.y);
    }
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Re-clampa quando a tela muda de tamanho para o popup nunca ficar fora.
  useEffect(() => {
    const onResize = () => setPosition(prev => clampPosition(prev.x, prev.y));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const prompt = inputValue;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: prompt,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    setTimeout(() => {
      const wantsImage = shouldGenerateImage(prompt);
      const aiMessage: Message = wantsImage
        ? {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            timestamp: new Date(),
            streaming: true,
            ...buildImageResponse(prompt),
          }
        : {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            timestamp: new Date(),
            streaming: true,
            text: 'Analisando sua pergunta... Com base nos dados disponíveis, recomendo considerar os seguintes pontos para sua decisão clínica.',
          };
      setMessages(prev => [...prev, aiMessage]);
    }, 600);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (responseText: string) => {
    const aiMessage: Message = {
      id: Date.now().toString(),
      text: responseText,
      sender: 'ai',
      timestamp: new Date(),
      streaming: true,
    };
    setMessages(prev => [...prev, aiMessage]);
  };

  if (!isOpen) return null;
  
  // Versão minimizada
  if (isMinimized) {
    return (
      <div
        ref={popupRef}
        className="absolute z-40 w-[400px] rounded-[32px] overflow-hidden"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          background: 'transparent',
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.18)',
        }}
      >
        <ClinicalReasoningHeader
          onClose={onClose}
          onMinimize={onMinimize}
          onExpand={onExpand}
          onMaximize={onMaximize}
          isMinimized={isMinimized}
          isMaximized={false}
          onMouseDown={handleMouseDown}
        />
      </div>
    );
  }

  // Versão normal (expandida)
  return (
    <div
      ref={popupRef}
      className="absolute z-40 w-[400px] max-h-[600px] rounded-[32px] overflow-hidden flex flex-col"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        background: 'transparent',
        backdropFilter: 'blur(24px) saturate(140%)',
        WebkitBackdropFilter: 'blur(24px) saturate(140%)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.18)',
      }}
    >
      <ClinicalReasoningHeader 
        onClose={onClose} 
        onMinimize={onMinimize}
        onExpand={onExpand}
        onMaximize={onMaximize}
        isMinimized={isMinimized}
        isMaximized={false}
        onMouseDown={handleMouseDown} 
      />
      
      <ClinicalReasoningMessageList
        messages={messages}
        onStreamEnd={id =>
          setMessages(prev =>
            prev.map(m => (m.id === id ? { ...m, streaming: false } : m)),
          )
        }
      />
      <ClinicalReasoningFooter
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
        onKeyPress={handleKeyPress}
        onQuickAction={handleQuickAction}
      />
    </div>
  );
}
