// components/clinicalReasoning/ClinicalReasoningPopup.tsx
import React, { useState, useRef, useEffect } from 'react';
import ClinicalReasoningHeader from './clinicalReasoning/ClinicalReasoningHeader';
import ClinicalReasoningMessageList from './clinicalReasoning/ClinicalReasoningMessageList';
import ClinicalReasoningFooter from './clinicalReasoning/ClinicalReasoningFooter';

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
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
  isMaximized,
  patientName = '',
  duration = '',
  onClose, 
  onMinimize, 
  onExpand,
  onMaximize,
  onBack
}: ClinicalReasoningPopupProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Estou analisando o contexto atual. Como posso auxiliar seu raciocínio?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const popupRef = useRef<HTMLDivElement>(null);

  // Carregar posição salva do localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('clinicalReasoningPosition');
    if (savedPosition) {
      const { x, y } = JSON.parse(savedPosition);
      const maxX = window.innerWidth - 420;
      const maxY = window.innerHeight - 600;
      setPosition({
        x: Math.min(Math.max(0, x), maxX),
        y: Math.min(Math.max(0, y), maxY),
      });
    } else {
      const windowWidth = window.innerWidth;
      setPosition({
        x: windowWidth - 460,
        y: 100,
      });
    }
  }, []);

  // Salvar posição quando mudar
  const savePosition = (x: number, y: number) => {
    localStorage.setItem('clinicalReasoningPosition', JSON.stringify({ x, y }));
  };

  // Lógica de arrastar
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
    if (isDragging && popupRef.current) {
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      
      const maxX = window.innerWidth - popupRef.current.offsetWidth;
      const maxY = window.innerHeight - popupRef.current.offsetHeight;
      
      newX = Math.min(Math.max(0, newX), maxX);
      newY = Math.min(Math.max(0, newY), maxY);
      
      setPosition({ x: newX, y: newY });
    }
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

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Analisando sua pergunta... Com base nos dados disponíveis, recomendo considerar os seguintes pontos para sua decisão clínica.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
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
    };
    setMessages(prev => [...prev, aiMessage]);
  };

  if (!isOpen) return null;
  
  // Versão minimizada
  if (isMinimized) {
    return (
      <div
        ref={popupRef}
        className="fixed z-[9999] w-[420px] rounded-[32px] overflow-hidden shadow-2xl"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
      className="fixed z-[9999] w-[420px] max-h-[600px] rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
      
      <ClinicalReasoningMessageList messages={messages} />
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
